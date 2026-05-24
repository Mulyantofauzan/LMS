import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { certificates, enrollments, jobsites, trainingSessions, trainings, users } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { Users, BookOpen, ShieldAlert, Award } from "lucide-react";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(value);
}

export default async function SiteAdminDashboard() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  
  if (role !== 'site-admin' && role !== 'admin') { 
    redirect('/dashboard');
  }
  const currentUser = await db.select({ jobsiteId: users.jobsiteId, jobsiteName: jobsites.name })
    .from(users)
    .leftJoin(jobsites, eq(users.jobsiteId, jobsites.id))
    .where(eq(users.id, Number((session?.user as any)?.id)))
    .get();
  const siteJobsiteId = role === 'site-admin' ? currentUser?.jobsiteId ?? null : null;

  const [employeeCountRow] = siteJobsiteId
    ? await db.select({ count: sql<number>`count(*)` }).from(users).where(eq(users.jobsiteId, siteJobsiteId))
    : await db.select({ count: sql<number>`count(*)` }).from(users);
  const [trainingCountRow] = siteJobsiteId
    ? await db.select({ count: sql<number>`count(*)` }).from(trainings).where(eq(trainings.jobsiteId, siteJobsiteId))
    : await db.select({ count: sql<number>`count(*)` }).from(trainings);
  const [certCountRow] = siteJobsiteId
    ? await db.select({ count: sql<number>`count(*)` }).from(certificates).innerJoin(users, eq(certificates.userId, users.id)).where(eq(users.jobsiteId, siteJobsiteId))
    : await db.select({ count: sql<number>`count(*)` }).from(certificates);
  const [complianceRow] = await db.select({
    completed: sql<number>`sum(case when ${enrollments.status} = 'completed' then 1 else 0 end)`,
    total: sql<number>`count(${enrollments.id})`,
  })
  .from(enrollments)
  .innerJoin(users, eq(enrollments.traineeId, users.id))
  .where(siteJobsiteId ? eq(users.jobsiteId, siteJobsiteId) : undefined);
  const compliance = complianceRow?.total ? Math.round(((complianceRow.completed ?? 0) / complianceRow.total) * 100) : 0;
  const upcomingTrainings = await db.select({
    id: trainingSessions.id,
    title: trainings.title,
    startTime: trainingSessions.startTime,
    trainerName: users.name,
    location: trainingSessions.location,
    enrolled: sql<number>`count(${enrollments.id})`,
  })
  .from(trainingSessions)
  .innerJoin(trainings, eq(trainingSessions.trainingId, trainings.id))
  .innerJoin(users, eq(trainingSessions.trainerId, users.id))
  .leftJoin(enrollments, eq(enrollments.sessionId, trainingSessions.id))
  .where(siteJobsiteId
    ? and(eq(trainings.jobsiteId, siteJobsiteId), sql`${trainingSessions.startTime} >= unixepoch()`)
    : sql`${trainingSessions.startTime} >= unixepoch()`)
  .groupBy(trainingSessions.id)
  .orderBy(trainingSessions.startTime);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard Site {currentUser?.jobsiteName || ''}</h1>
          <p className="text-gray-500 dark:text-gray-400">Pantau karyawan, jadwal pelatihan, kepatuhan, dan sertifikat site.</p>
        </div>
        <Link href="/api/reports/site-summary.csv" className="bg-primary text-primary-foreground px-4 py-2 rounded-md shadow-sm hover:bg-primary/90 text-sm font-medium transition-colors">Ekspor Laporan Site</Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="p-6 border border-border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-gray-500">Karyawan Site</h3>
            <Users className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold">{employeeCountRow?.count ?? 0}</div>
        </div>
        <div className="p-6 border border-border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-gray-500">Pelatihan Site</h3>
            <BookOpen className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold">{trainingCountRow?.count ?? 0}</div>
          <p className="text-xs text-gray-500 mt-1">{upcomingTrainings.length} jadwal mendatang</p>
        </div>
        <div className="p-6 border border-border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-gray-500">Kepatuhan Site</h3>
            <ShieldAlert className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold">{compliance}%</div>
          <p className="text-xs text-gray-500 mt-1">{complianceRow?.completed ?? 0} dari {complianceRow?.total ?? 0} enrollment selesai</p>
        </div>
        <div className="p-6 border border-border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-gray-500">Sertifikat Terbit</h3>
            <Award className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold">{certCountRow?.count ?? 0}</div>
          <p className="text-xs text-gray-500 mt-1">Total aktif di site</p>
        </div>
      </div>

      <div className="p-6 border border-border rounded-xl bg-card shadow-sm">
        <h3 className="font-semibold mb-4 text-lg">Jadwal Training Mendatang</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 uppercase border-b border-border">
              <tr>
                <th className="px-6 py-3 font-medium">Pelatihan</th>
                <th className="px-6 py-3 font-medium">Jadwal</th>
                <th className="px-6 py-3 font-medium">Trainer</th>
                <th className="px-6 py-3 font-medium">Peserta</th>
                <th className="px-6 py-3 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {upcomingTrainings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Belum ada jadwal mendatang.</td>
                </tr>
              ) : upcomingTrainings.map((item) => (
                <tr key={item.id} className="border-b border-border last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 font-medium">{item.title}</td>
                  <td className="px-6 py-4 text-gray-500">{formatDate(item.startTime)}</td>
                  <td className="px-6 py-4">{item.trainerName}</td>
                  <td className="px-6 py-4">{item.enrolled}</td>
                  <td className="px-6 py-4 text-right"><Link href="/dashboard/site-admin/trainings" className="text-primary font-medium hover:underline">Detail</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
