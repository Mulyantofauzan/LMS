import { auth } from "@/auth";
import { db } from "@/db";
import { attendance, enrollments, exams, trainingSessions, trainings } from "@/db/schema";
import { and, desc, eq, inArray } from "drizzle-orm";
import { Award, CheckCircle2, Clock, Eye, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

const TIME_ZONE = "Asia/Makassar";

function formatDate(value: Date | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: TIME_ZONE }).format(value);
}

function formatDuration(start: Date, end: Date) {
  const minutes = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} menit`;
  if (rest === 0) return `${hours} jam`;
  return `${hours} jam ${rest} menit`;
}

function scoreText(value: number | null | undefined) {
  return value == null ? "-" : `${value}%`;
}

export default async function TrainerHistoryPage() {
  const session = await auth();
  if ((session?.user as any)?.role !== 'trainer') redirect('/dashboard');
  const trainerId = Number((session?.user as any)?.id);

  const sessions = await db.select({
    id: trainingSessions.id,
    title: trainings.title,
    category: trainings.category,
    startTime: trainingSessions.startTime,
    endTime: trainingSessions.endTime,
    startedAt: trainingSessions.startedAt,
    endedAt: trainingSessions.endedAt,
    location: trainingSessions.location,
  })
  .from(trainingSessions)
  .innerJoin(trainings, eq(trainingSessions.trainingId, trainings.id))
  .where(and(eq(trainingSessions.trainerId, trainerId), eq(trainingSessions.status, 'ended')))
  .orderBy(desc(trainingSessions.endedAt), desc(trainingSessions.endTime));

  const sessionIds = sessions.map((item) => item.id);
  const participantCounts = sessionIds.length
    ? await db.select({ sessionId: enrollments.sessionId, traineeId: enrollments.traineeId })
      .from(enrollments)
      .where(inArray(enrollments.sessionId, sessionIds))
    : [];
  const attendanceRows = sessionIds.length
    ? await db.select({ sessionId: attendance.sessionId, traineeId: attendance.traineeId, status: attendance.status })
      .from(attendance)
      .where(inArray(attendance.sessionId, sessionIds))
    : [];
  const examRows = sessionIds.length
    ? await db.select({ sessionId: exams.sessionId, type: exams.type, score: exams.score })
      .from(exams)
      .where(inArray(exams.sessionId, sessionIds))
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Riwayat Training</h1>
        <p className="text-gray-500 dark:text-gray-400">Daftar sesi yang sudah diakhiri. Buka detail untuk absensi dan nilai peserta.</p>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {sessions.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">Belum ada training yang sudah diakhiri.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-900/50 border-b border-border">
                <tr>
                  <th className="px-5 py-3 font-semibold">Training</th>
                  <th className="px-5 py-3 font-semibold">Waktu</th>
                  <th className="px-5 py-3 font-semibold">Peserta</th>
                  <th className="px-5 py-3 font-semibold">Hadir</th>
                  <th className="px-5 py-3 font-semibold">Durasi</th>
                  <th className="px-5 py-3 font-semibold">Rata-rata</th>
                  <th className="px-5 py-3 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sessions.map((item) => {
                  const started = item.startedAt ?? item.startTime;
                  const ended = item.endedAt ?? item.endTime;
                  const participants = participantCounts.filter((row) => row.sessionId === item.id);
                  const present = attendanceRows.filter((row) => row.sessionId === item.id && (row.status === 'present' || row.status === 'late')).length;
                  const preScores = examRows.filter((row) => row.sessionId === item.id && row.type === 'pretest' && row.score != null).map((row) => row.score as number);
                  const postScores = examRows.filter((row) => row.sessionId === item.id && row.type === 'posttest' && row.score != null).map((row) => row.score as number);
                  const avgPre = preScores.length ? Math.round(preScores.reduce((sum, value) => sum + value, 0) / preScores.length) : null;
                  const avgPost = postScores.length ? Math.round(postScores.reduce((sum, value) => sum + value, 0) / postScores.length) : null;

                  return (
                    <tr key={item.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40">
                      <td className="px-5 py-4">
                        <div className="font-semibold">{item.title}</div>
                        <div className="text-xs text-gray-500">{item.category || 'General'}{item.location ? ` · ${item.location}` : ''}</div>
                      </td>
                      <td className="px-5 py-4 text-gray-500">
                        <div>{formatDate(started)}</div>
                        <div className="text-xs">s.d. {formatDate(ended)}</div>
                      </td>
                      <td className="px-5 py-4"><span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4 text-gray-400" />{participants.length}</span></td>
                      <td className="px-5 py-4"><span className="inline-flex items-center gap-1.5 text-green-700"><CheckCircle2 className="h-4 w-4" />{present}</span></td>
                      <td className="px-5 py-4"><span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4 text-gray-400" />{formatDuration(started, ended)}</span></td>
                      <td className="px-5 py-4"><span className="inline-flex items-center gap-1.5"><Award className="h-4 w-4 text-gray-400" />{scoreText(avgPre)} / {scoreText(avgPost)}</span></td>
                      <td className="px-5 py-4 text-right">
                        <Link href={`/dashboard/trainer/history/${item.id}`} className="inline-flex items-center gap-1.5 text-primary font-medium hover:underline">
                          <Eye className="h-4 w-4" />
                          Detail
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
