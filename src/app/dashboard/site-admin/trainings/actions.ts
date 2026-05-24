'use server';

import { db } from "@/db";
import { trainingSessions, trainings, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

async function getSiteAdminJobsiteId() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== 'site-admin' && role !== 'super-admin' && role !== 'admin') {
    throw new Error('Unauthorized');
  }

  if (role === 'site-admin') {
    const currentUser = await db.select({ jobsiteId: users.jobsiteId })
      .from(users)
      .where(eq(users.id, Number((session?.user as any)?.id)))
      .get();
    return currentUser?.jobsiteId ?? null;
  }

  return null;
}

export async function createTraining(formData: FormData) {
  const siteJobsiteId = await getSiteAdminJobsiteId();
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const category = formData.get('category') as string;
  const type = formData.get('type') as string;
  const isMandatory = formData.get('isMandatory') === 'on';
  const jobsiteIdStr = formData.get('jobsiteId') as string;

  await db.insert(trainings).values({
    title,
    description,
    category,
    type,
    isMandatory,
    jobsiteId: siteJobsiteId ?? (jobsiteIdStr ? Number(jobsiteIdStr) : null),
  });
  
  revalidatePath('/dashboard/site-admin/trainings');
  revalidatePath('/dashboard/site-admin');
}

export async function updateTraining(formData: FormData) {
  const id = Number(formData.get('id'));
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const category = formData.get('category') as string;
  const type = formData.get('type') as string;
  const isMandatory = formData.get('isMandatory') === 'on';

  if (!id || !title) return { error: 'Data pelatihan tidak lengkap.' };

  await db.update(trainings).set({
    title,
    description,
    category,
    type,
    isMandatory,
  }).where(eq(trainings.id, id));

  revalidatePath('/dashboard/site-admin/trainings');
  revalidatePath('/dashboard/site-admin');
  revalidatePath('/dashboard/trainer/classes');
  return { success: true };
}

export async function deleteTraining(id: number) {
  try {
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

export async function createTrainingSession(formData: FormData): Promise<void> {
  await getSiteAdminJobsiteId();

  const trainingId = Number(formData.get('trainingId'));
  const trainerId = Number(formData.get('trainerId'));
  const startTime = new Date(formData.get('startTime') as string);
  const endTime = new Date(formData.get('endTime') as string);
  const location = formData.get('location') as string;

  if (!trainingId || !trainerId || Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
    throw new Error('Data jadwal tidak lengkap.');
  }

  await db.insert(trainingSessions).values({
    trainingId,
    trainerId,
    startTime,
    endTime,
    location,
  });

  revalidatePath('/dashboard/site-admin/trainings');
  revalidatePath('/dashboard/site-admin');
  revalidatePath('/dashboard/trainer');
  revalidatePath('/dashboard/trainer/classes');
}
