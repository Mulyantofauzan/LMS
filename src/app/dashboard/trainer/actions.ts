'use server';

import { db } from "@/db";
import { trainings } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function createTraining(formData: FormData) {
  const session = await auth();
  if (!session || (session.user as any).role !== 'trainer') {
    throw new Error('Unauthorized');
  }

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const category = formData.get('category') as string;

  await db.insert(trainings).values({
    title,
    description,
    category: category || 'General',
    type: 'offline',
    isMandatory: false,
  });
  
  revalidatePath('/dashboard/trainer');
}
