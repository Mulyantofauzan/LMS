import { auth } from "@/auth";
import { db } from "@/db";
import { certificates, trainings, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getExternalCertificatesForUsers } from "@/lib/tna";

export default async function SiteCertificatesPage() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== 'site-admin' && role !== 'admin') redirect('/dashboard');

  const currentUser = await db.select({ jobsiteId: users.jobsiteId })
    .from(users)
    .where(eq(users.id, Number((session?.user as any)?.id)))
    .get();
  const siteUsers = currentUser?.jobsiteId
    ? await db.select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.jobsiteId, currentUser.jobsiteId))
      .orderBy(users.name)
    : [];
  const certs = currentUser?.jobsiteId
    ? await db.select({
        name: users.name,
        training: trainings.title,
        certNo: certificates.certNumber,
        issued: certificates.issueDate,
        expiry: certificates.expiryDate,
      })
      .from(certificates)
      .innerJoin(users, eq(certificates.userId, users.id))
      .innerJoin(trainings, eq(certificates.trainingId, trainings.id))
      .where(eq(users.jobsiteId, currentUser.jobsiteId))
      .orderBy(certificates.expiryDate)
    : [];
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
  const now = Date.now();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Sertifikat Site</h1>
        <p className="text-gray-500 dark:text-gray-400">Pantau sertifikat yang sudah terbit dan status kedaluwarsa.</p>
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
                const status = expiryTime < now ? 'expired' : expiryTime <= now + 1000 * 60 * 60 * 24 * 30 ? 'expiring' : 'valid';
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
