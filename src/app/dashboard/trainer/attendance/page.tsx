import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Users, CheckCircle2, XCircle, Clock } from "lucide-react";

export default async function AttendancePage() {
  const session = await auth();
  if ((session?.user as any)?.role !== 'trainer') redirect('/dashboard');

  const attendanceData = [
    { session: "Basic Safety Induction — Batch 12", date: "May 5, 2026", total: 25, present: 23, absent: 2 },
    { session: "Hazmat Handling Refresher", date: "May 3, 2026", total: 15, present: 14, absent: 1 },
    { session: "Working at Heights — Level 2", date: "Apr 28, 2026", total: 20, present: 18, absent: 2 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Attendance Records</h1>
        <p className="text-gray-500 dark:text-gray-400">Track and manage attendance for your training sessions.</p>
      </div>

      <div className="space-y-4">
        {attendanceData.map((a, i) => (
          <div key={i} className="p-6 border border-border rounded-xl bg-card shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <div>
                <h3 className="font-bold text-lg">{a.session}</h3>
                <p className="text-sm text-gray-500 flex items-center gap-1"><Clock className="h-3 w-3" /> {a.date}</p>
              </div>
              <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md shadow-sm hover:bg-primary/90 text-sm font-medium transition-colors">Take Attendance</button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 rounded-lg bg-background border border-border text-center">
                <div className="text-2xl font-bold">{a.total}</div>
                <div className="text-xs text-gray-500">Total Enrolled</div>
              </div>
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-center">
                <div className="text-2xl font-bold text-green-600">{a.present}</div>
                <div className="text-xs text-green-600">Present</div>
              </div>
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-center">
                <div className="text-2xl font-bold text-red-600">{a.absent}</div>
                <div className="text-xs text-red-600">Absent</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
