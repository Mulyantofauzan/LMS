import { db } from "@/db";
import { questionBank, trainingSessions, trainings, users } from "@/db/schema";
import { enrollByNrpForm, getActiveMasters, registerAndEnrollForm, submitExamForm } from "@/lib/actions/public-class-actions";
import { eq } from "drizzle-orm";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { notFound } from "next/navigation";
import { hasMultipleChoiceOptions, isMultipleChoiceType } from "@/lib/question-utils";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(value);
}

function isClassAccessible(item: { status: string }) {
  return item.status === 'active';
}

const pageShellClass = "min-h-screen bg-slate-100 text-slate-950";
const centeredShellClass = `${pageShellClass} flex items-center justify-center p-4`;
const cardClass = "w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 text-slate-950 shadow-sm";
const labelClass = "block space-y-2 text-sm font-medium text-slate-700";
const fieldClass = "w-full h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
const selectClass = `${fieldClass} appearance-auto`;

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
      <main className={centeredShellClass}>
        <div className={`${cardClass} text-center`}>
          <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-slate-950">Kelas belum aktif</h1>
          <p className="mt-2 text-sm text-slate-600">Akses absensi, pre-test, dan post-test hanya dibuka setelah trainer menekan tombol Mulai dan akan tertutup setelah kelas diakhiri.</p>
          <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
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
      <main className={centeredShellClass}>
        <div className={cardClass}>
          <h1 className="text-2xl font-bold text-slate-950">{label}</h1>
          <p className="mt-1 text-sm text-slate-600">{item.title} bersama {item.trainer}</p>
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
              <label className={labelClass}>
                NRP
                <input name="nrp" required defaultValue={nrp} className={fieldClass} />
              </label>
              <label className={labelClass}>
                Lokasi Kerja
                <select name="jobsiteId" required defaultValue={item.jobsiteId ?? ''} className={selectClass}>
                  <option value="">Pilih jobsite</option>
                  {masters.jobsites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}
                </select>
              </label>
              <label className={labelClass}>
                Nama Lengkap
                <input name="name" required className={fieldClass} />
              </label>
              <label className={labelClass}>
                Email
                <input type="email" name="email" required className={fieldClass} />
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className={labelClass}>
                  Departemen
                  <select name="department" required className={selectClass}>
                    <option value="">Pilih</option>
                    {masters.departments.map((department) => <option key={department.id} value={department.name}>{department.name}</option>)}
                  </select>
                </label>
                <label className={labelClass}>
                  Jabatan
                  <select name="position" required className={selectClass}>
                    <option value="">Pilih</option>
                    {masters.positions.map((position) => <option key={position.id} value={position.name}>{position.name}</option>)}
                  </select>
                </label>
              </div>
              <label className={labelClass}>
                Password
                <input type="password" name="password" required minLength={6} className={fieldClass} />
              </label>
              <button type="submit" className="w-full h-11 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90">
                {returnTo === 'attendance' ? 'Buat Akun & Absen' : 'Buat Akun & Lanjutkan'}
              </button>
            </form>
          ) : (
            <form action={enrollByNrpForm} className="mt-6 space-y-4">
              <input type="hidden" name="sessionId" value={sessionId} />
              <label className={labelClass}>
                Masukkan NRP
                <input name="nrp" required autoFocus className={fieldClass} />
              </label>
              <button type="submit" className="w-full h-11 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90">Cek NRP & Absen Hadir</button>
            </form>
          )}
        </div>
      </main>
    );
  }

  const questionRows = item.questionSetId
    ? await db.select().from(questionBank)
      .where(eq(questionBank.questionSetId, item.questionSetId))
      .orderBy(questionBank.id)
    : [];
  const questions = questionRows.filter((question) => (
    isMultipleChoiceType(question.type) && hasMultipleChoiceOptions(question.options)
  ));

  return (
    <main className={`${pageShellClass} p-4`}>
      <div className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-6 text-slate-950 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-950">{label}</h1>
        <p className="mt-1 text-sm text-slate-600">{item.title} bersama {item.trainer}</p>
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
          <div className="mt-6 rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
            Bank soal belum dipilih atau belum memiliki soal pilihan ganda.
          </div>
        ) : (
          <form action={submitExamForm} className="mt-6 space-y-5">
            <input type="hidden" name="sessionId" value={sessionId} />
            <input type="hidden" name="type" value={mode} />
            <input type="hidden" name="totalQuestions" value={questions.length} />
            <label className={labelClass}>
              NRP Peserta
              <input name="nrp" required defaultValue={nrp} className={fieldClass} />
            </label>
            {questions.map((question, index) => {
              const options = Array.isArray(question.options) ? question.options as string[] : [];
              return (
                <fieldset key={question.id} className="rounded-lg border border-slate-200 p-4 text-slate-900">
                  <legend className="px-2 text-sm font-semibold text-slate-950">Soal {index + 1}</legend>
                  <p className="mt-2 text-sm font-medium text-slate-800">{question.question}</p>
                  {question.mediaUrl && question.mediaType === 'image' && (
                    <img src={question.mediaUrl} alt={question.mediaName || `Media soal ${index + 1}`} className="mt-3 max-h-80 w-full rounded-md border border-slate-200 object-contain" />
                  )}
                  {question.mediaUrl && question.mediaType === 'video' && (
                    <video src={question.mediaUrl} controls preload="metadata" className="mt-3 max-h-80 w-full rounded-md border border-slate-200" />
                  )}
                  <div className="mt-3 space-y-2">
                    {options.map((option) => (
                      <label key={option} className="flex items-center gap-2 text-sm text-slate-700">
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
