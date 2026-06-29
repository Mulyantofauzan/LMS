import { auth } from "@/auth";
import { db } from "@/db";
import { questionBank, questionSets, trainings, users } from "@/db/schema";
import { createQuestionSetForm } from "@/lib/actions/question-actions";
import { redirect } from "next/navigation";
import { FileCheck, Plus } from "lucide-react";
import { eq } from "drizzle-orm";
import { QuestionCardActions } from "./question-card-actions";
import { QuestionImportForm } from "./question-import-form";
import { QuestionCreateForm } from "./question-create-form";
import { QuestionSetActions } from "./question-set-actions";

type SessionUser = {
  id?: string | number | null;
  role?: string | null;
};

export default async function QuestionBankPage({
  searchParams,
}: {
  searchParams?: Promise<{ trainingId?: string }>;
}) {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  const role = user?.role;
  if (!['trainer', 'site-admin', 'admin', 'super-admin'].includes(role ?? '')) redirect('/dashboard');
  const actorId = Number(user?.id);
  const canManageAllSets = role === 'admin' || role === 'super-admin';
  const params = await searchParams;
  const selectedTrainingId = params?.trainingId ?? '';

  const actor = role === 'site-admin'
    ? await db.select({ jobsiteId: users.jobsiteId }).from(users).where(eq(users.id, actorId)).get()
    : null;
  const writableTrainings = role === 'site-admin' && actor?.jobsiteId
    ? await db.select({ id: trainings.id, title: trainings.title }).from(trainings).where(eq(trainings.jobsiteId, actor.jobsiteId)).orderBy(trainings.title)
    : await db.select({ id: trainings.id, title: trainings.title }).from(trainings).orderBy(trainings.title);
  const sets = await db.select({
    id: questionSets.id,
    trainingId: questionSets.trainingId,
    trainerId: questionSets.trainerId,
    title: questionSets.title,
    description: questionSets.description,
    status: questionSets.status,
    isLocked: questionSets.isLocked,
    trainingTitle: trainings.title,
    ownerName: users.name,
  })
  .from(questionSets)
  .innerJoin(trainings, eq(questionSets.trainingId, trainings.id))
  .innerJoin(users, eq(questionSets.trainerId, users.id))
  .where(eq(questionSets.status, 'published'))
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
    mediaUrl: questionBank.mediaUrl,
    mediaType: questionBank.mediaType,
    mediaName: questionBank.mediaName,
    ownerId: questionSets.trainerId,
    isLocked: questionSets.isLocked,
  })
  .from(questionBank)
  .innerJoin(trainings, eq(questionBank.trainingId, trainings.id))
  .leftJoin(questionSets, eq(questionBank.questionSetId, questionSets.id))
  .where(eq(questionSets.status, 'published'))
  .orderBy(questionSets.title);
  const writableSets = canManageAllSets ? sets : sets.filter((set) => set.trainerId === actorId);

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
                {writableTrainings.map((training) => (
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
          <QuestionCreateForm
            trainings={writableTrainings}
            questionSets={writableSets.map((set) => ({
              id: set.id,
              title: set.title,
              trainingId: set.trainingId,
              isLocked: set.isLocked,
            }))}
          />
        </div>

        <div className="border border-border bg-card rounded-xl shadow-sm p-6 h-fit">
          <h3 className="text-lg font-semibold mb-4">Import / Export</h3>
          <div className="mb-4 flex flex-wrap gap-2 text-sm">
            <a href="/api/question-bank/template?format=csv" className="text-primary hover:underline">Template CSV</a>
            <a href="/api/question-bank/template?format=xlsx" className="text-primary hover:underline">Template Excel</a>
          </div>
          <QuestionImportForm trainings={writableTrainings} questionSets={writableSets.filter((set) => !set.isLocked).map((set) => ({ id: set.id, title: set.title, trainingId: set.trainingId }))} />
        </div>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="mb-3 text-lg font-semibold">Paket Soal Global</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {sets.map((set) => (
                <div key={set.id} className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{set.title}</p>
                      <p className="text-xs text-gray-500">{set.trainingTitle} · {set.ownerName}</p>
                    </div>
                    {set.isLocked && <span className="rounded bg-amber-100 px-2 py-1 text-[10px] font-semibold text-amber-700">DIKUNCI</span>}
                  </div>
                  <div className="mt-3"><QuestionSetActions questionSetId={set.id} /></div>
                </div>
              ))}
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
            {q.mediaUrl && q.mediaType === 'image' && <img src={q.mediaUrl} alt={q.mediaName || 'Media soal'} className="mb-4 max-h-48 w-full rounded-md border border-border object-contain" />}
            {q.mediaUrl && q.mediaType === 'video' && <video src={q.mediaUrl} controls preload="metadata" className="mb-4 max-h-48 w-full rounded-md border border-border" />}
            <QuestionCardActions
              question={{
                id: q.id,
                trainingId: q.trainingId,
                type: q.type,
                question: q.question,
                options: q.options,
                correctAnswer: q.correctAnswer,
                mediaUrl: q.mediaUrl,
                mediaType: q.mediaType,
                mediaName: q.mediaName,
              }}
              trainings={writableTrainings}
              canEdit={(canManageAllSets || q.ownerId === actorId) && !q.isLocked}
            />
          </div>
          ))}
          </div>
        </div>
      </div>
    </div>
  );
}
