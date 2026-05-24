import { db } from "@/db";
import { trainingSessions, trainings } from "@/db/schema";
import { auth } from "@/auth";
import TrainingForm from "./class-form";
import { redirect } from "next/navigation";
import { BookOpen, Plus } from "lucide-react";
import { and, eq, sql } from "drizzle-orm";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(value);
}

export default async function TrainerDashboard() {
  const session = await auth();
  if ((session?.user as any)?.role !== 'trainer') {
    redirect('/dashboard');
  }
  const trainerId = Number((session?.user as any)?.id);

  const assignedTrainings = await db.select({
    id: trainings.id,
    title: trainings.title,
    description: trainings.description,
    category: trainings.category,
  })
  .from(trainingSessions)
  .innerJoin(trainings, eq(trainingSessions.trainingId, trainings.id))
  .where(eq(trainingSessions.trainerId, trainerId))
  .groupBy(trainings.id)
  .orderBy(trainings.title);
  const activeSessions = await db.select({
    id: trainingSessions.id,
    title: trainings.title,
    startTime: trainingSessions.startTime,
    endTime: trainingSessions.endTime,
    location: trainingSessions.location,
  })
  .from(trainingSessions)
  .innerJoin(trainings, eq(trainingSessions.trainingId, trainings.id))
  .where(and(
    eq(trainingSessions.trainerId, trainerId),
    eq(trainingSessions.status, 'active'),
  ))
  .orderBy(trainingSessions.startTime);
  const upcomingSessions = await db.select({
    id: trainingSessions.id,
    title: trainings.title,
    startTime: trainingSessions.startTime,
    location: trainingSessions.location,
  })
  .from(trainingSessions)
  .innerJoin(trainings, eq(trainingSessions.trainingId, trainings.id))
  .where(and(eq(trainingSessions.trainerId, trainerId), sql`${trainingSessions.startTime} >= unixepoch()`))
  .orderBy(trainingSessions.startTime);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard Trainer</h1>
          <p className="text-gray-500 dark:text-gray-400">Kelola training, pantau absensi, dan siapkan materi kelas.</p>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        <div className="p-6 border border-border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-gray-500">Total Pelatihan</h3>
            <BookOpen className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold">{assignedTrainings.length}</div>
        </div>
        <div className="p-6 border border-border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-gray-500">Sesi Aktif</h3>
            <Plus className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold">{activeSessions.length}</div>
          <p className="text-xs text-gray-500 mt-1">{activeSessions[0]?.title || 'Tidak ada sesi aktif'}</p>
        </div>
        <div className="p-6 border border-border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-gray-500">Mendatang</h3>
            <BookOpen className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold">{upcomingSessions.length}</div>
          <p className="text-xs text-gray-500 mt-1">{upcomingSessions[0] ? formatDate(upcomingSessions[0].startTime) : 'Belum terjadwal'}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="p-6 border border-border rounded-xl shadow-sm bg-card text-card-foreground">
          <h3 className="font-semibold mb-4 text-xl flex items-center gap-2"><Plus className="h-5 w-5 text-primary" /> Buat Pelatihan Baru</h3>
          <TrainingForm />
        </div>
        
        <div className="p-6 border border-border rounded-xl shadow-sm bg-card text-card-foreground flex flex-col max-h-[500px]">
          <h3 className="font-semibold mb-4 text-xl flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" /> Pelatihan Saya</h3>
          {assignedTrainings.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-gray-500">Belum ada pelatihan.</p>
            </div>
          ) : (
            <ul className="space-y-3 flex-1 overflow-y-auto pr-2">
              {assignedTrainings.map(t => (
                <li key={t.id} className="p-3 border border-border rounded-md bg-background hover:border-gray-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <h4 className="font-medium text-sm">{t.title}</h4>
                    {t.category && <span className="text-[10px] uppercase tracking-wider font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{t.category}</span>}
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2 mt-1">{t.description}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
