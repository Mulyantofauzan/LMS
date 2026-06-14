'use server';

import { db } from "@/db";
import { trainingQuestionSets, trainings, users } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { eq } from "drizzle-orm";

type SessionUser = {
  id?: string | number | null;
  role?: string | null;
};

export async function createTraining(formData: FormData) {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  if (!user || user.role !== 'trainer') {
    throw new Error('Unauthorized');
  }

  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const category = String(formData.get('category') ?? '').trim();
  const questionSetId = Number(formData.get('questionSetId'));
  const trainingCode = String(formData.get('trainingCode') ?? '').trim().toUpperCase();
  const certificateEnabled = formData.get('certificateEnabled') === 'on';
  const certificateNeverExpires = formData.get('certificateNeverExpires') === 'on';
  const certificateValidityMonths = certificateNeverExpires ? null : Number(formData.get('certificateValidityMonths')) || null;
  const certificatePassingScore = Number(formData.get('certificatePassingScore')) || 70;
  const certificateNumberFormat = String(formData.get('certificateNumberFormat') ?? '').trim() || 'PST/{TRAINING_CODE}/{YEAR}/{SEQ}';
  const trainerId = Number(user.id);
  if (!title || !description || !questionSetId) {
    return { error: 'Judul, deskripsi, dan paket soal wajib diisi.' };
  }
  const trainer = await db.select({ jobsiteId: users.jobsiteId }).from(users).where(eq(users.id, trainerId)).get();

  const created = await db.insert(trainings).values({
    title,
    description,
    category: category || 'General',
    type: 'offline',
    isMandatory: false,
    jobsiteId: trainer?.jobsiteId ?? null,
    approvalStatus: 'draft',
    proposedBy: trainerId,
    trainingCode,
    certificateEnabled,
    certificateValidityMonths,
    certificatePassingScore,
    certificateNumberFormat,
  }).returning({ id: trainings.id });
  const trainingId = created[0]?.id;
  if (!trainingId) return { error: 'Training gagal dibuat.' };

  await db.insert(trainingQuestionSets).values({
    trainingId,
    questionSetId,
    approvalStatus: 'draft',
    addedBy: trainerId,
  });
  
  revalidatePath('/dashboard/trainer');
  revalidatePath('/dashboard/manager');
  revalidatePath('/dashboard/manager/approvals');
  return { success: true, trainingId };
}
