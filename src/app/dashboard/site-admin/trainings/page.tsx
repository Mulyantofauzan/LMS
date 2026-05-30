import { db } from "@/db";
import { trainingSessions, trainings, users } from "@/db/schema";
import { createTraining, createTrainingSession, deleteTrainingSession } from "./actions";
import { BookOpen, CalendarDays, Plus, Trash2, Upload } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { TrainingRowActions } from "./training-row-actions";
import { and, eq, sql } from "drizzle-orm";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(value);
}

export default async function TrainingsPage() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== 'site-admin' && role !== 'super-admin') {
    redirect('/dashboard');
  }

  const currentUser = await db.select({ jobsiteId: users.jobsiteId })
    .from(users)
    .where(eq(users.id, Number((session?.user as any)?.id)))
    .get();
  const siteJobsiteId = role === 'site-admin' ? currentUser?.jobsiteId ?? null : null;

  const allTrainings = siteJobsiteId
    ? await db.select().from(trainings).where(eq(trainings.jobsiteId, siteJobsiteId)).orderBy(trainings.title)
    : await db.select().from(trainings).orderBy(trainings.title);
  const approvedTrainings = allTrainings.filter((training) => training.approvalStatus === 'approved');
  const trainers = siteJobsiteId
    ? await db.select({ id: users.id, name: users.name }).from(users).where(and(eq(users.role, 'trainer'), eq(users.jobsiteId, siteJobsiteId))).orderBy(users.name)
    : await db.select({ id: users.id, name: users.name }).from(users).where(eq(users.role, 'trainer')).orderBy(users.name);
  const schedules = await db.select({
    id: trainingSessions.id,
    trainingTitle: trainings.title,
    trainerName: users.name,
    startTime: trainingSessions.startTime,
    endTime: trainingSessions.endTime,
    location: trainingSessions.location,
    enrolled: sql<number>`count(${trainingSessions.id})`,
  })
  .from(trainingSessions)
  .innerJoin(trainings, eq(trainingSessions.trainingId, trainings.id))
  .innerJoin(users, eq(trainingSessions.trainerId, users.id))
  .where(siteJobsiteId ? eq(trainings.jobsiteId, siteJobsiteId) : undefined)
  .groupBy(trainingSessions.id)
  .orderBy(trainingSessions.startTime);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Manajemen Pelatihan</h1>
          <p className="text-gray-500 dark:text-gray-400">Kelola program dan jadwal training untuk site Anda.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1 border border-border bg-card rounded-xl shadow-sm p-6 h-fit">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Plus className="h-5 w-5"/> Buat Pelatihan</h3>
          <form action={createTraining} encType="multipart/form-data" className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Judul Pelatihan</label>
              <input type="text" name="title" required className="w-full rounded-md border border-border px-3 py-2 bg-background" placeholder="Contoh: Safety Forklift"/>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Deskripsi</label>
              <textarea name="description" rows={3} className="w-full rounded-md border border-border px-3 py-2 bg-background" placeholder="Detail pelatihan..."/>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Kategori</label>
                <select name="category" className="w-full rounded-md border border-border px-3 py-2 bg-background">
                  <option value="safety">Safety</option>
                  <option value="technical">Technical</option>
                  <option value="compliance">Compliance</option>
                  <option value="soft_skills">Soft Skills</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tipe</label>
                <select name="type" className="w-full rounded-md border border-border px-3 py-2 bg-background">
                  <option value="offline">Offline</option>
                  <option value="online">Online</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2 pb-2">
              <input type="checkbox" name="isMandatory" id="isMandatory" className="rounded border-border text-primary w-4 h-4"/>
              <label htmlFor="isMandatory" className="text-sm font-medium">Wajib untuk karyawan site</label>
            </div>
            <label className="block text-sm font-medium space-y-2">
              Materi awal
              <span className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-background px-4 py-3 text-center text-xs text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800">
                <Upload className="h-5 w-5 text-gray-400" />
                Upload PDF, PPT, atau video
                <input name="materials" type="file" accept=".pdf,.ppt,.pptx,video/*" multiple className="sr-only" />
              </span>
            </label>
            <button type="submit" className="w-full bg-primary text-primary-foreground font-medium py-2 rounded-md hover:bg-primary/90 transition-colors">Simpan Pelatihan</button>
          </form>
        </div>

        <div className="md:col-span-2 border border-border bg-card rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><BookOpen className="h-5 w-5"/> Direktori Pelatihan</h3>
          {allTrainings.length === 0 ? (
            <div className="text-center py-12 text-gray-500 border border-dashed border-border rounded-lg">
              Belum ada pelatihan.
            </div>
          ) : (
            <div className="space-y-3">
                {allTrainings.map(t => (
                <div key={t.id} className="p-4 border border-border rounded-lg bg-background flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-gray-300 transition-colors">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold">{t.title}</h4>
                      {t.isMandatory && <span className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">Wajib</span>}
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-1">{t.description}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs font-medium bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-600 dark:text-gray-300 capitalize">{t.category?.replace('_', ' ')}</span>
                    <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded capitalize">{t.type}</span>
                    <span className={`text-xs font-medium px-2 py-1 rounded capitalize ${t.approvalStatus === 'approved' ? 'bg-green-100 text-green-700' : t.approvalStatus === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{t.approvalStatus.replace('_', ' ')}</span>
                    <TrainingRowActions training={t} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="border border-border bg-card rounded-xl shadow-sm p-6 h-fit">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><CalendarDays className="h-5 w-5"/> Buat Jadwal</h3>
          <form action={createTrainingSession} className="space-y-4">
            <label className="block text-sm font-medium space-y-1">
              Pelatihan
              <select name="trainingId" required className="w-full rounded-md border border-border px-3 py-2 bg-background">
                <option value="">Pilih pelatihan</option>
                {approvedTrainings.map((training) => (
                  <option key={training.id} value={training.id}>{training.title}</option>
                ))}
              </select>
              {approvedTrainings.length === 0 && <span className="text-xs text-amber-600">Belum ada training yang sudah approve manager.</span>}
            </label>
            <label className="block text-sm font-medium space-y-1">
              Trainer
              <select name="trainerId" required className="w-full rounded-md border border-border px-3 py-2 bg-background">
                <option value="">Pilih trainer</option>
                {trainers.map((trainer) => (
                  <option key={trainer.id} value={trainer.id}>{trainer.name}</option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-1 gap-4">
              <label className="block text-sm font-medium space-y-1">
                Mulai
                <input type="datetime-local" name="startTime" required className="w-full rounded-md border border-border px-3 py-2 bg-background" />
              </label>
              <label className="block text-sm font-medium space-y-1">
                Selesai
                <input type="datetime-local" name="endTime" required className="w-full rounded-md border border-border px-3 py-2 bg-background" />
              </label>
            </div>
            <label className="block text-sm font-medium space-y-1">
              Lokasi
              <input name="location" className="w-full rounded-md border border-border px-3 py-2 bg-background" placeholder="Ruang training / online" />
            </label>
            <button type="submit" className="w-full bg-primary text-primary-foreground font-medium py-2 rounded-md hover:bg-primary/90 transition-colors">Simpan Jadwal</button>
          </form>
        </div>

        <div className="border border-border bg-card rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><CalendarDays className="h-5 w-5"/> Jadwal Training Site</h3>
          {schedules.length === 0 ? (
            <div className="text-center py-12 text-gray-500 border border-dashed border-border rounded-lg">Belum ada jadwal.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-900/50 border-b border-border">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Pelatihan</th>
                    <th className="px-4 py-3 font-semibold">Trainer</th>
                    <th className="px-4 py-3 font-semibold">Jadwal</th>
                    <th className="px-4 py-3 font-semibold">Lokasi</th>
                    <th className="px-4 py-3 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {schedules.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 font-medium">{item.trainingTitle}</td>
                      <td className="px-4 py-3">{item.trainerName}</td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(item.startTime)} - {formatDate(item.endTime)}</td>
                      <td className="px-4 py-3 text-gray-500">{item.location || '-'}</td>
                      <td className="px-4 py-3 text-right">
                        <form action={deleteTrainingSession}>
                          <input type="hidden" name="sessionId" value={item.id} />
                          <button type="submit" className="inline-flex items-center gap-1.5 text-red-600 font-medium hover:underline">
                            <Trash2 className="h-4 w-4" />
                            Hapus
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
