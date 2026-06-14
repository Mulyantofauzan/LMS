import { auth } from "@/auth";
import { db } from "@/db";
import { approvals, trainings, users } from "@/db/schema";
import { submitApprovalStatus } from "@/lib/actions/approval-actions";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Users, ShieldAlert, ClipboardCheck, CalendarDays, DollarSign } from "lucide-react";

type SessionUser = {
  id?: string | number | null;
  role?: string | null;
};

function formatDate(value: Date | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(value);
}

export default async function ManagerDashboard() {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  const role = user?.role;
  
  if (role !== 'manager') { 
    redirect('/dashboard');
  }
  const managerId = Number(user?.id);
  const pendingRequests = await db.select({
    id: approvals.id,
    trainee: users.name,
    training: trainings.title,
    requestedAt: approvals.requestedAt,
  })
  .from(approvals)
  .innerJoin(users, eq(approvals.traineeId, users.id))
  .innerJoin(trainings, eq(approvals.trainingId, trainings.id))
  .where(and(eq(approvals.managerId, managerId), eq(approvals.status, 'pending')))
  .orderBy(approvals.requestedAt);
  const pendingTrainingRequests = await db.select({ id: trainings.id })
    .from(trainings)
    .innerJoin(users, eq(trainings.proposedBy, users.id))
    .where(eq(trainings.approvalStatus, 'pending_manager'));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard Tim</h1>
          <p className="text-gray-500 dark:text-gray-400">Tinjau permintaan training dan kepatuhan anggota tim.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="p-6 border border-border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-gray-500">Anggota Tim</h3>
            <Users className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold">14</div>
        </div>
        <div className="p-6 border border-border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-gray-500">Menunggu Persetujuan</h3>
            <ClipboardCheck className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600">{pendingRequests.length + pendingTrainingRequests.length}</div>
          <p className="text-xs text-gray-500 mt-1">Perlu diproses</p>
        </div>
        <div className="p-6 border border-border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-gray-500">Kepatuhan Tim</h3>
            <ShieldAlert className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold">100%</div>
          <p className="text-xs text-green-500 mt-1">Berdasarkan data sertifikat</p>
        </div>
      </div>

      <div className="p-6 border border-border rounded-xl bg-card shadow-sm">
        <h3 className="font-semibold mb-6 text-lg">Permintaan Training Perlu Diproses</h3>
        <div className="space-y-4">
          {pendingRequests.length === 0 ? (
            <div className="p-8 border border-dashed border-border rounded-lg bg-background text-center text-sm text-gray-500">
              Tidak ada permintaan yang perlu diproses.
            </div>
          ) : pendingRequests.map((req) => (
            <div key={req.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 border border-border rounded-lg bg-background hover:border-gray-300 transition-colors">
              <div>
                <p className="font-semibold text-sm">{req.trainee} <span className="text-gray-400 font-normal">mengajukan training</span></p>
                <p className="font-bold text-primary mt-1">{req.training}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {formatDate(req.requestedAt)}</span>
                  <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> Internal</span>
                </div>
              </div>
              <div className="flex gap-2 mt-4 sm:mt-0 w-full sm:w-auto">
                <form action={submitApprovalStatus} className="flex-1 sm:flex-none">
                  <input type="hidden" name="approvalId" value={req.id} />
                  <input type="hidden" name="status" value="rejected" />
                  <button type="submit" className="w-full bg-white dark:bg-transparent border border-border text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 px-6 py-2 rounded-md shadow-sm text-sm font-medium transition-colors">Tolak</button>
                </form>
                <form action={submitApprovalStatus} className="flex-1 sm:flex-none">
                  <input type="hidden" name="approvalId" value={req.id} />
                  <input type="hidden" name="status" value="approved" />
                  <button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2 rounded-md shadow-sm text-sm font-medium transition-colors">Setujui</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
