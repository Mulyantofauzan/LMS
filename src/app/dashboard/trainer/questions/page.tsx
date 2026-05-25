import { auth } from "@/auth";
import { db } from "@/db";
import { questionBank, questionSets, trainings } from "@/db/schema";
import { createQuestionForm, createQuestionSetForm } from "@/lib/actions/question-actions";
import { redirect } from "next/navigation";
import { FileCheck, Plus } from "lucide-react";
import { eq } from "drizzle-orm";
import { QuestionCardActions } from "./question-card-actions";
import { QuestionImportForm } from "./question-import-form";

export default async function QuestionBankPage({
  searchParams,
}: {
  searchParams?: Promise<{ trainingId?: string }>;
}) {
  const session = await auth();
  if ((session?.user as any)?.role !== 'trainer') redirect('/dashboard');
  const trainerId = Number((session?.user as any)?.id);
  const params = await searchParams;
  const selectedTrainingId = params?.trainingId ?? '';

  const allTrainings = await db.select({ id: trainings.id, title: trainings.title }).from(trainings).orderBy(trainings.title);
  const sets = await db.select({
    id: questionSets.id,
    trainingId: questionSets.trainingId,
    title: questionSets.title,
    description: questionSets.description,
    trainingTitle: trainings.title,
  })
  .from(questionSets)
  .innerJoin(trainings, eq(questionSets.trainingId, trainings.id))
  .where(eq(questionSets.trainerId, trainerId))
  .orderBy(questionSets.title);
  const questions = await db.select({
    id: questionBank.id,
    trainingId: questionBank.trainingId,
    questionSetId: questionBank.questionSetId,
    questionSetTitle: questionSets.title,
    trainingTitle: trainings.title,
    type: questionBank.type,
    question: questionBank.question,
    options: questionBank.options,
    correctAnswer: questionBank.correctAnswer,
  })
  .from(questionBank)
  .innerJoin(trainings, eq(questionBank.trainingId, trainings.id))
  .leftJoin(questionSets, eq(questionBank.questionSetId, questionSets.id))
  .orderBy(trainings.title);
  const selectedSets = selectedTrainingId ? sets.filter((set) => String(set.trainingId) === selectedTrainingId) : sets;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Bank Soal</h1>
          <p className="text-gray-500 dark:text-gray-400">Kelola soal ujian untuk program training.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="space-y-6">
        <div className="border border-border bg-card rounded-xl shadow-sm p-6 h-fit">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Plus className="h-5 w-5"/> Paket Soal</h3>
          <form action={createQuestionSetForm} className="space-y-4">
            <label className="space-y-2 text-sm font-medium block">
              Pelatihan
              <select name="trainingId" required defaultValue={selectedTrainingId} className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm">
                <option value="">Pilih pelatihan</option>
                {allTrainings.map((training) => (
                  <option key={training.id} value={training.id}>{training.title}</option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm font-medium block">
              Nama Paket
              <input name="title" required placeholder="Contoh: Paket A Pre/Post" className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm" />
            </label>
            <label className="space-y-2 text-sm font-medium block">
              Catatan
              <textarea name="description" rows={2} className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm" />
            </label>
            <button type="submit" className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md shadow-sm hover:bg-primary/90 text-sm font-medium transition-colors">
              Simpan Paket
            </button>
          </form>
        </div>

        <div className="border border-border bg-card rounded-xl shadow-sm p-6 h-fit">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Plus className="h-5 w-5"/> Tambah Soal</h3>
          <form action={createQuestionForm} className="space-y-4">
            <label className="space-y-2 text-sm font-medium block">
              Pelatihan
              <select name="trainingId" required defaultValue={selectedTrainingId} className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm">
                <option value="">Pilih pelatihan</option>
                {allTrainings.map((training) => (
                  <option key={training.id} value={training.id}>{training.title}</option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm font-medium block">
              Paket Soal
              <select name="questionSetId" required className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm">
                <option value="">Pilih paket soal</option>
                {selectedSets.map((set) => (
                  <option key={set.id} value={set.id}>{set.title}</option>
                ))}
              </select>
            </label>
            <label className="space-y-2 text-sm font-medium block">
              Tipe
              <select name="type" required className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm">
                <option value="multiple_choice">Multiple Choice</option>
                <option value="essay">Essay</option>
              </select>
            </label>
            <label className="space-y-2 text-sm font-medium block">
              Pertanyaan
              <textarea name="question" required rows={4} className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm" />
            </label>
            <div className="grid grid-cols-2 gap-3">
              {['A', 'B', 'C', 'D'].map((label) => (
                <label key={label} className="space-y-2 text-sm font-medium">
                  Opsi {label}
                  <input name={`option${label}`} className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm" />
                </label>
              ))}
            </div>
            <label className="space-y-2 text-sm font-medium block">
              Jawaban Benar
              <input name="correctAnswer" className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm" />
            </label>
            <button type="submit" className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md shadow-sm hover:bg-primary/90 text-sm font-medium transition-colors">
              Simpan Soal
            </button>
          </form>
        </div>

        <div className="border border-border bg-card rounded-xl shadow-sm p-6 h-fit">
          <h3 className="text-lg font-semibold mb-4">Import / Export</h3>
          <div className="mb-4 flex flex-wrap gap-2 text-sm">
            <a href="/api/question-bank/template?format=csv" className="text-primary hover:underline">Template CSV</a>
            <a href="/api/question-bank/template?format=xlsx" className="text-primary hover:underline">Template Excel</a>
          </div>
          <QuestionImportForm trainings={allTrainings} questionSets={sets.map((set) => ({ id: set.id, title: set.title, trainingId: set.trainingId }))} />
        </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {questions.length === 0 ? (
            <div className="md:col-span-2 p-8 border border-dashed border-border rounded-xl bg-card text-center text-sm text-gray-500">
              Belum ada soal tersimpan.
            </div>
          ) : questions.map((q) => (
          <div key={q.id} className="p-6 border border-border rounded-xl bg-card shadow-sm card-hover">
            <div className="flex items-start justify-between mb-3">
              <FileCheck className="h-8 w-8 text-primary" />
              <span className="text-[10px] uppercase tracking-wider font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{q.type.replace('_', ' ')}</span>
            </div>
            <h3 className="font-bold text-lg mb-1">{q.trainingTitle}</h3>
            <p className="text-xs text-primary mb-2">{q.questionSetTitle || 'Belum masuk paket'}</p>
            <p className="text-sm text-gray-500 mb-4 line-clamp-3">{q.question}</p>
            <QuestionCardActions
              question={{
                id: q.id,
                trainingId: q.trainingId,
                type: q.type,
                question: q.question,
                options: q.options,
                correctAnswer: q.correctAnswer,
              }}
              trainings={allTrainings}
            />
          </div>
          ))}
        </div>
      </div>
    </div>
  );
}
