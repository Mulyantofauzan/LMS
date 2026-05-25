import { auth } from "@/auth";
import { db } from "@/db";
import { attendance as attendanceTable, enrollments, trainings, trainingSessions, users } from "@/db/schema";
import { markAttendanceForm } from "@/lib/actions/attendance-actions";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Clock } from "lucide-react";
import { PrintButton } from "./print-button";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(value);
}

export default async function AttendancePage() {
  const session = await auth();
  if ((session?.user as any)?.role !== 'trainer') redirect('/dashboard');
  const trainerId = Number((session?.user as any)?.id);

  const rows = await db.select({
    sessionId: trainingSessions.id,
    trainingTitle: trainings.title,
    startTime: trainingSessions.startTime,
    sessionStatus: trainingSessions.status,
    location: trainingSessions.location,
    traineeId: users.id,
    traineeNrp: users.nrp,
    traineeName: users.name,
    status: attendanceTable.status,
  })
  .from(trainingSessions)
  .innerJoin(trainings, eq(trainingSessions.trainingId, trainings.id))
  .leftJoin(enrollments, eq(enrollments.sessionId, trainingSessions.id))
  .leftJoin(users, eq(enrollments.traineeId, users.id))
  .leftJoin(attendanceTable, and(
    eq(attendanceTable.sessionId, trainingSessions.id),
    eq(attendanceTable.traineeId, users.id)
  ))
  .where(eq(trainingSessions.trainerId, trainerId))
  .orderBy(trainingSessions.startTime);

  const now = new Date();
  const visibleRows = rows.filter((row) => {
    const date = row.startTime;
    const isToday = date.getFullYear() === now.getFullYear()
      && date.getMonth() === now.getMonth()
      && date.getDate() === now.getDate();
    return row.sessionStatus === 'active' || isToday;
  });

  const sessions = visibleRows.reduce<Record<number, {
    id: number;
    title: string;
    startTime: Date;
    status: string;
    location: string | null;
    trainees: { id: number; nrp: string | null; name: string; status: string | null }[];
  }>>((acc, row) => {
    acc[row.sessionId] ??= {
      id: row.sessionId,
      title: row.trainingTitle,
      startTime: row.startTime,
      status: row.sessionStatus,
      location: row.location,
      trainees: [],
    };
    if (row.traineeId && row.traineeName) {
      acc[row.sessionId].trainees.push({ id: row.traineeId, nrp: row.traineeNrp, name: row.traineeName, status: row.status });
    }
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Catatan Absensi</h1>
        <p className="text-gray-500 dark:text-gray-400">Training aktif dan kelas hari ini beserta daftar absensi karyawan.</p>
      </div>

      <div className="space-y-4">
        {Object.values(sessions).length === 0 ? (
          <div className="p-8 border border-dashed border-border rounded-xl bg-card text-center text-sm text-gray-500">
            Belum ada training aktif atau kelas hari ini untuk akun trainer ini.
          </div>
        ) : Object.values(sessions).map((item) => {
          const total = item.trainees.length;
          const present = item.trainees.filter((trainee) => trainee.status === 'present' || trainee.status === 'late').length;
          const absent = item.trainees.filter((trainee) => trainee.status === 'absent').length;

          return (
          <div key={item.id} className="p-6 border border-border rounded-xl bg-card shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <div>
                <h3 className="font-bold text-lg">{item.title}</h3>
                <p className="text-sm text-gray-500 flex items-center gap-1"><Clock className="h-3 w-3" /> {formatDate(item.startTime)}{item.location ? ` · ${item.location}` : ''}</p>
                <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${item.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {item.status === 'active' ? 'Training Aktif' : 'Kelas Hari Ini'}
                </span>
              </div>
              <PrintButton />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 rounded-lg bg-background border border-border text-center">
                <div className="text-2xl font-bold">{total}</div>
                <div className="text-xs text-gray-500">Total Peserta</div>
              </div>
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-center">
                <div className="text-2xl font-bold text-green-600">{present}</div>
                <div className="text-xs text-green-600">Hadir</div>
              </div>
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-center">
                <div className="text-2xl font-bold text-red-600">{absent}</div>
                <div className="text-xs text-red-600">Absen</div>
              </div>
            </div>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase border-b border-border">
                  <tr>
                    <th className="py-3 pr-4 font-medium">Peserta</th>
                    <th className="py-3 pr-4 font-medium">Status</th>
                    <th className="py-3 text-right font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {item.trainees.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-4 text-center text-gray-500">Belum ada peserta terdaftar.</td>
                    </tr>
                  ) : item.trainees.map((trainee) => (
                    <tr key={trainee.id}>
                      <td className="py-3 pr-4 font-medium">
                        <div>{trainee.name}</div>
                        <div className="text-xs text-gray-500">NRP: {trainee.nrp || '-'}</div>
                      </td>
                      <td className="py-3 pr-4">
                        <form id={`attendance-${item.id}-${trainee.id}`} action={markAttendanceForm} className="inline-flex items-center gap-2">
                          <input type="hidden" name="sessionId" value={item.id} />
                          <input type="hidden" name="traineeId" value={trainee.id} />
                          <select name="status" defaultValue={trainee.status ?? 'present'} className="h-9 px-3 rounded-md border border-border bg-background text-sm">
                            <option value="present">Hadir</option>
                            <option value="late">Terlambat</option>
                            <option value="absent">Absen</option>
                          </select>
                        </form>
                      </td>
                      <td className="py-3 text-right">
                        <button form={`attendance-${item.id}-${trainee.id}`} type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded-md shadow-sm hover:bg-primary/90 text-sm font-medium transition-colors">
                          Simpan
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )})}
      </div>
    </div>
  );
}
