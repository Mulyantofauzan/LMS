'use server';

import { db } from "@/db";
import { trainings, users } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { eq } from "drizzle-orm";

export async function createTraining(formData: FormData) {
  const session = await auth();
  if (!session || (session.user as any).role !== 'trainer') {
    throw new Error('Unauthorized');
  }

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const category = formData.get('category') as string;
  const trainerId = Number((session.user as any).id);
  const trainer = await db.select({ jobsiteId: users.jobsiteId }).from(users).where(eq(users.id, trainerId)).get();

  await db.insert(trainings).values({
    title,
    description,
    category: category || 'General',
    type: 'offline',
    isMandatory: false,
    jobsiteId: trainer?.jobsiteId ?? null,
    approvalStatus: 'pending_manager',
    proposedBy: trainerId,
  });
  
  revalidatePath('/dashboard/trainer');
  revalidatePath('/dashboard/manager');
  revalidatePath('/dashboard/manager/approvals');
}
