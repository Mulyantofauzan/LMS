import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ComplianceChart } from "@/components/charts/ComplianceChart";
import { Users, BookOpen, ShieldAlert, CheckCircle2 } from "lucide-react";
import { db } from "@/db";
import { users, certificates, externalCertificates, auditLogs, jobsites, trainingSessions } from "@/db/schema";
import { sql, desc, eq } from "drizzle-orm";
import Link from "next/link";
import { getSessionUser } from "@/lib/session-user";
import { getComplianceStats } from "@/lib/compliance-stats";
import { connection } from "next/server";

export default async function SuperAdminDashboard() {
  await connection();
  const session = await auth();
  const role = getSessionUser(session?.user)?.role;
  
  if (role !== 'super-admin' && role !== 'admin') { 
    redirect('/dashboard');
  }

  const [
    complianceStats,
    activeSessionsResult,
    scheduledSessionsResult,
    jobsitesCountResult,
    internalExpiringResult,
    externalExpiringResult,
    recentLogs,
  ] = await Promise.all([
    getComplianceStats(),
    db.select({ count: sql<number>`count(*)` })
      .from(trainingSessions)
      .where(eq(trainingSessions.status, 'active')),
    db.select({ count: sql<number>`count(*)` })
      .from(trainingSessions)
      .where(eq(trainingSessions.status, 'scheduled')),
    db.select({ count: sql<number>`count(*)` }).from(jobsites),
    db.select({ count: sql<number>`count(*)` })
      .from(certificates)
      .innerJoin(users, eq(certificates.userId, users.id))
      .where(sql`${users.isActive} = 1 AND ${certificates.expiryDate} <= unixepoch('now', '+60 days') AND ${certificates.expiryDate} > unixepoch('now')`),
    db.select({ count: sql<number>`count(*)` })
      .from(externalCertificates)
      .innerJoin(users, eq(externalCertificates.userId, users.id))
      .where(sql`${users.isActive} = 1 AND ${externalCertificates.expiryDate} <= unixepoch('now', '+60 days') AND ${externalCertificates.expiryDate} > unixepoch('now')`),
    db.select({
      id: auditLogs.id,
      action: auditLogs.action,
      target: auditLogs.target,
      timestamp: auditLogs.timestamp,
      userName: users.name,
    })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .orderBy(desc(auditLogs.timestamp))
      .limit(5),
  ]);

  const totalUsers = complianceStats.activeUsers;
  const activeTrainings = activeSessionsResult[0]?.count ?? 0;
  const scheduledTrainings = scheduledSessionsResult[0]?.count ?? 0;
  const totalJobsites = jobsitesCountResult[0]?.count ?? 0;
  const globalCompliance = complianceStats.global.percentage;
  const expiringCerts = (internalExpiringResult[0]?.count ?? 0) + (externalExpiringResult[0]?.count ?? 0);
  const chartData = complianceStats.sites.map((site) => ({
    name: site.name,
    compliance: site.percentage,
    missing: site.total > 0 ? 100 - site.percentage : 0,
  }));

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
          <Link href="/api/reports/compliance.csv" className="bg-background border border-border text-foreground px-4 py-2 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium transition-colors">Unduh Laporan</Link>
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
          <p className="text-xs text-gray-500 mt-1">{scheduledTrainings} terjadwal di {totalJobsites} lokasi kerja</p>
        </div>
        <div className="p-6 border border-border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-gray-500">Kepatuhan Global</h3>
            <ShieldAlert className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold">{globalCompliance}%</div>
          <p className="text-xs text-gray-500 mt-1">
            {complianceStats.global.total > 0
              ? `${complianceStats.global.fulfilled} dari ${complianceStats.global.total} kebutuhan mandatory terpenuhi`
              : 'Belum ada kebutuhan mandatory di TNA'}
          </p>
        </div>
        <div className="p-6 border border-border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-gray-500">Menuju Kedaluwarsa</h3>
            <ShieldAlert className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600">{expiringCerts}</div>
          <p className="text-xs text-gray-500 mt-1">Dalam 60 hari ke depan</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <div className="p-6 border border-border rounded-xl bg-card shadow-sm md:col-span-4">
          <h3 className="font-semibold mb-6 text-lg">Perbandingan Kepatuhan Lokasi Kerja</h3>
          <ComplianceChart data={chartData} />
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
