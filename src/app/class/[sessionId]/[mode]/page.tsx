import { db } from "@/db";
import { questionBank, trainingSessions, trainings, users } from "@/db/schema";
import { enrollByNrpForm, getActiveMasters, registerAndEnrollForm, submitExamForm } from "@/lib/actions/class-actions";
import { and, eq } from "drizzle-orm";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { notFound } from "next/navigation";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(value);
}

function isClassAccessible(item: { status: string }) {
  return item.status === 'active';
}

export default async function PublicClassPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string; mode: string }>;
  searchParams?: Promise<{ nrp?: string; register?: string; returnTo?: string; score?: string; registered?: string; checked?: string; name?: string }>;
}) {
  const { sessionId: sessionIdParam, mode } = await params;
  const search = await searchParams;
  const sessionId = Number(sessionIdParam);
  if (!sessionId || !['attendance', 'pretest', 'posttest'].includes(mode)) notFound();

  const item = await db.select({
    id: trainingSessions.id,
    title: trainings.title,
    trainer: users.name,
    startTime: trainingSessions.startTime,
    endTime: trainingSessions.endTime,
    location: trainingSessions.location,
    status: trainingSessions.status,
    questionSetId: trainingSessions.questionSetId,
    jobsiteId: trainings.jobsiteId,
  })
  .from(trainingSessions)
  .innerJoin(trainings, eq(trainingSessions.trainingId, trainings.id))
  .innerJoin(users, eq(trainingSessions.trainerId, users.id))
  .where(eq(trainingSessions.id, sessionId))
  .get();

  if (!item) notFound();

  const isOpen = isClassAccessible(item);
  const label = mode === 'attendance' ? 'Absensi Kelas' : mode === 'pretest' ? 'Pre-test' : 'Post-test';

  if (!isOpen) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-xl border border-border bg-white p-6 shadow-sm text-center">
          <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
          <h1 className="text-xl font-bold">Kelas belum aktif</h1>
          <p className="mt-2 text-sm text-gray-600">Akses absensi, pre-test, dan post-test hanya dibuka setelah trainer menekan tombol Mulai dan akan tertutup setelah kelas diakhiri.</p>
          <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
            {item.title}<br />
            {formatDate(item.startTime)} - {formatDate(item.endTime)}
          </div>
        </div>
      </main>
    );
  }

  const registered = search?.registered === '1';
  const checked = search?.checked === '1';
  const register = search?.register === '1';
  const nrp = search?.nrp ?? '';
  const checkedName = search?.name ?? '';
  const returnTo = ['attendance', 'pretest', 'posttest'].includes(search?.returnTo ?? '') ? search?.returnTo ?? 'attendance' : 'attendance';

  if (mode === 'attendance') {
    const masters = register ? await getActiveMasters() : { jobsites: [], departments: [], positions: [] };
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-xl border border-border bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold">{label}</h1>
          <p className="mt-1 text-sm text-gray-600">{item.title} bersama {item.trainer}</p>
          {registered && (
            <div className="mt-4 rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Akun dibuat dan absensi berhasil dicatat.
            </div>
          )}
          {checked && (
            <div className="mt-4 rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              {checkedName ? `${checkedName} berhasil tercatat hadir.` : 'Absensi berhasil dicatat.'}
            </div>
          )}
          {register ? (
            <form action={registerAndEnrollForm} className="mt-6 space-y-4">
              <input type="hidden" name="sessionId" value={sessionId} />
              <input type="hidden" name="returnTo" value={returnTo} />
              <label className="block space-y-2 text-sm font-medium">
                NRP
                <input name="nrp" required defaultValue={nrp} className="w-full h-11 px-3 rounded-md border border-border bg-white text-sm" />
              </label>
              <label className="block space-y-2 text-sm font-medium">
                Lokasi Kerja
                <select name="jobsiteId" required defaultValue={item.jobsiteId ?? ''} className="w-full h-11 px-3 rounded-md border border-border bg-white text-sm">
                  <option value="">Pilih jobsite</option>
                  {masters.jobsites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}
                </select>
              </label>
              <label className="block space-y-2 text-sm font-medium">
                Nama Lengkap
                <input name="name" required className="w-full h-11 px-3 rounded-md border border-border bg-white text-sm" />
              </label>
              <label className="block space-y-2 text-sm font-medium">
                Email
                <input type="email" name="email" required className="w-full h-11 px-3 rounded-md border border-border bg-white text-sm" />
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block space-y-2 text-sm font-medium">
                  Departemen
                  <select name="department" required className="w-full h-11 px-3 rounded-md border border-border bg-white text-sm">
                    <option value="">Pilih</option>
                    {masters.departments.map((department) => <option key={department.id} value={department.name}>{department.name}</option>)}
                  </select>
                </label>
                <label className="block space-y-2 text-sm font-medium">
                  Jabatan
                  <select name="position" required className="w-full h-11 px-3 rounded-md border border-border bg-white text-sm">
                    <option value="">Pilih</option>
                    {masters.positions.map((position) => <option key={position.id} value={position.name}>{position.name}</option>)}
                  </select>
                </label>
              </div>
              <label className="block space-y-2 text-sm font-medium">
                Password
                <input type="password" name="password" required minLength={6} className="w-full h-11 px-3 rounded-md border border-border bg-white text-sm" />
              </label>
              <button type="submit" className="w-full h-11 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90">
                {returnTo === 'attendance' ? 'Buat Akun & Absen' : 'Buat Akun & Lanjutkan'}
              </button>
            </form>
          ) : (
            <form action={enrollByNrpForm} className="mt-6 space-y-4">
              <input type="hidden" name="sessionId" value={sessionId} />
              <label className="block space-y-2 text-sm font-medium">
                Masukkan NRP
                <input name="nrp" required autoFocus className="w-full h-11 px-3 rounded-md border border-border bg-white text-sm" />
              </label>
              <button type="submit" className="w-full h-11 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90">Cek NRP & Absen Hadir</button>
            </form>
          )}
        </div>
      </main>
    );
  }

  const questions = item.questionSetId
    ? await db.select().from(questionBank)
      .where(and(eq(questionBank.questionSetId, item.questionSetId), eq(questionBank.type, 'multiple_choice')))
      .orderBy(questionBank.id)
    : [];

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-3xl rounded-xl border border-border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">{label}</h1>
        <p className="mt-1 text-sm text-gray-600">{item.title} bersama {item.trainer}</p>
        {search?.score && (
          <div className="mt-4 rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700">
            Nilai Anda berhasil disimpan: <strong>{search.score}%</strong>
          </div>
        )}
        {registered && (
          <div className="mt-4 rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700">
            Akun berhasil dibuat. NRP sudah terisi, silakan lanjutkan mengerjakan {label.toLowerCase()}.
          </div>
        )}
        {questions.length === 0 ? (
          <div className="mt-6 rounded-lg border border-dashed border-border p-6 text-center text-sm text-gray-500">
            Bank soal belum dipilih atau belum memiliki soal pilihan ganda.
          </div>
        ) : (
          <form action={submitExamForm} className="mt-6 space-y-5">
            <input type="hidden" name="sessionId" value={sessionId} />
            <input type="hidden" name="type" value={mode} />
            <input type="hidden" name="totalQuestions" value={questions.length} />
            <label className="block space-y-2 text-sm font-medium">
              NRP Peserta
              <input name="nrp" required defaultValue={nrp} className="w-full h-11 px-3 rounded-md border border-border bg-white text-sm" />
            </label>
            {questions.map((question, index) => {
              const options = Array.isArray(question.options) ? question.options as string[] : [];
              return (
                <fieldset key={question.id} className="rounded-lg border border-border p-4">
                  <legend className="px-2 text-sm font-semibold">Soal {index + 1}</legend>
                  <p className="mt-2 text-sm font-medium">{question.question}</p>
                  <input type="hidden" name={`correct-${index}`} value={question.correctAnswer ?? ''} />
                  <div className="mt-3 space-y-2">
                    {options.map((option) => (
                      <label key={option} className="flex items-center gap-2 text-sm">
                        <input type="radio" name={`answer-${index}`} value={option} required className="h-4 w-4" />
                        {option}
                      </label>
                    ))}
                  </div>
                </fieldset>
              );
            })}
            <button type="submit" className="w-full h-11 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90">Kirim Jawaban</button>
          </form>
        )}
      </div>
    </main>
  );
}
