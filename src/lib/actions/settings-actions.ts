'use server';

import { db } from '@/db';
import { settings } from '@/db/schema';
import { revalidatePath } from 'next/cache';

export async function saveSystemSettings(formData: FormData) {
  try {
    // Collect all entries from formData
    const entries = Array.from(formData.entries());
    
    // Using simple upsert logic since settings just uses key/value pairs
    for (const [key, value] of entries) {
      if (typeof value === 'string' && !key.startsWith('$ACTION')) {
        // First try to delete the old key, then insert the new one
        try {
          const sql = require('drizzle-orm').sql;
          await db.run(sql`INSERT INTO settings (key, value) VALUES (${key}, ${value}) ON CONFLICT(key) DO UPDATE SET value=excluded.value`);
        } catch (e) {
          console.error(e);
        }
      }
    }

    revalidatePath('/dashboard/super-admin/settings');
    revalidatePath('/'); // For landing page
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Gagal menyimpan pengaturan.' };
  }
}
