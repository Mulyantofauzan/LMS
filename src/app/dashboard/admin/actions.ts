'use server';

import { db } from "@/db";
import { settings } from "@/db/schema";
import { revalidatePath } from "next/cache";

export async function updateLandingSettings(formData: FormData) {
  const heroTitle = formData.get('heroTitle') as string;
  const heroSubtitle = formData.get('heroSubtitle') as string;

  if (heroTitle) {
    await db.insert(settings)
      .values({ key: 'heroTitle', value: heroTitle })
      .onConflictDoUpdate({ target: settings.key, set: { value: heroTitle } });
  }
  if (heroSubtitle) {
    await db.insert(settings)
      .values({ key: 'heroSubtitle', value: heroSubtitle })
      .onConflictDoUpdate({ target: settings.key, set: { value: heroSubtitle } });
  }
  
  revalidatePath('/');
  revalidatePath('/dashboard/admin');
}
