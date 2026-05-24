'use server';

import { db } from '@/db';
import { approvals } from '@/db/schema';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';

export async function updateApprovalStatus(approvalId: number, status: string) {
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
