'use server';

import { db } from '@/db';
import { questionBank } from '@/db/schema';
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
  const type = formData.get('type') as string;
  const questionText = formData.get('question') as string;
  const correctAnswer = formData.get('correctAnswer') as string;

  if (!trainingIdStr || !type || !questionText) {
    return { error: 'Kolom wajib ada yang kosong.' };
  }

  try {
    const trainingId = parseInt(trainingIdStr, 10);
    const options = parseOptions(formData);

    await db.insert(questionBank).values({
      trainingId,
      type,
      question: questionText,
      options,
      correctAnswer,
    });

    revalidatePath('/dashboard/trainer/questions');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Gagal membuat soal.' };
  }
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
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Gagal menghapus soal.' };
  }
}

export async function createQuestionForm(formData: FormData): Promise<void> {
  await createQuestion(formData);
}
