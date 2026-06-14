import { db } from "@/db";
import { questionSets, trainingSessions, trainings, users } from "@/db/schema";
import { BookOpen, CalendarDays, Plus } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { TrainingRowActions } from "./training-row-actions";
import { and, eq, ne } from "drizzle-orm";
import { TrainingCreateForm } from "./training-create-form";
import { TrainingSessionCreateForm, TrainingSessionRowActions } from "./training-session-controls";

type SessionUser = {
  id?: string | number | null;
  role?: string | null;
};

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(value);
}

export default async function TrainingsPage() {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  const role = user?.role;
  if (role !== 'site-admin' && role !== 'super-admin') {
    redirect('/dashboard');
  }

  const currentUser = await db.select({ jobsiteId: users.jobsiteId })
    .from(users)
    .where(eq(users.id, Number(user?.id)))
    .get();
  const siteJobsiteId = role === 'site-admin' ? currentUser?.jobsiteId ?? null : null;

  const allTrainings = siteJobsiteId
    ? await db.select().from(trainings).where(eq(trainings.jobsiteId, siteJobsiteId)).orderBy(trainings.title)
    : await db.select().from(trainings).orderBy(trainings.title);
  const approvedTrainings = allTrainings.filter((training) => training.approvalStatus === 'approved');
  const globalQuestionSets = await db.select({
    id: questionSets.id,
    title: questionSets.title,
    ownerName: users.name,
  })
    .from(questionSets)
    .innerJoin(users, eq(questionSets.trainerId, users.id))
    .where(eq(questionSets.status, 'published'))
    .orderBy(questionSets.title);
  const trainers = siteJobsiteId
    ? await db.select({ id: users.id, name: users.name }).from(users).where(and(eq(users.role, 'trainer'), eq(users.jobsiteId, siteJobsiteId))).orderBy(users.name)
    : await db.select({ id: users.id, name: users.name }).from(users).where(eq(users.role, 'trainer')).orderBy(users.name);
  const schedules = await db.select({
    id: trainingSessions.id,
    trainingId: trainingSessions.trainingId,
    trainerId: trainingSessions.trainerId,
    trainingTitle: trainings.title,
    trainerName: users.name,
    startTime: trainingSessions.startTime,
    endTime: trainingSessions.endTime,
    location: trainingSessions.location,
    status: trainingSessions.status,
  })
  .from(trainingSessions)
  .innerJoin(trainings, eq(trainingSessions.trainingId, trainings.id))
  .innerJoin(users, eq(trainingSessions.trainerId, users.id))
  .where(siteJobsiteId
    ? and(eq(trainings.jobsiteId, siteJobsiteId), ne(trainingSessions.status, 'ended'))
    : ne(trainingSessions.status, 'ended'))
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
          <TrainingCreateForm questionSets={globalQuestionSets} />
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
                    {t.certificateEnabled && <span className="text-xs font-medium bg-amber-100 text-amber-700 px-2 py-1 rounded">Sertifikat</span>}
                    <span className={`text-xs font-medium px-2 py-1 rounded capitalize ${t.approvalStatus === 'approved' ? 'bg-green-100 text-green-700' : t.approvalStatus === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{t.approvalStatus.replace('_', ' ')}</span>
                    <TrainingRowActions training={t} questionSets={globalQuestionSets} />
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
          <TrainingSessionCreateForm trainings={approvedTrainings} trainers={trainers} />
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
                    <th className="px-4 py-3 font-semibold">Status</th>
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
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          item.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {item.status === 'active' ? 'Berlangsung' : 'Terjadwal'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <TrainingSessionRowActions
                          item={{
                            ...item,
                            startTime: item.startTime.toISOString(),
                            endTime: item.endTime.toISOString(),
                          }}
                          trainings={approvedTrainings}
                          trainers={trainers}
                        />
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
