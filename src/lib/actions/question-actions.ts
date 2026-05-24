'use server';

import { db } from '@/db';
import { questionBank, questionSets } from '@/db/schema';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';

async function requireTrainer() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== 'trainer' && role !== 'admin' && role !== 'super-admin') {
    return { error: 'Anda tidak memiliki akses untuk mengubah bank soal.' };
  }
  return null;
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
  const accessError = await requireTrainer();
  if (accessError) return accessError;

  const trainingIdStr = formData.get('trainingId') as string;
  const questionSetIdStr = formData.get('questionSetId') as string;
  const type = formData.get('type') as string;
  const questionText = formData.get('question') as string;
  const correctAnswer = formData.get('correctAnswer') as string;

  if (!trainingIdStr || !type || !questionText) {
    return { error: 'Kolom wajib ada yang kosong.' };
  }

  try {
    const trainingId = parseInt(trainingIdStr, 10);
    const questionSetId = questionSetIdStr ? parseInt(questionSetIdStr, 10) : null;
    const options = parseOptions(formData);

    await db.insert(questionBank).values({
      trainingId,
      questionSetId,
      type,
      question: questionText,
      options,
      correctAnswer,
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
  const accessError = await requireTrainer();
  if (accessError) return accessError;

  const session = await auth();
  const trainerId = Number((session?.user as any)?.id);
  const trainingId = Number(formData.get('trainingId'));
  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  if (!trainingId || !title) return { error: 'Pelatihan dan nama paket soal wajib diisi.' };

  await db.insert(questionSets).values({ trainingId, trainerId, title, description });
  revalidatePath('/dashboard/trainer/questions');
  revalidatePath('/dashboard/trainer/classes');
  return { success: true };
}

export async function updateQuestion(formData: FormData) {
  const accessError = await requireTrainer();
  if (accessError) return accessError;

  const id = Number(formData.get('id'));
  const trainingIdStr = formData.get('trainingId') as string;
  const type = formData.get('type') as string;
  const questionText = formData.get('question') as string;
  const correctAnswer = formData.get('correctAnswer') as string;

  if (!id || !trainingIdStr || !type || !questionText) {
    return { error: 'Data soal tidak lengkap.' };
  }

  try {
    await db.update(questionBank).set({
      trainingId: parseInt(trainingIdStr, 10),
      type,
      question: questionText,
      options: parseOptions(formData),
      correctAnswer,
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
  const accessError = await requireTrainer();
  if (accessError) return accessError;

  try {
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
  const accessError = await requireTrainer();
  if (accessError) return accessError;

  const trainingId = Number(formData.get('trainingId'));
  const questionSetId = Number(formData.get('questionSetId'));
  const rowsJson = String(formData.get('rowsJson') ?? '');
  if (!trainingId || !questionSetId || !rowsJson) return { error: 'Pilih pelatihan, paket soal, dan file import.' };

  const rows = JSON.parse(rowsJson) as QuestionImportRow[];
  const values = rows.map((row) => {
    const options = ['optionA', 'optionB', 'optionC', 'optionD']
      .map((key) => pick(row, [key, key.toLowerCase()]))
      .filter(Boolean);
    return {
      trainingId,
      questionSetId,
      type: pick(row, ['type', 'tipe']) || 'multiple_choice',
      question: pick(row, ['question', 'pertanyaan']),
      options,
      correctAnswer: pick(row, ['correctAnswer', 'jawabanBenar', 'answer']),
    };
  }).filter((row) => row.question);

  if (values.length === 0) return { error: 'Tidak ada soal valid untuk diimpor.' };

  await db.insert(questionBank).values(values);
  revalidatePath('/dashboard/trainer/questions');
  revalidatePath('/dashboard/trainer/classes');
  return { success: true };
}

export async function createQuestionSetForm(formData: FormData): Promise<void> {
  await createQuestionSet(formData);
}

export async function importQuestionsForm(formData: FormData): Promise<void> {
  await importQuestions(formData);
}
