import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ComplianceChart } from "@/components/charts/ComplianceChart";
import { Users, BookOpen, ShieldAlert, CheckCircle2 } from "lucide-react";
import { db } from "@/db";
import { users, trainings, certificates, auditLogs, jobsites } from "@/db/schema";
import { sql, desc } from "drizzle-orm";
import Link from "next/link";

export default async function SuperAdminDashboard() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  
  if (role !== 'super-admin' && role !== 'admin') { 
    redirect('/dashboard');
  }

  // Fetch real statistics
  const usersCountResult = await db.select({ count: sql<number>`count(*)` }).from(users);
  const totalUsers = usersCountResult[0].count;

  const trainingsCountResult = await db.select({ count: sql<number>`count(*)` }).from(trainings);
  const activeTrainings = trainingsCountResult[0].count;

  const jobsitesCountResult = await db.select({ count: sql<number>`count(*)` }).from(jobsites);
  const totalJobsites = jobsitesCountResult[0].count;

  // Mock global compliance for now (as calculating real compliance requires a complex query joining users, mandatory trainings, and certificates)
  const globalCompliance = 84.2;

  // Certificates expiring in 30 days. D1 stores timestamps as unix seconds.
  const expiringCertsResult = await db.select({ count: sql<number>`count(*)` })
    .from(certificates)
    .where(sql`${certificates.expiryDate} <= unixepoch('now', '+30 days') AND ${certificates.expiryDate} > unixepoch('now')`);
  const expiringCerts = expiringCertsResult[0]?.count || 0;

  // Fetch recent audit logs
  const recentLogs = await db.select({
    id: auditLogs.id,
    action: auditLogs.action,
    target: auditLogs.target,
    timestamp: auditLogs.timestamp,
    userName: users.name,
  })
  .from(auditLogs)
  .leftJoin(users, sql`${auditLogs.userId} = ${users.id}`)
  .orderBy(desc(auditLogs.timestamp))
  .limit(5);

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Ringkasan Global</h1>
          <p className="text-gray-500 dark:text-gray-400">Pantau kepatuhan dan statistik pelatihan multi-lokasi.</p>
        </div>
        <div className="flex gap-2">
          <button className="bg-background border border-border text-foreground px-4 py-2 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium transition-colors">Unduh Laporan</button>
          <Link href="/dashboard/super-admin/jobsites" className="bg-primary text-primary-foreground px-4 py-2 rounded-md shadow-sm hover:bg-primary/90 text-sm font-medium transition-colors inline-flex items-center">Kelola Lokasi Kerja</Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="p-6 border border-border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-gray-500">Total Pengguna</h3>
            <Users className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold">{totalUsers}</div>
          <p className="text-xs text-green-500 mt-1 flex items-center"><CheckCircle2 className="h-3 w-3 mr-1"/> Data Real-time</p>
        </div>
        <div className="p-6 border border-border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-gray-500">Pelatihan Aktif</h3>
            <BookOpen className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold">{activeTrainings}</div>
          <p className="text-xs text-gray-500 mt-1">Di {totalJobsites} Lokasi Kerja</p>
        </div>
        <div className="p-6 border border-border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-gray-500">Kepatuhan Global</h3>
            <ShieldAlert className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold">{globalCompliance}%</div>
          <p className="text-xs text-green-500 mt-1 flex items-center"><CheckCircle2 className="h-3 w-3 mr-1"/> Target: 90%</p>
        </div>
        <div className="p-6 border border-border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-gray-500">Sertifikat Kedaluwarsa</h3>
            <ShieldAlert className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600">{expiringCerts}</div>
          <p className="text-xs text-gray-500 mt-1">Dalam 30 hari ke depan</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <div className="p-6 border border-border rounded-xl bg-card shadow-sm md:col-span-4">
          <h3 className="font-semibold mb-6 text-lg">Perbandingan Kepatuhan Lokasi Kerja</h3>
          <ComplianceChart />
        </div>
        <div className="p-6 border border-border rounded-xl bg-card shadow-sm md:col-span-3">
          <h3 className="font-semibold mb-4 text-lg">Log Audit Terbaru</h3>
          <div className="space-y-4">
            {recentLogs.length > 0 ? recentLogs.map((log) => (
              <div key={log.id} className="flex flex-col pb-4 border-b border-border last:border-0 last:pb-0">
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium text-foreground">{log.action}</span>
                  <span className="text-xs text-gray-400">{formatDate(log.timestamp)}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-500">{log.userName || 'Sistem'}</span>
                  <span className="text-[10px] uppercase tracking-wider font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{log.target || 'Global'}</span>
                </div>
              </div>
            )) : (
              <div className="text-sm text-gray-500">Belum ada log audit.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
