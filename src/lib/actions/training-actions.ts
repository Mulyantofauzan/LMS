'use server';

import { db } from '@/db';
import { trainingMaterials, trainings, trainingSessions } from '@/db/schema';
import { revalidatePath } from 'next/cache';
import { uploadTrainingMaterialToR2 } from '@/lib/r2-upload';
import { auth } from '@/auth';

export async function createTraining(formData: FormData) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  const userId = Number((session?.user as any)?.id);
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const category = formData.get('category') as string;
  const type = formData.get('type') as string;
  const isMandatoryStr = formData.get('isMandatory') as string;
  const jobsiteIdStr = formData.get('jobsiteId') as string;

  if (!title) return { error: 'Judul pelatihan wajib diisi.' };

  try {
    const jobsiteId = jobsiteIdStr ? parseInt(jobsiteIdStr, 10) : null;
    const isMandatory = isMandatoryStr === 'true';

    await db.insert(trainings).values({
      title,
      description,
      category,
      type,
      isMandatory,
      jobsiteId,
      approvalStatus: role === 'trainer' ? 'pending_manager' : 'approved',
      proposedBy: role === 'trainer' ? userId : null,
      approvedBy: role === 'trainer' ? null : userId || null,
      approvedAt: role === 'trainer' ? null : new Date(),
    });

    revalidatePath('/dashboard/super-admin');
    revalidatePath('/dashboard/trainer');
    revalidatePath('/dashboard/manager');
    revalidatePath('/dashboard/manager/approvals');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Gagal membuat pelatihan.' };
  }
}

export async function createTrainingSession(formData: FormData) {
  const trainingIdStr = formData.get('trainingId') as string;
  const trainerIdStr = formData.get('trainerId') as string;
  const startTimeStr = formData.get('startTime') as string;
  const endTimeStr = formData.get('endTime') as string;
  const location = formData.get('location') as string;

  if (!trainingIdStr || !trainerIdStr || !startTimeStr || !endTimeStr) {
    return { error: 'Kolom wajib ada yang kosong.' };
  }

  try {
    const trainingId = parseInt(trainingIdStr, 10);
    const trainerId = parseInt(trainerIdStr, 10);
    const startTime = new Date(startTimeStr);
    const endTime = new Date(endTimeStr);

    await db.insert(trainingSessions).values({
      trainingId,
      trainerId,
      startTime,
      endTime,
      location,
    });

    revalidatePath('/dashboard/trainer/classes');
    revalidatePath('/dashboard/site-admin/classes');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Gagal membuat sesi pelatihan.' };
  }
}

export async function uploadTrainingMaterial(formData: FormData) {
  const file = formData.get('file') as File;
  const trainingIdStr = formData.get('trainingId') as string;
  const title = formData.get('title') as string;
  const type = formData.get('type') as string;

  if (!file || !trainingIdStr) return { error: 'File dan ID Training wajib ada.' };

  try {
    const trainingId = parseInt(trainingIdStr, 10);
    if (Number.isNaN(trainingId)) return { error: 'ID Training tidak valid.' };

    const uploaded = await uploadTrainingMaterialToR2(file, {
      prefix: `training-materials/${trainingId}`,
    });

    await db.insert(trainingMaterials).values({
      trainingId,
      title: title || file.name,
      type: type || file.type || 'file',
      fileUrl: uploaded.publicUrl,
    });

    revalidatePath('/dashboard/trainer/classes');
    revalidatePath('/dashboard/site-admin/trainings');
    return { success: true, fileUrl: uploaded.publicUrl, key: uploaded.key };
  } catch (error) {
    console.error(error);
    return { error: 'Gagal mengunggah materi pelatihan ke R2.' };
  }
}
