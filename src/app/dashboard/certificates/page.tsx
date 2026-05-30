import { auth } from "@/auth";
import { db } from "@/db";
import { certificates, trainings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Award, Download } from "lucide-react";

function certificateStatus(expiry: Date | null) {
  if (!expiry) return { label: 'tanpa kedaluwarsa', className: 'bg-blue-100 text-blue-700' };
  const now = new Date();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  if (expiry.getTime() < now.getTime()) return { label: 'kedaluwarsa', className: 'bg-red-100 text-red-700' };
  if (expiry.getTime() - now.getTime() <= thirtyDays) return { label: 'akan kedaluwarsa', className: 'bg-amber-100 text-amber-700' };
  return { label: 'aktif', className: 'bg-green-100 text-green-700' };
}

export default async function MyCertificatesPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const certs = await db.select({
    training: trainings.title,
    certNo: certificates.certNumber,
    issued: certificates.issueDate,
    expiry: certificates.expiryDate,
  })
  .from(certificates)
  .innerJoin(trainings, eq(certificates.trainingId, trainings.id))
  .where(eq(certificates.userId, Number((session.user as any)?.id)))
  .orderBy(certificates.issueDate);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Sertifikat Saya</h1>
        <p className="text-gray-500 dark:text-gray-400">Unduh dan cek masa berlaku sertifikat training Anda.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {certs.length === 0 ? (
          <div className="md:col-span-2 lg:col-span-3 p-8 border border-dashed border-border rounded-xl bg-card text-center text-sm text-gray-500">
            Belum ada sertifikat.
          </div>
        ) : certs.map((cert) => {
          const status = certificateStatus(cert.expiry);
          return (
            <div key={cert.certNo} className="p-6 border border-border rounded-xl bg-card shadow-sm card-hover">
              <div className="flex items-start justify-between mb-3">
                <Award className="h-8 w-8 text-amber-500" />
                <span className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full ${status.className}`}>{status.label}</span>
              </div>
              <h3 className="font-bold text-lg mb-1">{cert.training}</h3>
              <p className="text-xs text-gray-500 font-mono mb-1">ID: {cert.certNo}</p>
              <p className="text-xs text-gray-500 mb-1">Terbit: {cert.issued ? cert.issued.toLocaleDateString('id-ID') : '-'}</p>
              <p className="text-xs text-gray-500 mb-4">Kedaluwarsa: {cert.expiry ? cert.expiry.toLocaleDateString('id-ID') : 'Tidak ada'}</p>
              <a
                href={`/api/certificate/${encodeURIComponent(cert.certNo)}`}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 text-sm font-medium transition-colors"
              >
                <Download className="h-4 w-4" /> Unduh PDF
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
