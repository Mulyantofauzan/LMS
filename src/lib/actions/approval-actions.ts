'use server';

import { db } from '@/db';
import { approvals, trainings } from '@/db/schema';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';

export async function updateApprovalStatus(approvalId: number, status: string) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== 'manager' && role !== 'admin' && role !== 'super-admin') {
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

export async function updateTrainingApprovalStatus(trainingId: number, status: string) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  const managerId = Number((session?.user as any)?.id);
  if (role !== 'manager' && role !== 'admin' && role !== 'super-admin') {
    return { error: 'Anda tidak memiliki akses untuk menyetujui pengajuan training.' };
  }

  if (!['approved', 'rejected'].includes(status)) {
    return { error: 'Status pengajuan tidak valid.' };
  }

  await db.update(trainings).set({
    approvalStatus: status,
    approvedBy: status === 'approved' ? managerId : null,
    approvedAt: status === 'approved' ? new Date() : null,
  }).where(eq(trainings.id, trainingId));

  revalidatePath('/dashboard/manager');
  revalidatePath('/dashboard/manager/approvals');
  revalidatePath('/dashboard/site-admin/trainings');
  revalidatePath('/dashboard/trainer');
  return { success: true };
}

export async function submitTrainingApprovalStatus(formData: FormData): Promise<void> {
  const trainingId = Number(formData.get('trainingId'));
  const status = formData.get('status') as string;
  await updateTrainingApprovalStatus(trainingId, status);
}
