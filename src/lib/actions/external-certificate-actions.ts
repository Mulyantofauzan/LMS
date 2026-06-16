'use server';

import { auth } from '@/auth';
import { db } from '@/db';
import {
  externalCertificateEquivalencies,
  externalCertificates,
  externalCertificateTypes,
  jobsites,
  trainingRequirementExclusions,
  trainingRequirements,
  users,
} from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { canSiteAdminAccessUser } from '@/lib/tna';

type SessionUser = {
  id?: string | number | null;
  role?: string | null;
};

function parseDate(value: FormDataEntryValue | null) {
  const text = String(value ?? '').trim();
  if (!text) return null;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function requireCertificateAdmin() {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  const role = user?.role;
  const userId = Number(user?.id);
  if (!userId || !['super-admin', 'admin', 'site-admin'].includes(role ?? '')) {
    return { error: 'Anda tidak memiliki akses mengelola sertifikasi eksternal.' } as const;
  }
  return { role: role!, userId } as const;
}

async function assertUserAccess(role: string, actorId: number, targetUserId: number) {
  if (role !== 'site-admin') return null;
  const allowed = await canSiteAdminAccessUser(actorId, targetUserId);
  return allowed ? null : { error: 'Anda hanya dapat mengelola karyawan di site Anda.' };
}

async function getActorSiteId(actorId: number) {
  const current = await db.select({ jobsiteId: users.jobsiteId }).from(users).where(eq(users.id, actorId)).get();
  return current?.jobsiteId ?? null;
}

async function assertRequirementAccess(role: string, actorId: number, requirementId: number) {
  if (role !== 'site-admin') return null;
  const actorSiteId = await getActorSiteId(actorId);
  if (!actorSiteId) return { error: 'Site Anda tidak ditemukan.' };
  const requirement = await db.select({
    jobsiteId: trainingRequirements.jobsiteId,
    userId: trainingRequirements.userId,
  })
    .from(trainingRequirements)
    .where(eq(trainingRequirements.id, requirementId))
    .get();
  if (!requirement) return { error: 'Requirement tidak ditemukan.' };
  if (requirement.jobsiteId === actorSiteId) return null;
  if (requirement.userId) return assertUserAccess(role, actorId, requirement.userId);
  return { error: 'Anda hanya dapat mengelola TNA untuk site Anda.' };
}

function revalidateCertificatePages() {
  revalidatePath('/dashboard/certificates');
  revalidatePath('/dashboard/passport');
  revalidatePath('/dashboard/trainee/certificates');
  revalidatePath('/dashboard/trainee/passport');
  revalidatePath('/dashboard/site-admin/certificates');
  revalidatePath('/dashboard/site-admin/external-certificates');
  revalidatePath('/dashboard/site-admin/tna');
  revalidatePath('/dashboard/super-admin/external-certifications');
  revalidatePath('/dashboard/super-admin/tna');
}

export async function createExternalCertificateType(formData: FormData) {
  const access = await requireCertificateAdmin();
  if ('error' in access) return access;
  if (access.role === 'site-admin') return { error: 'Hanya super-admin yang dapat membuat master sertifikasi eksternal.' };

  const name = String(formData.get('name') ?? '').trim();
  const issuer = String(formData.get('issuer') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const defaultValidityMonths = Number(formData.get('defaultValidityMonths')) || null;
  if (!name) return { error: 'Nama sertifikasi wajib diisi.' };

  await db.insert(externalCertificateTypes).values({
    name,
    issuer: issuer || null,
    description: description || null,
    defaultValidityMonths,
  }).onConflictDoUpdate({
    target: externalCertificateTypes.name,
    set: {
      issuer: issuer || null,
      description: description || null,
      defaultValidityMonths,
    },
  });
  revalidateCertificatePages();
  return { success: true };
}

export async function deleteExternalCertificateType(id: number) {
  const access = await requireCertificateAdmin();
  if ('error' in access) return access;
  if (access.role === 'site-admin') return { error: 'Hanya super-admin yang dapat menghapus master sertifikasi eksternal.' };
  await db.delete(externalCertificateTypes).where(eq(externalCertificateTypes.id, id));
  revalidateCertificatePages();
  return { success: true };
}

export async function createExternalEquivalency(formData: FormData) {
  const access = await requireCertificateAdmin();
  if ('error' in access) return access;
  if (access.role === 'site-admin') return { error: 'Hanya super-admin yang dapat membuat ekuivalensi.' };

  const externalTypeId = Number(formData.get('externalTypeId'));
  const trainingId = Number(formData.get('trainingId'));
  if (!externalTypeId || !trainingId) return { error: 'Sertifikasi eksternal dan training wajib dipilih.' };

  await db.insert(externalCertificateEquivalencies).values({ externalTypeId, trainingId })
    .onConflictDoNothing();
  revalidateCertificatePages();
  return { success: true };
}

export async function deleteExternalEquivalency(id: number) {
  const access = await requireCertificateAdmin();
  if ('error' in access) return access;
  if (access.role === 'site-admin') return { error: 'Hanya super-admin yang dapat menghapus ekuivalensi.' };
  await db.delete(externalCertificateEquivalencies).where(eq(externalCertificateEquivalencies.id, id));
  revalidateCertificatePages();
  return { success: true };
}

export async function createExternalCertificate(formData: FormData) {
  const access = await requireCertificateAdmin();
  if ('error' in access) return access;

  const userId = Number(formData.get('userId'));
  const typeId = Number(formData.get('typeId'));
  const certNumber = String(formData.get('certNumber') ?? '').trim();
  const issuer = String(formData.get('issuer') ?? '').trim();
  const notes = String(formData.get('notes') ?? '').trim();
  const issueDate = parseDate(formData.get('issueDate')) ?? new Date();
  const expiryDate = parseDate(formData.get('expiryDate'));
  if (!userId || !typeId || !certNumber) return { error: 'Karyawan, jenis sertifikasi, dan nomor sertifikat wajib diisi.' };

  const accessError = await assertUserAccess(access.role, access.userId, userId);
  if (accessError) return accessError;

  await db.insert(externalCertificates).values({
    userId,
    typeId,
    certNumber,
    issuer: issuer || null,
    issueDate,
    expiryDate,
    notes: notes || null,
    inputBy: access.userId,
  });
  revalidateCertificatePages();
  return { success: true };
}

export async function updateExternalCertificate(formData: FormData) {
  const access = await requireCertificateAdmin();
  if ('error' in access) return access;

  const id = Number(formData.get('id'));
  const userId = Number(formData.get('userId'));
  const typeId = Number(formData.get('typeId'));
  const certNumber = String(formData.get('certNumber') ?? '').trim();
  if (!id || !userId || !typeId || !certNumber) return { error: 'Data sertifikat tidak lengkap.' };

  const accessError = await assertUserAccess(access.role, access.userId, userId);
  if (accessError) return accessError;
  const current = await db.select({ userId: externalCertificates.userId })
    .from(externalCertificates)
    .where(eq(externalCertificates.id, id))
    .get();
  if (!current) return { error: 'Sertifikat tidak ditemukan.' };
  const currentAccessError = await assertUserAccess(access.role, access.userId, current.userId);
  if (currentAccessError) return currentAccessError;

  await db.update(externalCertificates).set({
    userId,
    typeId,
    certNumber,
    issuer: String(formData.get('issuer') ?? '').trim() || null,
    issueDate: parseDate(formData.get('issueDate')) ?? new Date(),
    expiryDate: parseDate(formData.get('expiryDate')),
    notes: String(formData.get('notes') ?? '').trim() || null,
  }).where(eq(externalCertificates.id, id));
  revalidateCertificatePages();
  return { success: true };
}

export async function deleteExternalCertificate(id: number) {
  const access = await requireCertificateAdmin();
  if ('error' in access) return access;
  const current = await db.select({ userId: externalCertificates.userId })
    .from(externalCertificates)
    .where(eq(externalCertificates.id, id))
    .get();
  if (!current) return { error: 'Sertifikat tidak ditemukan.' };
  const accessError = await assertUserAccess(access.role, access.userId, current.userId);
  if (accessError) return accessError;
  await db.delete(externalCertificates).where(eq(externalCertificates.id, id));
  revalidateCertificatePages();
  return { success: true };
}

export async function createTrainingRequirement(formData: FormData) {
  const access = await requireCertificateAdmin();
  if ('error' in access) return access;

  const trainingId = Number(formData.get('trainingId'));
  const scope = String(formData.get('scope') ?? 'global');
  const requirementType = String(formData.get('requirementType') ?? 'mandatory');
  const recurrence = String(formData.get('recurrence') ?? 'once');
  const requestedJobsiteId = Number(formData.get('jobsiteId')) || null;
  const userId = Number(formData.get('userId')) || null;
  if (!trainingId) return { error: 'Training wajib dipilih.' };
  if (access.role === 'site-admin' && scope === 'global') return { error: 'Site-admin tidak dapat membuat TNA global.' };
  const actorSiteId = access.role === 'site-admin' ? await getActorSiteId(access.userId) : null;
  if (access.role === 'site-admin' && !actorSiteId) return { error: 'Site Anda tidak ditemukan.' };
  if (access.role === 'site-admin' && userId) {
    const accessError = await assertUserAccess(access.role, access.userId, userId);
    if (accessError) return accessError;
  }
  if (access.role === 'site-admin' && requestedJobsiteId && actorSiteId !== requestedJobsiteId) {
    return { error: 'Anda hanya dapat membuat TNA untuk site Anda.' };
  }
  if (scope === 'jobsite') {
    const jobsiteId = access.role === 'site-admin' ? actorSiteId : requestedJobsiteId;
    if (!jobsiteId) return { error: 'Jobsite wajib dipilih.' };
    const jobsite = await db.select({ id: jobsites.id }).from(jobsites).where(eq(jobsites.id, jobsiteId)).get();
    if (!jobsite) return { error: 'Jobsite tidak ditemukan.' };
  }

  await db.insert(trainingRequirements).values({
    trainingId,
    scope,
    jobsiteId: access.role === 'site-admin' ? actorSiteId : (scope === 'jobsite' ? requestedJobsiteId : null),
    department: scope === 'department' ? String(formData.get('department') ?? '').trim() || null : null,
    position: scope === 'position' ? String(formData.get('position') ?? '').trim() || null : null,
    userId: scope === 'user' ? userId : null,
    requirementType,
    recurrence,
    intervalMonths: recurrence === 'interval_months' ? Number(formData.get('intervalMonths')) || null : null,
    effectiveYear: recurrence === 'annual' ? Number(formData.get('effectiveYear')) || new Date().getFullYear() : null,
    createdBy: access.userId,
  });
  revalidateCertificatePages();
  return { success: true };
}

export async function deleteTrainingRequirement(id: number) {
  const access = await requireCertificateAdmin();
  if ('error' in access) return access;
  const accessError = await assertRequirementAccess(access.role, access.userId, id);
  if (accessError) return accessError;
  await db.delete(trainingRequirements).where(eq(trainingRequirements.id, id));
  revalidateCertificatePages();
  return { success: true };
}

export async function createRequirementExclusion(formData: FormData) {
  const access = await requireCertificateAdmin();
  if ('error' in access) return access;
  const requirementId = Number(formData.get('requirementId'));
  const userId = Number(formData.get('userId'));
  const reason = String(formData.get('reason') ?? '').trim();
  if (!requirementId || !userId) return { error: 'Requirement dan karyawan wajib dipilih.' };
  const requirementAccessError = await assertRequirementAccess(access.role, access.userId, requirementId);
  if (requirementAccessError) return requirementAccessError;
  const accessError = await assertUserAccess(access.role, access.userId, userId);
  if (accessError) return accessError;
  await db.insert(trainingRequirementExclusions).values({
    requirementId,
    userId,
    reason: reason || null,
    createdBy: access.userId,
  }).onConflictDoUpdate({
    target: [trainingRequirementExclusions.requirementId, trainingRequirementExclusions.userId],
    set: { reason: reason || null, createdBy: access.userId },
  });
  revalidateCertificatePages();
  return { success: true };
}

export async function deleteRequirementExclusion(id: number) {
  const access = await requireCertificateAdmin();
  if ('error' in access) return access;
  if (access.role === 'site-admin') {
    const exclusion = await db.select({
      requirementId: trainingRequirementExclusions.requirementId,
      userId: trainingRequirementExclusions.userId,
    })
      .from(trainingRequirementExclusions)
      .where(eq(trainingRequirementExclusions.id, id))
      .get();
    if (!exclusion) return { error: 'Pengecualian tidak ditemukan.' };
    const requirementAccessError = await assertRequirementAccess(access.role, access.userId, exclusion.requirementId);
    if (requirementAccessError) return requirementAccessError;
    const accessError = await assertUserAccess(access.role, access.userId, exclusion.userId);
    if (accessError) return accessError;
  }
  await db.delete(trainingRequirementExclusions).where(eq(trainingRequirementExclusions.id, id));
  revalidateCertificatePages();
  return { success: true };
}

export async function createExternalCertificateTypeForm(formData: FormData): Promise<void> {
  await createExternalCertificateType(formData);
}

export async function deleteExternalCertificateTypeForm(id: number): Promise<void> {
  await deleteExternalCertificateType(id);
}

export async function createExternalEquivalencyForm(formData: FormData): Promise<void> {
  await createExternalEquivalency(formData);
}

export async function deleteExternalEquivalencyForm(id: number): Promise<void> {
  await deleteExternalEquivalency(id);
}

export async function createExternalCertificateForm(formData: FormData): Promise<void> {
  await createExternalCertificate(formData);
}

export async function updateExternalCertificateForm(formData: FormData): Promise<void> {
  await updateExternalCertificate(formData);
}

export async function deleteExternalCertificateForm(id: number): Promise<void> {
  await deleteExternalCertificate(id);
}

export async function createTrainingRequirementForm(formData: FormData): Promise<void> {
  await createTrainingRequirement(formData);
}

export async function deleteTrainingRequirementForm(id: number): Promise<void> {
  await deleteTrainingRequirement(id);
}

export async function createRequirementExclusionForm(formData: FormData): Promise<void> {
  await createRequirementExclusion(formData);
}

export async function deleteRequirementExclusionForm(id: number): Promise<void> {
  await deleteRequirementExclusion(id);
}
