import { auth } from '@/auth';
import { db } from '@/db';
import { trainingMaterials, trainings, users } from '@/db/schema';
import { defaultCertificateTemplateConfig } from '@/lib/certificate-template';
import {
  deleteTrainingMaterialFromR2,
  uploadTrainingMaterialStreamToR2,
} from '@/lib/r2-upload';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const MAX_MATERIAL_BYTES = 95 * 1024 * 1024;
const MAX_TEMPLATE_BYTES = 10 * 1024 * 1024;

type SessionUser = {
  id?: string | number | null;
  role?: string | null;
};

function decodeFileName(value: string | null) {
  if (!value) return '';
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function inferMaterialType(fileName: string, contentType: string) {
  const normalizedName = fileName.toLowerCase();
  if (contentType.startsWith('video/') || /\.(mp4|mov|mkv|webm)$/.test(normalizedName)) return 'video';
  if (/\.(ppt|pptx)$/.test(normalizedName)) return 'ppt';
  return 'pdf';
}

function isAllowedMaterial(fileName: string, contentType: string) {
  return contentType === 'application/pdf'
    || contentType.startsWith('video/')
    || /\.(pdf|ppt|pptx|mp4|mov|mkv|webm)$/i.test(fileName);
}

function isAllowedTemplate(fileName: string, contentType: string) {
  return contentType === 'image/png'
    || contentType === 'image/jpeg'
    || /\.(png|jpe?g)$/i.test(fileName);
}

export async function PUT(request: Request) {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  const role = user?.role;
  const userId = Number(user?.id);
  if (!userId || (role !== 'site-admin' && role !== 'super-admin' && role !== 'admin')) {
    return Response.json({ error: 'Anda tidak memiliki akses upload.' }, { status: 403 });
  }

  const url = new URL(request.url);
  const trainingId = Number(url.searchParams.get('trainingId'));
  const kind = url.searchParams.get('kind');
  const fileName = decodeFileName(request.headers.get('x-file-name')).trim();
  const contentType = request.headers.get('content-type') || 'application/octet-stream';
  const declaredSize = Number(request.headers.get('x-file-size') || request.headers.get('content-length') || 0);

  if (!trainingId || !fileName || !request.body || (kind !== 'material' && kind !== 'template')) {
    return Response.json({ error: 'Data upload tidak lengkap.' }, { status: 400 });
  }

  const maxBytes = kind === 'template' ? MAX_TEMPLATE_BYTES : MAX_MATERIAL_BYTES;
  if (!declaredSize || declaredSize > maxBytes) {
    const maxLabel = kind === 'template' ? '10 MB' : '95 MB';
    return Response.json({ error: `Ukuran file harus lebih kecil dari ${maxLabel}.` }, { status: 413 });
  }

  if (kind === 'template' && !isAllowedTemplate(fileName, contentType)) {
    return Response.json({ error: 'Template sertifikat harus berupa PNG atau JPG.' }, { status: 415 });
  }
  if (kind === 'material' && !isAllowedMaterial(fileName, contentType)) {
    return Response.json({ error: 'Materi harus berupa PDF, PPT/PPTX, atau video.' }, { status: 415 });
  }

  const training = await db.select({
    id: trainings.id,
    jobsiteId: trainings.jobsiteId,
  }).from(trainings).where(eq(trainings.id, trainingId)).get();
  if (!training) {
    return Response.json({ error: 'Pelatihan tidak ditemukan.' }, { status: 404 });
  }

  if (role === 'site-admin') {
    const currentUser = await db.select({ jobsiteId: users.jobsiteId })
      .from(users)
      .where(eq(users.id, userId))
      .get();
    if (!currentUser?.jobsiteId || currentUser.jobsiteId !== training.jobsiteId) {
      return Response.json({ error: 'Pelatihan ini bukan milik site Anda.' }, { status: 403 });
    }
  }

  let uploadedKey: string | null = null;
  try {
    const uploaded = await uploadTrainingMaterialStreamToR2(request.body, {
      prefix: kind === 'template'
        ? `certificate-templates/${trainingId}`
        : `training-materials/${trainingId}`,
      fileName,
      contentType,
    });
    uploadedKey = uploaded.key;

    if (kind === 'template') {
      await db.update(trainings).set({
        certificateTemplateUrl: uploaded.publicUrl,
        certificateTemplateConfig: defaultCertificateTemplateConfig,
      }).where(eq(trainings.id, trainingId));
    } else {
      await db.insert(trainingMaterials).values({
        trainingId,
        title: fileName,
        type: inferMaterialType(fileName, contentType),
        fileUrl: uploaded.publicUrl,
      });
    }

    return Response.json({
      success: true,
      fileUrl: uploaded.publicUrl,
      key: uploaded.key,
    });
  } catch (error) {
    console.error('Training asset upload failed', error);
    if (uploadedKey) {
      await deleteTrainingMaterialFromR2(uploadedKey).catch(() => undefined);
    }
    return Response.json({ error: 'Upload ke Cloudflare R2 gagal.' }, { status: 500 });
  }
}
