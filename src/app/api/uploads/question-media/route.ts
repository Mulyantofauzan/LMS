import { auth } from '@/auth';
import { db } from '@/db';
import { questionSets } from '@/db/schema';
import { uploadTrainingMaterialStreamToR2 } from '@/lib/r2-upload';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 95 * 1024 * 1024;

type SessionUser = {
  id?: string | number | null;
  role?: string | null;
};

function decodeFileName(value: string | null) {
  try {
    return decodeURIComponent(value ?? '');
  } catch {
    return value ?? '';
  }
}

function inferMediaType(fileName: string, contentType: string) {
  if (contentType.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(fileName)) return 'image';
  if (contentType.startsWith('video/') || /\.(mp4|webm)$/i.test(fileName)) return 'video';
  return null;
}

export async function PUT(request: Request) {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  const userId = Number(user?.id);
  const role = user?.role;
  if (!userId || !['trainer', 'super-admin', 'admin'].includes(role ?? '')) {
    return Response.json({ error: 'Anda tidak memiliki akses upload media soal.' }, { status: 403 });
  }

  const url = new URL(request.url);
  const questionSetId = Number(url.searchParams.get('questionSetId'));
  const fileName = decodeFileName(request.headers.get('x-file-name')).trim();
  const contentType = request.headers.get('content-type') || 'application/octet-stream';
  const declaredSize = Number(request.headers.get('x-file-size') || request.headers.get('content-length') || 0);
  const mediaType = inferMediaType(fileName, contentType);
  if (!questionSetId || !fileName || !request.body || !mediaType) {
    return Response.json({ error: 'Media harus berupa PNG, JPG, WebP, MP4, atau WebM.' }, { status: 400 });
  }

  const set = await db.select({
    trainerId: questionSets.trainerId,
    isLocked: questionSets.isLocked,
  }).from(questionSets).where(eq(questionSets.id, questionSetId)).get();
  if (!set) return Response.json({ error: 'Paket soal tidak ditemukan.' }, { status: 404 });
  if (role === 'trainer' && set.trainerId !== userId) {
    return Response.json({ error: 'Hanya pemilik paket yang dapat menambah media.' }, { status: 403 });
  }
  if (set.isLocked) {
    return Response.json({ error: 'Paket soal sudah dikunci. Duplikat paket untuk merevisi.' }, { status: 409 });
  }

  const maxBytes = mediaType === 'image' ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
  if (!Number.isSafeInteger(declaredSize) || declaredSize <= 0 || declaredSize > maxBytes) {
    return Response.json({
      error: `Ukuran ${mediaType === 'image' ? 'gambar maksimal 10 MB' : 'video maksimal 95 MB'}.`,
    }, { status: 413 });
  }

  try {
    const fixedLengthStream = new FixedLengthStream(declaredSize);
    const [uploaded] = await Promise.all([
      uploadTrainingMaterialStreamToR2(fixedLengthStream.readable, {
        prefix: `question-media/${questionSetId}`,
        fileName,
        contentType,
      }),
      request.body.pipeTo(fixedLengthStream.writable),
    ]);
    return Response.json({
      success: true,
      mediaUrl: uploaded.publicUrl,
      mediaType,
      mediaName: fileName,
    });
  } catch (error) {
    console.error('Question media upload failed', error);
    return Response.json({ error: 'Upload media soal ke R2 gagal.' }, { status: 500 });
  }
}
