'use server';

import { db } from '@/db';
import { questionBank, questionSets, trainings, users } from '@/db/schema';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { normalizeQuestionType } from '@/lib/question-utils';
import { canManageQuestionSet } from '@/lib/training-policy';

type SessionUser = {
  id?: string | number | null;
  role?: string | null;
};

type QuestionBankAccess = {
  userId: number;
  role: string | null | undefined;
};

async function requireQuestionBankManager(): Promise<QuestionBankAccess | { error: string }> {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  const role = user?.role;
  if (!['trainer', 'site-admin', 'admin', 'super-admin'].includes(role ?? '')) {
    return { error: 'Anda tidak memiliki akses untuk mengubah bank soal.' };
  }
  return { userId: Number(user?.id), role };
}

async function requireWritableSet(questionSetId: number): Promise<{
  access: QuestionBankAccess;
  set: { trainerId: number; trainingId: number; isLocked: boolean };
} | { error: string }> {
  const access = await requireQuestionBankManager();
  if ('error' in access) return access;
  const set = await db.select({
    trainerId: questionSets.trainerId,
    trainingId: questionSets.trainingId,
    isLocked: questionSets.isLocked,
  }).from(questionSets).where(eq(questionSets.id, questionSetId)).get();
  if (!set) return { error: 'Paket soal tidak ditemukan.' };
  if (!canManageQuestionSet(access.role, access.userId, set.trainerId)) {
    return { error: 'Hanya pembuat paket yang dapat mengubah soal ini.' };
  }
  if (set.isLocked) {
    return { error: 'Paket sudah dikunci karena telah disetujui atau digunakan. Duplikat paket untuk melakukan revisi.' };
  }
  return { access, set };
}

async function canUseTrainingForQuestionBank(access: QuestionBankAccess, trainingId: number) {
  if (!trainingId) return false;
  if (access.role === 'admin' || access.role === 'super-admin' || access.role === 'trainer') return true;

  if (access.role === 'site-admin') {
    const [actor, training] = await Promise.all([
      db.select({ jobsiteId: users.jobsiteId }).from(users).where(eq(users.id, access.userId)).get(),
      db.select({ jobsiteId: trainings.jobsiteId }).from(trainings).where(eq(trainings.id, trainingId)).get(),
    ]);
    return Boolean(actor?.jobsiteId && training?.jobsiteId === actor.jobsiteId);
  }

  return false;
}

function parseOptions(formData: FormData) {
  const optionsStr = formData.get('options') as string;
  if (optionsStr) return JSON.parse(optionsStr);

  const options = ['optionA', 'optionB', 'optionC', 'optionD']
    .map((key) => (formData.get(key) as string)?.trim())
    .filter(Boolean);

  return options.length > 0 ? options : null;
}

export async function createQuestion(formData: FormData) {
  const trainingIdStr = String(formData.get('trainingId') ?? '');
  const questionSetIdStr = formData.get('questionSetId') as string;
  const type = normalizeQuestionType(formData.get('type') as string);
  const questionText = formData.get('question') as string;
  const correctAnswer = formData.get('correctAnswer') as string;
  const mediaUrl = String(formData.get('mediaUrl') ?? '').trim() || null;
  const mediaType = String(formData.get('mediaType') ?? '').trim() || null;
  const mediaName = String(formData.get('mediaName') ?? '').trim() || null;

  if (!trainingIdStr || !type || !questionText) {
    return { error: 'Kolom wajib ada yang kosong.' };
  }

  try {
    const questionSetId = questionSetIdStr ? parseInt(questionSetIdStr, 10) : null;
    if (!questionSetId) return { error: 'Paket soal wajib dipilih.' };
    const writable = await requireWritableSet(questionSetId);
    if ('error' in writable) return writable;
    const trainingId = Number(trainingIdStr);
    if (trainingId !== writable.set.trainingId) {
      return { error: 'Pelatihan harus sesuai dengan paket soal yang dipilih.' };
    }
    const options = parseOptions(formData);

    await db.insert(questionBank).values({
      trainingId,
      questionSetId,
      type,
      question: questionText,
      options,
      correctAnswer,
      mediaUrl,
      mediaType,
      mediaName,
    });

    revalidatePath('/dashboard/trainer/questions');
    revalidatePath('/dashboard/trainer/classes');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Gagal membuat soal.' };
  }
}

export async function createQuestionSet(formData: FormData) {
  const access = await requireQuestionBankManager();
  if ('error' in access) return access;
  const trainerId = access.userId;
  const trainingId = Number(formData.get('trainingId'));
  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  if (!trainingId || !title) return { error: 'Pelatihan dan nama paket soal wajib diisi.' };
  const allowedTraining = await canUseTrainingForQuestionBank(access, trainingId);
  if (!allowedTraining) return { error: 'Anda tidak memiliki akses ke pelatihan ini.' };

  await db.insert(questionSets).values({
    trainingId,
    trainerId,
    title,
    description,
    status: 'published',
    isLocked: false,
  });
  revalidatePath('/dashboard/trainer/questions');
  revalidatePath('/dashboard/trainer/classes');
  return { success: true };
}

export async function updateQuestion(formData: FormData) {
  const id = Number(formData.get('id'));
  const trainingIdStr = String(formData.get('trainingId') ?? '');
  const type = normalizeQuestionType(formData.get('type') as string);
  const questionText = formData.get('question') as string;
  const correctAnswer = formData.get('correctAnswer') as string;
  const mediaUrl = String(formData.get('mediaUrl') ?? '').trim() || null;
  const mediaType = String(formData.get('mediaType') ?? '').trim() || null;
  const mediaName = String(formData.get('mediaName') ?? '').trim() || null;

  if (!id || !trainingIdStr || !type || !questionText) {
    return { error: 'Data soal tidak lengkap.' };
  }

  try {
    const current = await db.select({ questionSetId: questionBank.questionSetId })
      .from(questionBank)
      .where(eq(questionBank.id, id))
      .get();
    if (!current?.questionSetId) return { error: 'Paket soal tidak ditemukan.' };
    const writable = await requireWritableSet(current.questionSetId);
    if ('error' in writable) return writable;
    const trainingId = parseInt(trainingIdStr, 10);
    if (trainingId !== writable.set.trainingId) {
      return { error: 'Pelatihan harus sesuai dengan paket soal yang dipilih.' };
    }

    await db.update(questionBank).set({
      trainingId,
      type,
      question: questionText,
      options: parseOptions(formData),
      correctAnswer,
      mediaUrl,
      mediaType,
      mediaName,
    }).where(eq(questionBank.id, id));

    revalidatePath('/dashboard/trainer/questions');
    revalidatePath('/dashboard/trainer/classes');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Gagal memperbarui soal.' };
  }
}

export async function deleteQuestion(id: number) {
  try {
    const current = await db.select({ questionSetId: questionBank.questionSetId })
      .from(questionBank)
      .where(eq(questionBank.id, id))
      .get();
    if (!current?.questionSetId) return { error: 'Paket soal tidak ditemukan.' };
    const writable = await requireWritableSet(current.questionSetId);
    if ('error' in writable) return writable;
    await db.delete(questionBank).where(eq(questionBank.id, id));
    revalidatePath('/dashboard/trainer/questions');
    revalidatePath('/dashboard/trainer/classes');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Gagal menghapus soal.' };
  }
}

export async function createQuestionForm(formData: FormData): Promise<void> {
  await createQuestion(formData);
}

type QuestionImportRow = Record<string, string>;

function pick(row: QuestionImportRow, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (value != null && String(value).trim()) return String(value).trim();
  }
  return '';
}

export async function importQuestions(formData: FormData) {
  const trainingId = Number(formData.get('trainingId'));
  const questionSetId = Number(formData.get('questionSetId'));
  const rowsJson = String(formData.get('rowsJson') ?? '');
  if (!trainingId || !questionSetId || !rowsJson) return { error: 'Pilih pelatihan, paket soal, dan file import.' };
  const writable = await requireWritableSet(questionSetId);
  if ('error' in writable) return writable;
  if (trainingId !== writable.set.trainingId) {
    return { error: 'Pelatihan harus sesuai dengan paket soal yang dipilih.' };
  }

  const rows = JSON.parse(rowsJson) as QuestionImportRow[];
  const values = rows.map((row) => {
    const options = ['optionA', 'optionB', 'optionC', 'optionD']
      .map((key) => pick(row, [key, key.toLowerCase()]))
      .filter(Boolean);
    return {
      trainingId,
      questionSetId,
      type: normalizeQuestionType(pick(row, ['type', 'tipe']) || 'multiple_choice'),
      question: pick(row, ['question', 'pertanyaan']),
      options,
      correctAnswer: pick(row, ['correctAnswer', 'jawabanBenar', 'answer']),
      mediaUrl: pick(row, ['mediaUrl', 'media_url']) || null,
      mediaType: pick(row, ['mediaType', 'media_type']) || null,
      mediaName: pick(row, ['mediaName', 'media_name']) || null,
    };
  }).filter((row) => row.question);

  if (values.length === 0) return { error: 'Tidak ada soal valid untuk diimpor.' };

  await db.insert(questionBank).values(values);
  revalidatePath('/dashboard/trainer/questions');
  revalidatePath('/dashboard/trainer/classes');
  return { success: true };
}

export async function duplicateQuestionSet(questionSetId: number) {
  const access = await requireQuestionBankManager();
  if ('error' in access) return access;

  const source = await db.select().from(questionSets).where(eq(questionSets.id, questionSetId)).get();
  if (!source || source.status !== 'published') return { error: 'Paket soal tidak ditemukan.' };
  const questions = await db.select().from(questionBank)
    .where(eq(questionBank.questionSetId, questionSetId))
    .orderBy(questionBank.id);

  const created = await db.insert(questionSets).values({
    trainingId: source.trainingId,
    trainerId: access.userId,
    title: `${source.title} - Salinan`,
    description: source.description,
    status: 'published',
    isLocked: false,
  }).returning({ id: questionSets.id });
  const newSetId = created[0]?.id;
  if (!newSetId) return { error: 'Gagal menduplikasi paket soal.' };

  if (questions.length > 0) {
    await db.insert(questionBank).values(questions.map((question) => ({
      trainingId: question.trainingId,
      questionSetId: newSetId,
      type: question.type,
      question: question.question,
      options: question.options,
      correctAnswer: question.correctAnswer,
      mediaUrl: question.mediaUrl,
      mediaType: question.mediaType,
      mediaName: question.mediaName,
    })));
  }
  revalidatePath('/dashboard/trainer/questions');
  return { success: true, questionSetId: newSetId };
}

export async function createQuestionSetForm(formData: FormData): Promise<void> {
  await createQuestionSet(formData);
}

export async function importQuestionsForm(formData: FormData): Promise<void> {
  await importQuestions(formData);
}
