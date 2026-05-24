'use server';

import { db } from '@/db';
import { jobsites } from '@/db/schema';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';

async function requireSuperAdmin() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== 'super-admin' && role !== 'admin') {
    return { error: 'Anda tidak memiliki akses untuk mengubah lokasi kerja.' };
  }
  return null;
}

export async function createJobsite(formData: FormData) {
  const accessError = await requireSuperAdmin();
  if (accessError) return accessError;

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

export async function updateJobsite(formData: FormData) {
  const accessError = await requireSuperAdmin();
  if (accessError) return accessError;

  const id = Number(formData.get('id'));
  const name = formData.get('name') as string;
  const location = formData.get('location') as string;

  if (!id || !name) return { error: 'Data lokasi kerja tidak lengkap.' };

  try {
    await db.update(jobsites).set({ name, location }).where(eq(jobsites.id, id));
    revalidatePath('/dashboard/super-admin/jobsites');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Gagal memperbarui Jobsite.' };
  }
}

export async function deleteJobsite(id: number) {
  const accessError = await requireSuperAdmin();
  if (accessError) return accessError;

  try {
    await db.delete(jobsites).where(eq(jobsites.id, id));
    revalidatePath('/dashboard/super-admin/jobsites');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Gagal menghapus Jobsite.' };
  }
}
