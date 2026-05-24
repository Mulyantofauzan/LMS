'use server';

import { db } from '@/db';
import { users } from '@/db/schema';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';

async function requireUserAdmin() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== 'super-admin' && role !== 'site-admin' && role !== 'admin') {
    return { error: 'Anda tidak memiliki akses untuk mengubah pengguna.' };
  }
  return null;
}

export async function createUser(formData: FormData) {
  const accessError = await requireUserAdmin();
  if (accessError) return accessError;

  const name = formData.get('name') as string;
  const nrp = (formData.get('nrp') as string)?.trim();
  const email = formData.get('email') as string;
  const role = formData.get('role') as string;
  const jobsiteIdStr = formData.get('jobsiteId') as string;
  const department = formData.get('department') as string;
  const position = formData.get('position') as string;
  const password = formData.get('password') as string;

  if (!name || !nrp || !email || !role || !password) {
    return { error: 'Semua kolom wajib diisi.' };
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const jobsiteId = jobsiteIdStr ? parseInt(jobsiteIdStr, 10) : null;

    await db.insert(users).values({
      nrp,
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
    return { error: 'Gagal membuat pengguna. Mungkin email atau NRP sudah digunakan.' };
  }
}

export async function updateUser(formData: FormData) {
  const accessError = await requireUserAdmin();
  if (accessError) return accessError;

  const id = Number(formData.get('id'));
  const name = formData.get('name') as string;
  const nrp = (formData.get('nrp') as string)?.trim();
  const email = formData.get('email') as string;
  const role = formData.get('role') as string;
  const jobsiteIdStr = formData.get('jobsiteId') as string;
  const department = formData.get('department') as string;
  const position = formData.get('position') as string;
  const password = formData.get('password') as string;

  if (!id || !name || !nrp || !email || !role) {
    return { error: 'Data pengguna tidak lengkap.' };
  }

  try {
    const jobsiteId = jobsiteIdStr ? parseInt(jobsiteIdStr, 10) : null;
    const values: Partial<typeof users.$inferInsert> = {
      nrp,
      name,
      email,
      role,
      jobsiteId,
      department,
      position,
    };

    if (password) {
      if (password.length < 6) return { error: 'Kata sandi minimal 6 karakter.' };
      values.passwordHash = await bcrypt.hash(password, 10);
    }

    await db.update(users).set(values).where(eq(users.id, id));

    revalidatePath('/dashboard/super-admin/users');
    revalidatePath('/dashboard/site-admin/users');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Gagal memperbarui pengguna. Mungkin email atau NRP sudah digunakan.' };
  }
}

export async function deleteUser(id: number) {
  const accessError = await requireUserAdmin();
  if (accessError) return accessError;

  const session = await auth();
  if ((session?.user as any)?.id === String(id)) {
    return { error: 'Anda tidak bisa menghapus akun yang sedang digunakan.' };
  }

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
