'use server';

import { db } from "@/db";
import { trainings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createTraining(formData: FormData) {
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const category = formData.get('category') as string;
  const type = formData.get('type') as string;
  const isMandatory = formData.get('isMandatory') === 'on';

  await db.insert(trainings).values({
    title,
    description,
    category,
    type,
    isMandatory
  });
  
  revalidatePath('/dashboard/site-admin/trainings');
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
  revalidatePath('/dashboard/trainer/classes');
  return { success: true };
}

export async function deleteTraining(id: number) {
  try {
    await db.delete(trainings).where(eq(trainings.id, id));
    revalidatePath('/dashboard/site-admin/trainings');
    revalidatePath('/dashboard/trainer/classes');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Gagal menghapus pelatihan.' };
  }
}
