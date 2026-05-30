'use server';

import { db } from "@/db";
import { trainingMaterials, trainingSessions, trainings, users } from "@/db/schema";
import { uploadTrainingMaterialToR2 } from "@/lib/r2-upload";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

async function getSiteAdminJobsiteId() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== 'site-admin' && role !== 'super-admin' && role !== 'admin') {
    throw new Error('Unauthorized');
  }

  if (role === 'site-admin') {
    const currentUser = await db.select({ jobsiteId: users.jobsiteId })
      .from(users)
      .where(eq(users.id, Number((session?.user as any)?.id)))
      .get();
    return currentUser?.jobsiteId ?? null;
  }

  return null;
}

export async function createTraining(formData: FormData): Promise<void> {
  const siteJobsiteId = await getSiteAdminJobsiteId();
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const category = formData.get('category') as string;
  const type = formData.get('type') as string;
  const isMandatory = formData.get('isMandatory') === 'on';
  const jobsiteIdStr = formData.get('jobsiteId') as string;
  const trainingCode = String(formData.get('trainingCode') ?? '').trim().toUpperCase();
  const certificateEnabled = formData.get('certificateEnabled') === 'on';
  const certificateNeverExpires = formData.get('certificateNeverExpires') === 'on';
  const certificateValidityMonths = certificateNeverExpires ? null : Number(formData.get('certificateValidityMonths')) || null;
  const certificatePassingScore = Number(formData.get('certificatePassingScore')) || 70;
  const certificateNumberFormat = String(formData.get('certificateNumberFormat') ?? '').trim() || 'PST/{TRAINING_CODE}/{YEAR}/{SEQ}';
  const certificateTemplate = formData.get('certificateTemplate') as File | null;
  const materialFiles = formData.getAll('materials')
    .filter((value): value is File => value instanceof File && value.size > 0);

  if (!title) throw new Error('Judul pelatihan wajib diisi.');

  const inferMaterialType = (file: File) => {
    const fileName = file.name.toLowerCase();
    if (file.type.startsWith('video/') || /\.(mp4|mov|mkv|webm)$/.test(fileName)) return 'video';
    if (/\.(ppt|pptx)$/.test(fileName)) return 'ppt';
    return 'pdf';
  };

  const created = await db.insert(trainings).values({
    title,
    description,
    category,
    type,
    isMandatory,
    jobsiteId: siteJobsiteId ?? (jobsiteIdStr ? Number(jobsiteIdStr) : null),
    approvalStatus: 'approved',
    trainingCode,
    certificateEnabled,
    certificateValidityMonths,
    certificatePassingScore,
    certificateNumberFormat,
  }).returning({ id: trainings.id });

  const trainingId = created[0]?.id;
  if (trainingId && certificateTemplate && certificateTemplate.size > 0) {
    const uploaded = await uploadTrainingMaterialToR2(certificateTemplate, {
      prefix: `certificate-templates/${trainingId}`,
    });

    await db.update(trainings).set({
      certificateTemplateUrl: uploaded.publicUrl,
      certificateTemplateConfig: {
        fields: {
          participantName: { x: 421, y: 330, fontSize: 32, align: 'center' },
          trainingTitle: { x: 421, y: 230, fontSize: 24, align: 'center' },
          certificateNumber: { x: 150, y: 130, fontSize: 12, align: 'left' },
          issueDate: { x: 150, y: 150, fontSize: 14, align: 'left' },
          expiryDate: { x: 150, y: 110, fontSize: 12, align: 'left' },
          qrCode: { x: 600, y: 100, size: 100 },
        },
      },
    }).where(eq(trainings.id, trainingId));
  }

  if (trainingId && materialFiles.length > 0) {
    for (const file of materialFiles) {
      const uploaded = await uploadTrainingMaterialToR2(file, {
        prefix: `training-materials/${trainingId}`,
      });

      await db.insert(trainingMaterials).values({
        trainingId,
        title: file.name,
        type: inferMaterialType(file),
        fileUrl: uploaded.publicUrl,
      });
    }
  }
  
  revalidatePath('/dashboard/site-admin/trainings');
  revalidatePath('/dashboard/site-admin');
  revalidatePath('/dashboard/trainer/classes');
}

export async function updateTraining(formData: FormData) {
  const id = Number(formData.get('id'));
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const category = formData.get('category') as string;
  const type = formData.get('type') as string;
  const isMandatory = formData.get('isMandatory') === 'on';
  const trainingCode = String(formData.get('trainingCode') ?? '').trim().toUpperCase();
  const certificateEnabled = formData.get('certificateEnabled') === 'on';
  const certificateNeverExpires = formData.get('certificateNeverExpires') === 'on';
  const certificateValidityMonths = certificateNeverExpires ? null : Number(formData.get('certificateValidityMonths')) || null;
  const certificatePassingScore = Number(formData.get('certificatePassingScore')) || 70;
  const certificateNumberFormat = String(formData.get('certificateNumberFormat') ?? '').trim() || 'PST/{TRAINING_CODE}/{YEAR}/{SEQ}';
  const certificateTemplate = formData.get('certificateTemplate') as File | null;

  if (!id || !title) return { error: 'Data pelatihan tidak lengkap.' };

  let certificateTemplateUrl: string | undefined;
  let certificateTemplateConfig: Record<string, unknown> | undefined;
  if (certificateTemplate && certificateTemplate.size > 0) {
    const uploaded = await uploadTrainingMaterialToR2(certificateTemplate, {
      prefix: `certificate-templates/${id}`,
    });
    certificateTemplateUrl = uploaded.publicUrl;
    certificateTemplateConfig = {
      fields: {
        participantName: { x: 421, y: 330, fontSize: 32, align: 'center' },
        trainingTitle: { x: 421, y: 230, fontSize: 24, align: 'center' },
        certificateNumber: { x: 150, y: 130, fontSize: 12, align: 'left' },
        issueDate: { x: 150, y: 150, fontSize: 14, align: 'left' },
        expiryDate: { x: 150, y: 110, fontSize: 12, align: 'left' },
        qrCode: { x: 600, y: 100, size: 100 },
      },
    };
  }

  await db.update(trainings).set({
    title,
    description,
    category,
    type,
    isMandatory,
    trainingCode,
    certificateEnabled,
    certificateValidityMonths,
    certificatePassingScore,
    certificateNumberFormat,
    ...(certificateTemplateUrl ? { certificateTemplateUrl, certificateTemplateConfig } : {}),
  }).where(eq(trainings.id, id));

  revalidatePath('/dashboard/site-admin/trainings');
  revalidatePath('/dashboard/site-admin');
  revalidatePath('/dashboard/trainer/classes');
  return { success: true };
}

export async function deleteTraining(id: number) {
  try {
    await db.delete(trainings).where(eq(trainings.id, id));
    revalidatePath('/dashboard/site-admin/trainings');
    revalidatePath('/dashboard/site-admin');
    revalidatePath('/dashboard/trainer/classes');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Gagal menghapus pelatihan.' };
  }
}

export async function createTrainingSession(formData: FormData): Promise<void> {
  await getSiteAdminJobsiteId();

  const trainingId = Number(formData.get('trainingId'));
  const trainerId = Number(formData.get('trainerId'));
  const startTime = new Date(formData.get('startTime') as string);
  const endTime = new Date(formData.get('endTime') as string);
  const location = formData.get('location') as string;

  if (!trainingId || !trainerId || Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
    throw new Error('Data jadwal tidak lengkap.');
  }

  await db.insert(trainingSessions).values({
    trainingId,
    trainerId,
    startTime,
    endTime,
    location,
  });

  revalidatePath('/dashboard/site-admin/trainings');
  revalidatePath('/dashboard/site-admin');
  revalidatePath('/dashboard/trainer');
  revalidatePath('/dashboard/trainer/classes');
}

export async function deleteTrainingSession(formData: FormData): Promise<void> {
  await getSiteAdminJobsiteId();
  const sessionId = Number(formData.get('sessionId'));
  if (!sessionId) throw new Error('ID jadwal tidak valid.');

  await db.delete(trainingSessions).where(eq(trainingSessions.id, sessionId));

  revalidatePath('/dashboard/site-admin/trainings');
  revalidatePath('/dashboard/site-admin');
  revalidatePath('/dashboard/trainer');
  revalidatePath('/dashboard/trainer/classes');
}
