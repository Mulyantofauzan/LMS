import { auth } from "@/auth";
import { db } from "@/db";
import { certificates, trainings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Award, Download } from "lucide-react";

export default async function TraineeCertificatesPage() {
  const session = await auth();
  if ((session?.user as any)?.role !== 'trainee') redirect('/dashboard');

  const certs = await db.select({
    training: trainings.title,
    certNo: certificates.certNumber,
    issued: certificates.issueDate,
    expiry: certificates.expiryDate,
  })
  .from(certificates)
  .innerJoin(trainings, eq(certificates.trainingId, trainings.id))
  .where(eq(certificates.userId, Number((session?.user as any)?.id)))
  .orderBy(certificates.issueDate);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Sertifikat Saya</h1>
        <p className="text-gray-500 dark:text-gray-400">Unduh dan verifikasi sertifikat training Anda.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {certs.length === 0 ? (
          <div className="md:col-span-2 lg:col-span-3 p-8 border border-dashed border-border rounded-xl bg-card text-center text-sm text-gray-500">
            Belum ada sertifikat.
          </div>
        ) : certs.map((c) => (
          <div key={c.certNo} className="p-6 border border-border rounded-xl bg-card shadow-sm card-hover">
            <div className="flex items-start justify-between mb-3">
              <Award className="h-8 w-8 text-amber-500" />
              <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">valid</span>
            </div>
            <h3 className="font-bold text-lg mb-1">{c.training}</h3>
            <p className="text-xs text-gray-500 font-mono mb-1">ID: {c.certNo}</p>
            <p className="text-xs text-gray-500 mb-1">Terbit: {c.issued ? c.issued.toLocaleDateString('id-ID') : '-'}</p>
            <p className="text-xs text-gray-500 mb-4">Kedaluwarsa: {c.expiry ? c.expiry.toLocaleDateString('id-ID') : '-'}</p>
            <a 
              href={`/api/certificate/${c.certNo}`}
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 text-sm font-medium transition-colors"
            >
              <Download className="h-4 w-4" /> Unduh PDF
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
