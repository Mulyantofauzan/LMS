'use server';

import { auth } from '@/auth';
import { db } from '@/db';
import { jobsites, trainings, users } from '@/db/schema';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

function parseCsvRows(input: string) {
  return input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(',').map((cell) => cell.trim()));
}

async function requireSuperAdmin() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== 'super-admin' && role !== 'admin') {
    return { error: 'Anda tidak memiliki akses untuk impor data.' };
  }
  return null;
}

export async function importJobsites(formData: FormData) {
  const accessError = await requireSuperAdmin();
  if (accessError) return accessError;

  const csv = formData.get('csv') as string;
  const rows = parseCsvRows(csv);
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

  const csv = formData.get('csv') as string;
  const rows = parseCsvRows(csv);
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

  const csv = formData.get('csv') as string;
  const defaultPassword = (formData.get('defaultPassword') as string) || 'password123';
  if (defaultPassword.length < 6) return { error: 'Password default minimal 6 karakter.' };

  const rows = parseCsvRows(csv);
  if (rows.length === 0) return { error: 'Data CSV kosong.' };

  const passwordHash = await bcrypt.hash(defaultPassword, 10);
  await db.insert(users).values(rows.map(([name, email, role, jobsiteId, department, position]) => ({
    name,
    email,
    role: role || 'trainee',
    jobsiteId: jobsiteId ? Number(jobsiteId) : null,
    department,
    position,
    passwordHash,
  })));

  revalidatePath('/dashboard/super-admin/users');
  revalidatePath('/dashboard/site-admin/users');
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
