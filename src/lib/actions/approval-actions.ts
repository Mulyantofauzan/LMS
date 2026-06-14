'use server';

import { db } from '@/db';
import { approvals, questionSets, trainingMaterials, trainingQuestionSets, trainings } from '@/db/schema';
import { revalidatePath } from 'next/cache';
import { and, eq, inArray } from 'drizzle-orm';
import { auth } from '@/auth';
import { canReviewTrainingGlobally } from '@/lib/training-policy';

type SessionUser = {
  id?: string | number | null;
  role?: string | null;
};

export async function updateApprovalStatus(approvalId: number, status: string) {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  const role = user?.role;
  if (!canReviewTrainingGlobally(role)) {
    return { error: 'Anda tidak memiliki akses untuk memperbarui persetujuan.' };
  }

  if (!['approved', 'rejected', 'pending'].includes(status)) {
    return { error: 'Status persetujuan tidak valid.' };
  }

  try {
    await db.update(approvals).set({ status }).where(eq(approvals.id, approvalId));
    revalidatePath('/dashboard/manager/approvals');
    revalidatePath('/dashboard/site-admin/approvals');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Gagal memperbarui status persetujuan.' };
  }
}

export async function submitApprovalStatus(formData: FormData): Promise<void> {
  const approvalId = Number(formData.get('approvalId'));
  const status = formData.get('status') as string;
  await updateApprovalStatus(approvalId, status);
}

export async function updateTrainingApprovalStatus(trainingId: number, status: string, rejectionReason = '') {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  const role = user?.role;
  const managerId = Number(user?.id);
  if (!managerId || !canReviewTrainingGlobally(role)) {
    return { error: 'Anda tidak memiliki akses untuk menyetujui pengajuan training.' };
  }

  if (!['approved', 'rejected'].includes(status)) {
    return { error: 'Status pengajuan tidak valid.' };
  }
  if (status === 'rejected' && !rejectionReason.trim()) {
    return { error: 'Alasan penolakan wajib diisi.' };
  }

  const training = await db.select({ approvalStatus: trainings.approvalStatus })
    .from(trainings)
    .where(eq(trainings.id, trainingId))
    .get();
  if (!training || training.approvalStatus !== 'pending_manager') {
    return { error: 'Pengajuan tidak ditemukan atau sudah diproses.' };
  }

  const reviewedAt = new Date();
  await db.batch([
    db.update(trainings).set({
      approvalStatus: status,
      approvedBy: status === 'approved' ? managerId : null,
      approvedAt: status === 'approved' ? reviewedAt : null,
      rejectionReason: status === 'rejected' ? rejectionReason.trim() : null,
    }).where(eq(trainings.id, trainingId)),
    db.update(trainingMaterials).set({
      approvalStatus: status,
      reviewedBy: managerId,
      reviewedAt,
      rejectionReason: status === 'rejected' ? rejectionReason.trim() : null,
    }).where(and(
      eq(trainingMaterials.trainingId, trainingId),
      eq(trainingMaterials.approvalStatus, 'pending_manager'),
    )),
    db.update(trainingQuestionSets).set({
      approvalStatus: status,
      reviewedBy: managerId,
      reviewedAt,
      rejectionReason: status === 'rejected' ? rejectionReason.trim() : null,
    }).where(and(
      eq(trainingQuestionSets.trainingId, trainingId),
      eq(trainingQuestionSets.approvalStatus, 'pending_manager'),
    )),
  ]);

  if (status === 'approved') {
    const links = await db.select({ questionSetId: trainingQuestionSets.questionSetId })
      .from(trainingQuestionSets)
      .where(and(
        eq(trainingQuestionSets.trainingId, trainingId),
        eq(trainingQuestionSets.approvalStatus, 'approved'),
      ));
    if (links.length > 0) {
      await db.update(questionSets).set({ status: 'published', isLocked: true })
        .where(inArray(questionSets.id, links.map((item) => item.questionSetId)));
    }
  }

  revalidatePath('/dashboard/manager');
  revalidatePath('/dashboard/manager/approvals');
  revalidatePath('/dashboard/site-admin/trainings');
  revalidatePath('/dashboard/trainer');
  return { success: true };
}

export async function submitTrainingApprovalStatus(formData: FormData): Promise<void> {
  const trainingId = Number(formData.get('trainingId'));
  const status = formData.get('status') as string;
  const rejectionReason = String(formData.get('rejectionReason') ?? '');
  await updateTrainingApprovalStatus(trainingId, status, rejectionReason);
}
