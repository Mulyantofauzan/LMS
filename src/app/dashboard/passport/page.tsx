import { auth } from "@/auth";
import { db } from "@/db";
import { certificates, enrollments, exams, trainingSessions, trainings } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";

type SessionUser = {
  id?: string | number | null;
};

export default async function MyTrainingPassportPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const user = session.user as SessionUser;
  const userId = Number(user.id);

  const passport = await db.select({
    training: trainings.title,
    sessionId: trainingSessions.id,
    status: enrollments.status,
    enrolledAt: enrollments.enrolledAt,
    expiry: certificates.expiryDate,
  })
  .from(enrollments)
  .innerJoin(trainingSessions, eq(enrollments.sessionId, trainingSessions.id))
  .innerJoin(trainings, eq(trainingSessions.trainingId, trainings.id))
  .leftJoin(certificates, and(eq(certificates.sessionId, trainingSessions.id), eq(certificates.userId, userId)))
  .where(eq(enrollments.traineeId, userId))
  .orderBy(enrollments.enrolledAt);

  const examRows = await db.select({
    sessionId: exams.sessionId,
    type: exams.type,
    score: exams.score,
  })
  .from(exams)
  .where(eq(exams.traineeId, userId));

  const scoresBySession = examRows.reduce<Record<number, { pretest?: number | null; posttest?: number | null }>>((acc, exam) => {
    acc[exam.sessionId] ??= {};
    if (exam.type === 'pretest') acc[exam.sessionId].pretest = exam.score;
    if (exam.type === 'posttest') acc[exam.sessionId].posttest = exam.score;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Paspor Saya</h1>
        <p className="text-gray-500 dark:text-gray-400">Riwayat training, nilai pre-test/post-test, dan kualifikasi pribadi.</p>
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
                <th className="px-6 py-3 font-medium">Nilai Pre-test</th>
                <th className="px-6 py-3 font-medium">Nilai Post-test</th>
              </tr>
            </thead>
            <tbody>
              {passport.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Belum ada riwayat training.</td>
                </tr>
              ) : passport.map((item, index) => (
                <tr key={`${item.training}-${item.sessionId}-${index}`} className="border-b border-border last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 font-medium">{item.training}</td>
                  <td className="px-6 py-4">
                    {item.status === 'completed' ? (
                      <span className="flex items-center gap-1 text-green-600 text-xs font-semibold"><CheckCircle2 className="h-3.5 w-3.5" /> Selesai</span>
                    ) : item.status === 'enrolled' ? (
                      <span className="flex items-center gap-1 text-blue-600 text-xs font-semibold"><Clock className="h-3.5 w-3.5" /> Berjalan</span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-600 text-xs font-semibold"><AlertTriangle className="h-3.5 w-3.5" /> Wajib</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-500">{item.enrolledAt ? item.enrolledAt.toLocaleDateString('id-ID') : '-'}</td>
                  <td className="px-6 py-4 text-gray-500">{item.expiry ? item.expiry.toLocaleDateString('id-ID') : '-'}</td>
                  <td className="px-6 py-4 font-medium">{scoresBySession[item.sessionId]?.pretest == null ? '-' : `${scoresBySession[item.sessionId].pretest}%`}</td>
                  <td className="px-6 py-4 font-medium">{scoresBySession[item.sessionId]?.posttest == null ? '-' : `${scoresBySession[item.sessionId].posttest}%`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
