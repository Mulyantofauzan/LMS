'use server';

import { db } from "@/db";
import { attendance, enrollments, evaluations, exams, trainingQuestionSets, trainingSessions, trainings, users } from "@/db/schema";
import { uploadTrainingMaterialToR2 } from "@/lib/r2-upload";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { defaultCertificateTemplateConfig, normalizeCertificateTemplateConfig } from "@/lib/certificate-template";

type SessionUser = {
  id?: string | number | null;
  role?: string | null;
};

async function getSiteAdminAccess() {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  const role = user?.role;
  if (role !== 'site-admin' && role !== 'super-admin' && role !== 'admin') {
    throw new Error('Unauthorized');
  }

  if (role === 'site-admin') {
    const currentUser = await db.select({ jobsiteId: users.jobsiteId })
      .from(users)
      .where(eq(users.id, Number(user?.id)))
      .get();
    return {
      role,
      userId: Number(user?.id),
      jobsiteId: currentUser?.jobsiteId ?? null,
    };
  }

  return {
    role,
    userId: Number(user?.id),
    jobsiteId: null,
  };
}

async function getSiteAdminJobsiteId() {
  return (await getSiteAdminAccess()).jobsiteId;
}

async function getManagedSession(sessionId: number, siteJobsiteId: number | null) {
  const item = await db.select({
    id: trainingSessions.id,
    trainingId: trainingSessions.trainingId,
    trainerId: trainingSessions.trainerId,
    status: trainingSessions.status,
    startTime: trainingSessions.startTime,
    endTime: trainingSessions.endTime,
    jobsiteId: trainings.jobsiteId,
  })
    .from(trainingSessions)
    .innerJoin(trainings, eq(trainingSessions.trainingId, trainings.id))
    .where(eq(trainingSessions.id, sessionId))
    .get();

  if (!item) return { error: 'Jadwal training tidak ditemukan.' } as const;
  if (siteJobsiteId !== null && item.jobsiteId !== siteJobsiteId) {
    return { error: 'Jadwal ini bukan milik site Anda.' } as const;
  }
  return { item } as const;
}

async function validateScheduleReferences(trainingId: number, trainerId: number, siteJobsiteId: number | null) {
  const training = await db.select({
    id: trainings.id,
    jobsiteId: trainings.jobsiteId,
    approvalStatus: trainings.approvalStatus,
  }).from(trainings).where(eq(trainings.id, trainingId)).get();
  if (!training) return { error: 'Pelatihan tidak ditemukan.' } as const;
  if (training.approvalStatus !== 'approved') {
    return { error: 'Pelatihan belum disetujui dan belum dapat dijadwalkan.' } as const;
  }
  if (siteJobsiteId !== null && training.jobsiteId !== siteJobsiteId) {
    return { error: 'Pelatihan ini bukan milik site Anda.' } as const;
  }

  const trainer = await db.select({
    id: users.id,
    role: users.role,
    jobsiteId: users.jobsiteId,
  }).from(users).where(eq(users.id, trainerId)).get();
  if (!trainer || trainer.role !== 'trainer') {
    return { error: 'Trainer tidak ditemukan.' } as const;
  }
  if (siteJobsiteId !== null && trainer.jobsiteId !== siteJobsiteId) {
    return { error: 'Trainer bukan anggota site Anda.' } as const;
  }
  if (training.jobsiteId && trainer.jobsiteId && training.jobsiteId !== trainer.jobsiteId) {
    return { error: 'Trainer dan pelatihan harus berasal dari site yang sama.' } as const;
  }

  return { success: true } as const;
}

export async function createTraining(formData: FormData) {
  try {
    const access = await getSiteAdminAccess();
    const siteJobsiteId = access.jobsiteId;
    const title = String(formData.get('title') ?? '').trim();
    const description = String(formData.get('description') ?? '').trim();
    const category = String(formData.get('category') ?? '').trim();
    const type = String(formData.get('type') ?? '').trim();
    const isMandatory = formData.get('isMandatory') === 'on';
    const jobsiteIdStr = String(formData.get('jobsiteId') ?? '');
    const trainingCode = String(formData.get('trainingCode') ?? '').trim().toUpperCase();
    const certificateEnabled = formData.get('certificateEnabled') === 'on';
    const certificateNeverExpires = formData.get('certificateNeverExpires') === 'on';
    const certificateValidityMonths = certificateNeverExpires ? null : Number(formData.get('certificateValidityMonths')) || null;
    const certificatePassingScore = Number(formData.get('certificatePassingScore')) || 70;
    const certificateNumberFormat = String(formData.get('certificateNumberFormat') ?? '').trim() || 'PST/{TRAINING_CODE}/{YEAR}/{SEQ}';
    const questionSetId = Number(formData.get('questionSetId'));

    if (!title) return { success: false, error: 'Judul pelatihan wajib diisi.' };
    if (!questionSetId) return { success: false, error: 'Paket soal wajib dipilih.' };

    const created = await db.insert(trainings).values({
      title,
      description,
      category,
      type,
      isMandatory,
      jobsiteId: siteJobsiteId ?? (jobsiteIdStr ? Number(jobsiteIdStr) : null),
      approvalStatus: 'draft',
      proposedBy: access.userId,
      trainingCode,
      certificateEnabled,
      certificateValidityMonths,
      certificatePassingScore,
      certificateNumberFormat,
    }).returning({ id: trainings.id });

    const trainingId = created[0]?.id;
    if (!trainingId) return { success: false, error: 'Pelatihan gagal dibuat.' };
    await db.insert(trainingQuestionSets).values({
      trainingId,
      questionSetId,
      approvalStatus: 'draft',
      addedBy: access.userId,
    });

    revalidatePath('/dashboard/site-admin/trainings');
    revalidatePath('/dashboard/site-admin');
    revalidatePath('/dashboard/trainer/classes');
    return { success: true, trainingId };
  } catch (error) {
    console.error('Create training failed', error);
    return { success: false, error: 'Gagal membuat pelatihan.' };
  }
}

export async function updateTraining(formData: FormData) {
  const access = await getSiteAdminAccess();
  const id = Number(formData.get('id'));
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const category = formData.get('category') as string;
  const type = formData.get('type') as string;
  const isMandatory = formData.get('isMandatory') === 'on';
  const trainingCode = String(formData.get('trainingCode') ?? '').trim().toUpperCase();
  const certificateEnabled = formData.get('certificateEnabled') === 'on';
  const certificateNeverExpires = formData.get('certificateNeverExpires') === 'on';
  const certificateValidityMonths = certificateNeverExpires ? null : Number(formData.get('certificateValidityMonths')) || null;
  const certificatePassingScore = Number(formData.get('certificatePassingScore')) || 70;
  const certificateNumberFormat = String(formData.get('certificateNumberFormat') ?? '').trim() || 'PST/{TRAINING_CODE}/{YEAR}/{SEQ}';
  const certificateTemplate = formData.get('certificateTemplate') as File | null;

  if (!id || !title) return { error: 'Data pelatihan tidak lengkap.' };
  const current = await db.select({
    jobsiteId: trainings.jobsiteId,
    approvalStatus: trainings.approvalStatus,
  }).from(trainings).where(eq(trainings.id, id)).get();
  if (!current) return { error: 'Training tidak ditemukan.' };
  if (access.jobsiteId !== null && current.jobsiteId !== access.jobsiteId) {
    return { error: 'Training ini bukan milik site Anda.' };
  }
  if (current.approvalStatus === 'pending_manager') {
    return { error: 'Pengajuan sedang ditinjau manager dan belum dapat diedit.' };
  }

  let certificateTemplateUrl: string | undefined;
  let certificateTemplateConfig: Record<string, unknown> | undefined;
  if (certificateTemplate && certificateTemplate.size > 0) {
    const uploaded = await uploadTrainingMaterialToR2(certificateTemplate, {
      prefix: `certificate-templates/${id}`,
    });
    certificateTemplateUrl = uploaded.publicUrl;
    certificateTemplateConfig = defaultCertificateTemplateConfig;
  }

  await db.update(trainings).set({
    title,
    description,
    category,
    type,
    isMandatory,
    trainingCode,
    certificateEnabled,
    certificateValidityMonths,
    certificatePassingScore,
    certificateNumberFormat,
    approvalStatus: 'draft',
    approvedBy: null,
    approvedAt: null,
    rejectionReason: null,
    ...(certificateTemplateUrl ? { certificateTemplateUrl, certificateTemplateConfig } : {}),
  }).where(eq(trainings.id, id));

  revalidatePath('/dashboard/site-admin/trainings');
  revalidatePath('/dashboard/site-admin');
  revalidatePath('/dashboard/trainer/classes');
  return { success: true };
}

export async function updateCertificateTemplateConfig(formData: FormData) {
  const siteJobsiteId = await getSiteAdminJobsiteId();
  const id = Number(formData.get('trainingId'));
  const rawConfig = String(formData.get('config') ?? '');

  if (!id || !rawConfig) return { error: 'Data template tidak lengkap.' };

  const training = await db.select({ jobsiteId: trainings.jobsiteId })
    .from(trainings)
    .where(eq(trainings.id, id))
    .get();

  if (!training) return { error: 'Training tidak ditemukan.' };
  if (siteJobsiteId !== null && training.jobsiteId !== siteJobsiteId) {
    return { error: 'Training ini bukan milik site Anda.' };
  }

  try {
    const config = normalizeCertificateTemplateConfig(JSON.parse(rawConfig));
    await db.update(trainings).set({ certificateTemplateConfig: config }).where(eq(trainings.id, id));
    revalidatePath('/dashboard/site-admin/trainings');
    revalidatePath(`/dashboard/site-admin/trainings/${id}/certificate-template`);
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Konfigurasi template tidak valid.' };
  }
}

export async function deleteTraining(id: number) {
  try {
    const access = await getSiteAdminAccess();
    const current = await db.select({ jobsiteId: trainings.jobsiteId })
      .from(trainings)
      .where(eq(trainings.id, id))
      .get();
    if (!current) return { error: 'Training tidak ditemukan.' };
    if (access.jobsiteId !== null && current.jobsiteId !== access.jobsiteId) {
      return { error: 'Training ini bukan milik site Anda.' };
    }
    await db.delete(trainings).where(eq(trainings.id, id));
    revalidatePath('/dashboard/site-admin/trainings');
    revalidatePath('/dashboard/site-admin');
    revalidatePath('/dashboard/trainer/classes');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Gagal menghapus pelatihan.' };
  }
}

export async function createTrainingSession(formData: FormData) {
  try {
    const { jobsiteId } = await getSiteAdminAccess();
    const trainingId = Number(formData.get('trainingId'));
    const trainerId = Number(formData.get('trainerId'));
    const startTime = new Date(String(formData.get('startTime') ?? ''));
    const endTime = new Date(String(formData.get('endTime') ?? ''));
    const location = String(formData.get('location') ?? '').trim();

    if (!trainingId || !trainerId || Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
      return { error: 'Data jadwal tidak lengkap.' };
    }
    if (endTime <= startTime) {
      return { error: 'Waktu selesai harus setelah waktu mulai.' };
    }

    const references = await validateScheduleReferences(trainingId, trainerId, jobsiteId);
    if ('error' in references) return references;

    await db.insert(trainingSessions).values({
      trainingId,
      trainerId,
      startTime,
      endTime,
      location,
      status: 'scheduled',
    });

    revalidateSchedulePages();
    return { success: true };
  } catch (error) {
    console.error('Create training session failed', error);
    return { error: 'Gagal membuat jadwal training.' };
  }
}

function revalidateSchedulePages() {
  revalidatePath('/dashboard/site-admin/trainings');
  revalidatePath('/dashboard/site-admin');
  revalidatePath('/dashboard/trainer');
  revalidatePath('/dashboard/trainer/classes');
}

export async function updateTrainingSession(formData: FormData) {
  try {
    const { jobsiteId } = await getSiteAdminAccess();
    const sessionId = Number(formData.get('sessionId'));
    const trainingId = Number(formData.get('trainingId'));
    const trainerId = Number(formData.get('trainerId'));
    const startTime = new Date(String(formData.get('startTime') ?? ''));
    const endTime = new Date(String(formData.get('endTime') ?? ''));
    const location = String(formData.get('location') ?? '').trim();

    if (!sessionId || !trainingId || !trainerId || Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
      return { error: 'Data jadwal tidak lengkap.' };
    }
    if (endTime <= startTime) {
      return { error: 'Waktu selesai harus setelah waktu mulai.' };
    }

    const managed = await getManagedSession(sessionId, jobsiteId);
    if ('error' in managed) return managed;
    if (managed.item.status !== 'scheduled') {
      return { error: 'Hanya jadwal berstatus terjadwal yang dapat diedit.' };
    }

    const references = await validateScheduleReferences(trainingId, trainerId, jobsiteId);
    if ('error' in references) return references;

    await db.update(trainingSessions).set({
      trainingId,
      trainerId,
      startTime,
      endTime,
      location,
    }).where(eq(trainingSessions.id, sessionId));

    revalidateSchedulePages();
    return { success: true };
  } catch (error) {
    console.error('Update training session failed', error);
    return { error: 'Gagal memperbarui jadwal training.' };
  }
}

async function countSessionRows(table: typeof enrollments | typeof attendance | typeof exams | typeof evaluations, sessionId: number) {
  const row = await db.select({ count: sql<number>`count(*)` })
    .from(table)
    .where(eq(table.sessionId, sessionId))
    .get();
  return Number(row?.count ?? 0);
}

export async function deleteTrainingSession(sessionId: number) {
  try {
    const { jobsiteId } = await getSiteAdminAccess();
    if (!sessionId) return { error: 'ID jadwal tidak valid.' };

    const managed = await getManagedSession(sessionId, jobsiteId);
    if ('error' in managed) return managed;
    if (managed.item.status !== 'scheduled') {
      return { error: 'Kelas aktif atau selesai tidak boleh dihapus karena termasuk riwayat training.' };
    }

    const relatedRows = await Promise.all([
      countSessionRows(enrollments, sessionId),
      countSessionRows(attendance, sessionId),
      countSessionRows(exams, sessionId),
      countSessionRows(evaluations, sessionId),
    ]);
    if (relatedRows.some((count) => count > 0)) {
      return { error: 'Jadwal sudah memiliki data peserta, absensi, nilai, atau evaluasi sehingga tidak dapat dihapus.' };
    }

    await db.delete(trainingSessions).where(eq(trainingSessions.id, sessionId));
    revalidateSchedulePages();
    return { success: true };
  } catch (error) {
    console.error('Delete training session failed', error);
    return { error: 'Gagal menghapus jadwal training.' };
  }
}
