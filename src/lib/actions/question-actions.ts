'use server';

import { db } from '@/db';
import { questionBank } from '@/db/schema';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';

export async function createQuestion(formData: FormData) {
  const trainingIdStr = formData.get('trainingId') as string;
  const type = formData.get('type') as string;
  const questionText = formData.get('question') as string;
  const optionsStr = formData.get('options') as string; // JSON string
  const correctAnswer = formData.get('correctAnswer') as string;

  if (!trainingIdStr || !type || !questionText) {
    return { error: 'Kolom wajib ada yang kosong.' };
  }

  try {
    const trainingId = parseInt(trainingIdStr, 10);
    const options = optionsStr ? JSON.parse(optionsStr) : null;

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

export async function deleteQuestion(id: number) {
  try {
    await db.delete(questionBank).where(eq(questionBank.id, id));
    revalidatePath('/dashboard/trainer/questions');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Gagal menghapus soal.' };
  }
}
