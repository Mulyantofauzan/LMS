import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { approvals, trainings, users } from "@/db/schema";
import { submitApprovalStatus, submitTrainingApprovalStatus } from "@/lib/actions/approval-actions";
import { and, eq } from "drizzle-orm";
import { BookOpen, CalendarDays, ClipboardCheck, DollarSign } from "lucide-react";

function formatDate(value: Date | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(value);
}

export default async function ApprovalsPage() {
  const session = await auth();
  if ((session?.user as any)?.role !== 'manager') redirect('/dashboard');
  const managerId = Number((session?.user as any)?.id);

  const requests = await db.select({
    id: approvals.id,
    trainee: users.name,
    training: trainings.title,
    requestedAt: approvals.requestedAt,
    category: trainings.category,
  })
  .from(approvals)
  .innerJoin(users, eq(approvals.traineeId, users.id))
  .innerJoin(trainings, eq(approvals.trainingId, trainings.id))
  .where(and(eq(approvals.managerId, managerId), eq(approvals.status, 'pending')))
  .orderBy(approvals.requestedAt);

  const manager = await db.select({ jobsiteId: users.jobsiteId }).from(users).where(eq(users.id, managerId)).get();
  const trainingRequests = await db.select({
    id: trainings.id,
    title: trainings.title,
    description: trainings.description,
    category: trainings.category,
    createdAt: trainings.createdAt,
    trainerName: users.name,
  })
  .from(trainings)
  .innerJoin(users, eq(trainings.proposedBy, users.id))
  .where(and(
    eq(trainings.approvalStatus, 'pending_manager'),
    manager?.jobsiteId ? eq(users.jobsiteId, manager.jobsiteId) : undefined,
  ))
  .orderBy(trainings.createdAt);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Persetujuan Tertunda</h1>
        <p className="text-gray-500 dark:text-gray-400">Tinjau permintaan training anggota tim dan pengajuan materi dari trainer.</p>
      </div>
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Pengajuan Training Trainer</h2>
        {trainingRequests.length === 0 ? (
          <div className="p-6 border border-dashed border-border rounded-xl bg-card text-center">
            <BookOpen className="h-9 w-9 mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-500">Tidak ada pengajuan training trainer yang menunggu approval manager.</p>
          </div>
        ) : trainingRequests.map((req) => (
          <div key={req.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 border border-border rounded-xl bg-card shadow-sm hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-sm">{req.trainerName}</p>
                <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">pending manager</span>
              </div>
              <p className="font-bold text-primary">{req.title}</p>
              <p className="mt-1 text-sm text-gray-500 line-clamp-2">{req.description}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {formatDate(req.createdAt)}</span>
                <span>{req.category || 'Umum'}</span>
              </div>
            </div>
            <div className="flex gap-2 mt-4 sm:mt-0 w-full sm:w-auto">
              <form action={submitTrainingApprovalStatus} className="flex-1 sm:flex-none">
                <input type="hidden" name="trainingId" value={req.id} />
                <input type="hidden" name="status" value="rejected" />
                <button type="submit" className="w-full bg-white dark:bg-transparent border border-border text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 px-6 py-2 rounded-md shadow-sm text-sm font-medium transition-colors">Tolak</button>
              </form>
              <form action={submitTrainingApprovalStatus} className="flex-1 sm:flex-none">
                <input type="hidden" name="trainingId" value={req.id} />
                <input type="hidden" name="status" value="approved" />
                <button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2 rounded-md shadow-sm text-sm font-medium transition-colors">Approve</button>
              </form>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-border" />
      <h2 className="text-xl font-semibold">Permintaan Training Peserta</h2>
      <div className="space-y-4">
        {requests.length === 0 ? (
          <div className="p-8 border border-dashed border-border rounded-xl bg-card text-center">
            <ClipboardCheck className="h-10 w-10 mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-500">Tidak ada permintaan pelatihan yang menunggu persetujuan.</p>
          </div>
        ) : requests.map((req) => (
          <div key={req.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 border border-border rounded-xl bg-card shadow-sm hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-sm">{req.trainee}</p>
                <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">menunggu</span>
              </div>
              <p className="font-bold text-primary">{req.training}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {formatDate(req.requestedAt)}</span>
                <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> Internal</span>
                <span>{req.category || 'Umum'}</span>
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
  );
}
