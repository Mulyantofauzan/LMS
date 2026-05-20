'use server';

import { db } from "@/db";
import { trainings } from "@/db/schema";
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
