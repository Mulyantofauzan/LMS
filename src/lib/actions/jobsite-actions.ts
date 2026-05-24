'use server';

import { db } from '@/db';
import { jobsites } from '@/db/schema';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';

export async function createJobsite(formData: FormData) {
  const name = formData.get('name') as string;
  const location = formData.get('location') as string;

  if (!name) return { error: 'Nama Jobsite wajib diisi.' };

  try {
    await db.insert(jobsites).values({
      name,
      location,
      settings: {},
    });

    revalidatePath('/dashboard/super-admin/jobsites');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Gagal membuat Jobsite.' };
  }
}

export async function deleteJobsite(id: number) {
  try {
    await db.delete(jobsites).where(eq(jobsites.id, id));
    revalidatePath('/dashboard/super-admin/jobsites');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Gagal menghapus Jobsite.' };
  }
}
