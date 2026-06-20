import { auth } from "@/auth";
import { db } from "@/db";
import { certificates, trainings, users } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getExternalCertificatesForUsers } from "@/lib/tna";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { getSessionUser } from "@/lib/session-user";

async function getCurrentTimestamp() {
  return Date.now();
}

export default async function SiteCertificatesPage() {
  const session = await auth();
  const sessionUser = getSessionUser(session?.user);
  const role = sessionUser?.role;
  if (role !== 'site-admin' && role !== 'admin') redirect('/dashboard');

  const currentUser = await db.select({ jobsiteId: users.jobsiteId })
    .from(users)
    .where(eq(users.id, Number(sessionUser?.id)))
    .get();
  const siteUsers = await db.select({ id: users.id, name: users.name })
    .from(users)
    .where(currentUser?.jobsiteId
      ? and(eq(users.jobsiteId, currentUser.jobsiteId), eq(users.isActive, true))
      : eq(users.isActive, true))
    .orderBy(users.name);
  const certs = await db.select({
    name: users.name,
    training: trainings.title,
    certNo: certificates.certNumber,
    issued: certificates.issueDate,
    expiry: certificates.expiryDate,
  })
    .from(certificates)
    .innerJoin(users, eq(certificates.userId, users.id))
    .innerJoin(trainings, eq(certificates.trainingId, trainings.id))
    .where(currentUser?.jobsiteId
      ? and(eq(users.jobsiteId, currentUser.jobsiteId), eq(users.isActive, true))
      : eq(users.isActive, true))
    .orderBy(certificates.expiryDate);
  const externalCerts = await getExternalCertificatesForUsers(siteUsers.map((user) => user.id));
  const allCerts = [
    ...certs.map((cert) => ({
      source: 'internal' as const,
      name: cert.name,
      title: cert.training,
      certNo: cert.certNo,
      issued: cert.issued,
      expiry: cert.expiry,
    })),
    ...externalCerts.map((cert) => ({
      source: 'external' as const,
      name: cert.userName,
      title: cert.typeName,
      certNo: cert.certNumber,
      issued: cert.issueDate,
      expiry: cert.expiryDate,
    })),
  ].sort((a, b) => (a.expiry?.getTime() ?? Number.POSITIVE_INFINITY) - (b.expiry?.getTime() ?? Number.POSITIVE_INFINITY));
  const now = await getCurrentTimestamp();
  const sixtyDaysFromNow = now + 60 * 24 * 60 * 60 * 1000;
  const certificateSummary = allCerts.reduce((summary, certificate) => {
    const expiry = certificate.expiry?.getTime();
    if (expiry != null && expiry <= now) summary.expired += 1;
    else if (expiry != null && expiry <= sixtyDaysFromNow) summary.expiring += 1;
    else summary.active += 1;
    return summary;
  }, { active: 0, expiring: 0, expired: 0 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Monitoring Sertifikat</h1>
        <p className="text-gray-500 dark:text-gray-400">Pantau sertifikat aktif, mendekati kedaluwarsa, dan sudah kedaluwarsa.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-green-200 bg-green-50 p-5 dark:border-green-900/50 dark:bg-green-950/20">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-green-700 dark:text-green-300">Sertifikat Aktif</p>
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          </div>
          <p className="mt-3 text-3xl font-bold text-green-800 dark:text-green-200">{certificateSummary.active}</p>
          <p className="mt-1 text-xs text-green-700/70 dark:text-green-300/70">Masa berlaku lebih dari 60 hari atau tanpa kedaluwarsa</p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/50 dark:bg-amber-950/20">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-amber-700 dark:text-amber-300">Menuju Expired</p>
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <p className="mt-3 text-3xl font-bold text-amber-800 dark:text-amber-200">{certificateSummary.expiring}</p>
          <p className="mt-1 text-xs text-amber-700/70 dark:text-amber-300/70">Akan kedaluwarsa dalam 60 hari</p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-5 dark:border-red-900/50 dark:bg-red-950/20">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-red-700 dark:text-red-300">Expired</p>
            <XCircle className="h-5 w-5 text-red-600" />
          </div>
          <p className="mt-3 text-3xl font-bold text-red-800 dark:text-red-200">{certificateSummary.expired}</p>
          <p className="mt-1 text-xs text-red-700/70 dark:text-red-300/70">Perlu diperpanjang atau diperbarui</p>
        </div>
      </div>
      <div className="p-6 border border-border rounded-xl bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 uppercase border-b border-border">
              <tr>
                <th className="px-6 py-3 font-medium">Karyawan</th>
                <th className="px-6 py-3 font-medium">Pelatihan</th>
                <th className="px-6 py-3 font-medium">No. Sertifikat</th>
                <th className="px-6 py-3 font-medium">Terbit</th>
                <th className="px-6 py-3 font-medium">Kedaluwarsa</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {allCerts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Belum ada sertifikat di site ini.</td>
                </tr>
              ) : allCerts.map((c) => {
                const expiryTime = c.expiry?.getTime() ?? Number.POSITIVE_INFINITY;
                const status = expiryTime <= now ? 'expired' : expiryTime <= sixtyDaysFromNow ? 'expiring' : 'valid';
                return (
                <tr key={`${c.source}-${c.certNo}`} className="border-b border-border last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 font-medium">{c.name}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium">{c.title}</div>
                    <div className="text-xs text-gray-500">{c.source === 'internal' ? 'Internal' : 'Eksternal'}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-500 font-mono text-xs">{c.certNo}</td>
                  <td className="px-6 py-4 text-gray-500">{c.issued ? c.issued.toLocaleDateString('id-ID') : '-'}</td>
                  <td className="px-6 py-4 text-gray-500">{c.expiry ? c.expiry.toLocaleDateString('id-ID') : '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full ${
                      status === 'valid' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      status === 'expiring' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>{status === 'valid' ? 'valid' : status === 'expiring' ? 'segera habis' : 'expired'}</span>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
