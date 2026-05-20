'use server';

import { db } from "@/db";
import { settings } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { eq } from "drizzle-orm";

export async function saveLandingSettings(formData: FormData) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== 'super-admin' && role !== 'admin') {
    throw new Error('Unauthorized');
  }

  const keys = [
    'heroTitle', 'heroSubtitle', 'heroBadge',
    'ctaTitle', 'ctaSubtitle',
    'footerDescription',
    'brandName', 'brandShort',
    'feature1Title', 'feature1Desc', 'feature1Icon',
    'feature2Title', 'feature2Desc', 'feature2Icon',
    'feature3Title', 'feature3Desc', 'feature3Icon',
    'feature4Title', 'feature4Desc', 'feature4Icon',
    'feature5Title', 'feature5Desc', 'feature5Icon',
    'feature6Title', 'feature6Desc', 'feature6Icon',
    'stat1Value', 'stat1Label',
    'stat2Value', 'stat2Label',
    'stat3Value', 'stat3Label',
    'stat4Value', 'stat4Label',
  ];

  for (const key of keys) {
    const value = formData.get(key) as string;
    if (value !== null && value !== undefined) {
      const existing = await db.select().from(settings).where(eq(settings.key, key)).get();
      if (existing) {
        await db.update(settings).set({ value }).where(eq(settings.key, key));
      } else {
        await db.insert(settings).values({ key, value });
      }
    }
  }

  revalidatePath('/');
  revalidatePath('/dashboard/super-admin/landing');
}
