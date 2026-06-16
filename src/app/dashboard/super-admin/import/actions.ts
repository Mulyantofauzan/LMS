'use server';

import { auth } from '@/auth';
import { db } from '@/db';
import { certificates, externalCertificates, externalCertificateTypes, jobsites, trainings, users } from '@/db/schema';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

type ImportRow = Record<string, string>;

function parseCsvRows(input: string): string[][] {
  return (input || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(',').map((cell) => cell.trim()));
}

function getRows(formData: FormData): { arrays: string[][]; objects: ImportRow[] } {
  const rowsJson = formData.get('rowsJson') as string;
  if (rowsJson) {
    const objects = JSON.parse(rowsJson) as ImportRow[];
    return {
      objects,
      arrays: objects.map((row) => Object.values(row).map((value) => String(value ?? '').trim())),
    };
  }

  const csv = formData.get('csv') as string;
  return { objects: [], arrays: parseCsvRows(csv) };
}

function field(row: ImportRow, keys: string[], fallback = '') {
  for (const key of keys) {
    if (row[key] != null && String(row[key]).trim()) return String(row[key]).trim();
  }
  return fallback;
}

function parseDate(value: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function requireSuperAdmin() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== 'super-admin' && role !== 'admin') {
    return { error: 'Anda tidak memiliki akses untuk impor data.' };
  }
  return null;
}

async function findOrCreateExternalCertificateType(name: string, issuer: string | null) {
  const existing = await db.select({ id: externalCertificateTypes.id })
    .from(externalCertificateTypes)
    .where(eq(externalCertificateTypes.name, name))
    .get();
  if (existing) return existing.id;
  const inserted = await db.insert(externalCertificateTypes).values({
    name,
    issuer,
  }).returning({ id: externalCertificateTypes.id });
  return inserted[0].id;
}

export async function importJobsites(formData: FormData) {
  const accessError = await requireSuperAdmin();
  if (accessError) return accessError;

  const { arrays: rows } = getRows(formData);
  if (rows.length === 0) return { error: 'Data CSV kosong.' };

  await db.insert(jobsites).values(rows.map(([name, location]) => ({
    name,
    location,
    settings: {},
  })));

  revalidatePath('/dashboard/super-admin/jobsites');
  return { success: true };
}

export async function importTrainings(formData: FormData) {
  const accessError = await requireSuperAdmin();
  if (accessError) return accessError;

  const { arrays: rows } = getRows(formData);
  if (rows.length === 0) return { error: 'Data CSV kosong.' };

  await db.insert(trainings).values(rows.map(([title, category, type, jobsiteId]) => ({
    title,
    category,
    type: type || 'offline',
    jobsiteId: jobsiteId ? Number(jobsiteId) : null,
    isMandatory: false,
  })));

  revalidatePath('/dashboard/site-admin/trainings');
  return { success: true };
}

export async function importUsers(formData: FormData) {
  const accessError = await requireSuperAdmin();
  if (accessError) return accessError;

  const defaultPassword = (formData.get('defaultPassword') as string) || 'password123';
  if (defaultPassword.length < 6) return { error: 'Password default minimal 6 karakter.' };

  const { arrays, objects } = getRows(formData);
  if (arrays.length === 0) return { error: 'Data import kosong.' };

  const values = await Promise.all((objects.length ? objects : arrays.map(([nrp, name, email, role, jobsiteId, department, position, password]) => ({
    nrp,
    name,
    email,
    role,
    jobsiteId,
    department,
    position,
    password,
  }))).map(async (row) => {
    const password = field(row, ['password'], defaultPassword);
    return {
      nrp: field(row, ['nrp', 'NRP']),
      name: field(row, ['name', 'nama']),
      email: field(row, ['email']),
      role: field(row, ['role', 'peran'], 'trainee'),
      jobsiteId: field(row, ['jobsiteId', 'jobsite_id', 'siteId']) ? Number(field(row, ['jobsiteId', 'jobsite_id', 'siteId'])) : null,
      department: field(row, ['department', 'departemen']),
      position: field(row, ['position', 'posisi']),
      passwordHash: await bcrypt.hash(password, 10),
    };
  }));

  await db.insert(users).values(values);

  revalidatePath('/dashboard/super-admin/users');
  revalidatePath('/dashboard/site-admin/users');
  return { success: true };
}

export async function importCertificates(formData: FormData) {
  const accessError = await requireSuperAdmin();
  if (accessError) return accessError;
  const session = await auth();
  const inputBy = Number((session?.user as { id?: string | number | null } | undefined)?.id) || null;

  const { arrays, objects } = getRows(formData);
  if (arrays.length === 0) return { error: 'Data import kosong.' };

  const internalValues = [];
  const externalValues = [];
  for (const row of (objects.length ? objects : arrays.map(([userEmail, trainingTitle, certNumber, issueDate, expiryDate, url, certificateType, issuer]) => ({
    userEmail,
    trainingTitle,
    certNumber,
    issueDate,
    expiryDate,
    url,
    certificateType,
    issuer,
  })))) {
    const userEmail = field(row, ['userEmail', 'email']);
    const trainingTitle = field(row, ['trainingTitle', 'training', 'pelatihan']);
    const certificateType = field(row, ['certificateType', 'externalType', 'jenisSertifikat', 'type']);
    const certNumber = field(row, ['certNumber', 'cert_no', 'certificateNumber']);
    if (!userEmail || !certNumber) continue;

    const targetUser = await db.select({ id: users.id }).from(users).where(eq(users.email, userEmail)).get();
    if (!targetUser) continue;

    const targetTraining = trainingTitle
      ? await db.select({ id: trainings.id }).from(trainings).where(eq(trainings.title, trainingTitle)).get()
      : null;
    if (targetTraining) {
      internalValues.push({
        userId: targetUser.id,
        trainingId: targetTraining.id,
        certNumber,
        issueDate: parseDate(field(row, ['issueDate', 'issued'])) ?? new Date(),
        expiryDate: parseDate(field(row, ['expiryDate', 'expiry'])),
        url: field(row, ['url']),
      });
      continue;
    }

    const typeName = certificateType || trainingTitle;
    if (!typeName) continue;
    const issuer = field(row, ['issuer', 'penerbit']) || null;
    const typeId = await findOrCreateExternalCertificateType(typeName, issuer);
    externalValues.push({
      userId: targetUser.id,
      typeId,
      certNumber,
      issuer,
      issueDate: parseDate(field(row, ['issueDate', 'issued'])) ?? new Date(),
      expiryDate: parseDate(field(row, ['expiryDate', 'expiry'])),
      notes: field(row, ['notes', 'catatan']) || null,
      inputBy,
    });
  }

  if (internalValues.length === 0 && externalValues.length === 0) {
    return { error: 'Tidak ada sertifikat valid untuk diimpor.' };
  }
  if (internalValues.length > 0) await db.insert(certificates).values(internalValues);
  if (externalValues.length > 0) {
    await db.insert(externalCertificates).values(externalValues).onConflictDoNothing({
      target: externalCertificates.certNumber,
    });
  }

  revalidatePath('/dashboard/site-admin/certificates');
  revalidatePath('/dashboard/site-admin/external-certificates');
  revalidatePath('/dashboard/super-admin/external-certifications');
  revalidatePath('/dashboard/certificates');
  revalidatePath('/dashboard/passport');
  revalidatePath('/dashboard/trainee/certificates');
  revalidatePath('/dashboard/trainee/passport');
  return { success: true };
}

export async function importJobsitesForm(formData: FormData): Promise<void> {
  await importJobsites(formData);
}

export async function importUsersForm(formData: FormData): Promise<void> {
  await importUsers(formData);
}

export async function importTrainingsForm(formData: FormData): Promise<void> {
  await importTrainings(formData);
}

export async function importCertificatesForm(formData: FormData): Promise<void> {
  await importCertificates(formData);
}
