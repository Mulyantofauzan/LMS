import { auth } from "@/auth";
import { db } from "@/db";
import { certificates, enrollments, exams, trainingSessions, trainings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { CheckCircle2, Clock, AlertTriangle } from "lucide-react";

export default async function TrainingPassportPage() {
  const session = await auth();
  if ((session?.user as any)?.role !== 'trainee') redirect('/dashboard');
  const traineeId = Number((session?.user as any)?.id);

  const passport = await db.select({
    training: trainings.title,
    status: enrollments.status,
    enrolledAt: enrollments.enrolledAt,
    expiry: certificates.expiryDate,
    score: exams.score,
  })
  .from(enrollments)
  .innerJoin(trainingSessions, eq(enrollments.sessionId, trainingSessions.id))
  .innerJoin(trainings, eq(trainingSessions.trainingId, trainings.id))
  .leftJoin(certificates, eq(certificates.trainingId, trainings.id))
  .leftJoin(exams, eq(exams.sessionId, trainingSessions.id))
  .where(eq(enrollments.traineeId, traineeId))
  .orderBy(enrollments.enrolledAt);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Paspor Training</h1>
        <p className="text-gray-500 dark:text-gray-400">Riwayat training dan kualifikasi Anda.</p>
      </div>

      <div className="p-6 border border-border rounded-xl bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 uppercase border-b border-border">
              <tr>
                <th className="px-6 py-3 font-medium">Pelatihan</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Tanggal</th>
                <th className="px-6 py-3 font-medium">Kedaluwarsa</th>
                <th className="px-6 py-3 font-medium">Nilai</th>
              </tr>
            </thead>
            <tbody>
              {passport.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Belum ada riwayat training.</td>
                </tr>
              ) : passport.map((p, i) => (
                <tr key={`${p.training}-${i}`} className="border-b border-border last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 font-medium">{p.training}</td>
                  <td className="px-6 py-4">
                    {p.status === 'completed' ? (
                      <span className="flex items-center gap-1 text-green-600 text-xs font-semibold"><CheckCircle2 className="h-3.5 w-3.5" /> Selesai</span>
                    ) : p.status === 'enrolled' ? (
                      <span className="flex items-center gap-1 text-blue-600 text-xs font-semibold"><Clock className="h-3.5 w-3.5" /> Berjalan</span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-600 text-xs font-semibold"><AlertTriangle className="h-3.5 w-3.5" /> Wajib</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-500">{p.enrolledAt ? p.enrolledAt.toLocaleDateString('id-ID') : '-'}</td>
                  <td className="px-6 py-4 text-gray-500">{p.expiry ? p.expiry.toLocaleDateString('id-ID') : '-'}</td>
                  <td className="px-6 py-4 font-medium">{p.score == null ? '-' : `${p.score}%`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
