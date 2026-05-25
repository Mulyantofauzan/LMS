import { auth } from "@/auth";
import { db } from "@/db";
import { attendance, enrollments, exams, trainingSessions, trainings, users } from "@/db/schema";
import { and, desc, eq, inArray } from "drizzle-orm";
import { Award, CheckCircle2, Clock, FileText, Users } from "lucide-react";
import { redirect } from "next/navigation";

function formatDate(value: Date | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(value);
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
  const participantRows = sessionIds.length
    ? await db.select({
      sessionId: enrollments.sessionId,
      traineeId: users.id,
      nrp: users.nrp,
      name: users.name,
      department: users.department,
      position: users.position,
      enrollmentStatus: enrollments.status,
    })
    .from(enrollments)
    .innerJoin(users, eq(enrollments.traineeId, users.id))
    .where(inArray(enrollments.sessionId, sessionIds))
    .orderBy(users.name)
    : [];

  const attendanceRows = sessionIds.length
    ? await db.select({
      sessionId: attendance.sessionId,
      traineeId: attendance.traineeId,
      checkIn: attendance.checkIn,
      status: attendance.status,
      method: attendance.method,
    })
    .from(attendance)
    .where(inArray(attendance.sessionId, sessionIds))
    : [];

  const examRows = sessionIds.length
    ? await db.select({
      sessionId: exams.sessionId,
      traineeId: exams.traineeId,
      type: exams.type,
      score: exams.score,
      passed: exams.passed,
    })
    .from(exams)
    .where(inArray(exams.sessionId, sessionIds))
    : [];

  const attendanceByKey = new Map(attendanceRows.map((row) => [`${row.sessionId}:${row.traineeId}`, row]));
  const scoresByKey = examRows.reduce<Record<string, { pretest?: number | null; posttest?: number | null }>>((acc, row) => {
    const key = `${row.sessionId}:${row.traineeId}`;
    acc[key] ??= {};
    if (row.type === 'pretest') acc[key].pretest = row.score;
    if (row.type === 'posttest') acc[key].posttest = row.score;
    return acc;
  }, {});

  const participantsBySession = participantRows.reduce<Record<number, typeof participantRows>>((acc, row) => {
    acc[row.sessionId] ??= [];
    acc[row.sessionId].push(row);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Riwayat Training</h1>
        <p className="text-gray-500 dark:text-gray-400">Arsip sesi yang sudah diakhiri beserta absensi, nilai, dan durasi training.</p>
      </div>

      {sessions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-gray-500">
          Belum ada training yang sudah diakhiri.
        </div>
      ) : (
        <div className="space-y-5">
          {sessions.map((item) => {
            const started = item.startedAt ?? item.startTime;
            const ended = item.endedAt ?? item.endTime;
            const participants = participantsBySession[item.id] ?? [];
            const present = participants.filter((participant) => {
              const record = attendanceByKey.get(`${item.id}:${participant.traineeId}`);
              return record?.status === 'present' || record?.status === 'late';
            }).length;
            const preScores = participants.map((participant) => scoresByKey[`${item.id}:${participant.traineeId}`]?.pretest).filter((value): value is number => value != null);
            const postScores = participants.map((participant) => scoresByKey[`${item.id}:${participant.traineeId}`]?.posttest).filter((value): value is number => value != null);
            const avgPre = preScores.length ? Math.round(preScores.reduce((sum, value) => sum + value, 0) / preScores.length) : null;
            const avgPost = postScores.length ? Math.round(postScores.reduce((sum, value) => sum + value, 0) / postScores.length) : null;

            return (
              <section key={item.id} className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="p-5 border-b border-border">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold">{item.title}</h2>
                      <p className="mt-1 text-sm text-gray-500">
                        {item.category || 'General'}{item.location ? ` · ${item.location}` : ''}
                      </p>
                      <p className="mt-2 text-sm text-gray-500">
                        Mulai aktual: {formatDate(started)} · Selesai: {formatDate(ended)}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                      <div className="rounded-lg border border-border bg-background p-3">
                        <Users className="mx-auto h-4 w-4 text-gray-400" />
                        <div className="mt-1 text-lg font-bold">{participants.length}</div>
                        <div className="text-xs text-gray-500">Peserta</div>
                      </div>
                      <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                        <CheckCircle2 className="mx-auto h-4 w-4 text-green-600" />
                        <div className="mt-1 text-lg font-bold text-green-700">{present}</div>
                        <div className="text-xs text-green-700">Hadir</div>
                      </div>
                      <div className="rounded-lg border border-border bg-background p-3">
                        <Clock className="mx-auto h-4 w-4 text-gray-400" />
                        <div className="mt-1 text-lg font-bold">{formatDuration(started, ended)}</div>
                        <div className="text-xs text-gray-500">Durasi</div>
                      </div>
                      <div className="rounded-lg border border-border bg-background p-3">
                        <Award className="mx-auto h-4 w-4 text-gray-400" />
                        <div className="mt-1 text-lg font-bold">{scoreText(avgPre)} / {scoreText(avgPost)}</div>
                        <div className="text-xs text-gray-500">Rata-rata Pre/Post</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-900/50 border-b border-border">
                      <tr>
                        <th className="px-5 py-3 font-semibold">Karyawan</th>
                        <th className="px-5 py-3 font-semibold">Absensi</th>
                        <th className="px-5 py-3 font-semibold">Check-in</th>
                        <th className="px-5 py-3 font-semibold">Pre-test</th>
                        <th className="px-5 py-3 font-semibold">Post-test</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {participants.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-5 py-6 text-center text-gray-500">Belum ada peserta pada sesi ini.</td>
                        </tr>
                      ) : participants.map((participant) => {
                        const attendanceRecord = attendanceByKey.get(`${item.id}:${participant.traineeId}`);
                        const scores = scoresByKey[`${item.id}:${participant.traineeId}`] ?? {};
                        return (
                          <tr key={participant.traineeId}>
                            <td className="px-5 py-4">
                              <div className="font-semibold">{participant.name}</div>
                              <div className="text-xs text-gray-500">NRP: {participant.nrp || '-'} · {participant.department || '-'} · {participant.position || '-'}</div>
                            </td>
                            <td className="px-5 py-4">
                              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${attendanceRecord?.status === 'present' || attendanceRecord?.status === 'late' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                {attendanceRecord?.status || 'belum hadir'}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-gray-500">{formatDate(attendanceRecord?.checkIn ?? null)}</td>
                            <td className="px-5 py-4 font-medium">{scoreText(scores.pretest)}</td>
                            <td className="px-5 py-4 font-medium">{scoreText(scores.posttest)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="border-t border-border bg-gray-50/50 px-5 py-3 text-xs text-gray-500 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Data ini tetap tersimpan setelah kelas diakhiri dan dapat digunakan sebagai laporan training.
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
