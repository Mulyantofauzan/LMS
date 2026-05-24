'use server';

import { db } from '@/db';
import { attendance } from '@/db/schema';
import { revalidatePath } from 'next/cache';
import { eq, and } from 'drizzle-orm';

export async function markAttendance(formData: FormData) {
  const sessionIdStr = formData.get('sessionId') as string;
  const traineeIdStr = formData.get('traineeId') as string;
  const status = formData.get('status') as string; // present, absent, late

  if (!sessionIdStr || !traineeIdStr || !status) {
    return { error: 'Data absensi tidak lengkap.' };
  }

  try {
    const sessionId = parseInt(sessionIdStr, 10);
    const traineeId = parseInt(traineeIdStr, 10);

    // Check if attendance already exists
    const existing = await db.select().from(attendance).where(
      and(eq(attendance.sessionId, sessionId), eq(attendance.traineeId, traineeId))
    );

    if (existing.length > 0) {
      // Update
      await db.update(attendance).set({ status, checkIn: new Date() }).where(eq(attendance.id, existing[0].id));
    } else {
      // Insert
      await db.insert(attendance).values({
        sessionId,
        traineeId,
        status,
        checkIn: new Date(),
        method: 'manual',
      });
    }

    revalidatePath('/dashboard/trainer/attendance');
    revalidatePath('/dashboard/site-admin/attendance');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Gagal mencatat kehadiran.' };
  }
}
