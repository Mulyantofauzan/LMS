'use server';

import { auth } from '@/auth';
import { db } from '@/db';
import { masterDepartments, masterPositions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

async function requireSuperAdmin() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== 'super-admin' && role !== 'admin') {
    return { error: 'Anda tidak memiliki akses untuk mengelola master data.' };
  }
  return null;
}

function getTable(type: string) {
  return type === 'position' ? masterPositions : masterDepartments;
}

export async function createMasterData(formData: FormData) {
  const accessError = await requireSuperAdmin();
  if (accessError) return accessError;

  const type = String(formData.get('type') ?? '');
  const name = String(formData.get('name') ?? '').trim();
  if (!name) return { error: 'Nama master data wajib diisi.' };

  try {
    await db.insert(getTable(type)).values({ name, isActive: true });
    revalidatePath('/dashboard/super-admin/master');
    revalidatePath('/dashboard/super-admin/users');
    revalidatePath('/dashboard/site-admin/users');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Gagal menambahkan master data. Nama mungkin sudah ada.' };
  }
}

export async function updateMasterData(formData: FormData) {
  const accessError = await requireSuperAdmin();
  if (accessError) return accessError;

  const id = Number(formData.get('id'));
  const type = String(formData.get('type') ?? '');
  const name = String(formData.get('name') ?? '').trim();
  const isActive = formData.get('isActive') === 'on';
  if (!id || !name) return { error: 'Data master tidak lengkap.' };

  try {
    await db.update(getTable(type)).set({ name, isActive }).where(eq(getTable(type).id, id));
    revalidatePath('/dashboard/super-admin/master');
    revalidatePath('/dashboard/super-admin/users');
    revalidatePath('/dashboard/site-admin/users');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Gagal memperbarui master data.' };
  }
}

export async function deleteMasterData(formData: FormData) {
  const accessError = await requireSuperAdmin();
  if (accessError) return accessError;

  const id = Number(formData.get('id'));
  const type = String(formData.get('type') ?? '');
  if (!id) return { error: 'Data master tidak lengkap.' };

  await db.delete(getTable(type)).where(eq(getTable(type).id, id));
  revalidatePath('/dashboard/super-admin/master');
  revalidatePath('/dashboard/super-admin/users');
  revalidatePath('/dashboard/site-admin/users');
  return { success: true };
}

export async function createMasterDataForm(formData: FormData): Promise<void> {
  await createMasterData(formData);
}

export async function updateMasterDataForm(formData: FormData): Promise<void> {
  await updateMasterData(formData);
}

export async function deleteMasterDataForm(formData: FormData): Promise<void> {
  await deleteMasterData(formData);
}
