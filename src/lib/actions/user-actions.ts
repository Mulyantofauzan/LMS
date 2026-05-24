'use server';

import { db } from '@/db';
import { users } from '@/db/schema';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';

export async function createUser(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const role = formData.get('role') as string;
  const jobsiteIdStr = formData.get('jobsiteId') as string;
  const department = formData.get('department') as string;
  const position = formData.get('position') as string;
  const password = formData.get('password') as string;

  if (!name || !email || !role || !password) {
    return { error: 'Semua kolom wajib diisi.' };
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const jobsiteId = jobsiteIdStr ? parseInt(jobsiteIdStr, 10) : null;

    await db.insert(users).values({
      name,
      email,
      role,
      jobsiteId,
      department,
      position,
      passwordHash,
    });

    revalidatePath('/dashboard/super-admin/users');
    revalidatePath('/dashboard/site-admin/users');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Gagal membuat pengguna. Mungkin email sudah digunakan.' };
  }
}

export async function deleteUser(id: number) {
  try {
    await db.delete(users).where(eq(users.id, id));
    revalidatePath('/dashboard/super-admin/users');
    revalidatePath('/dashboard/site-admin/users');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Gagal menghapus pengguna.' };
  }
}
