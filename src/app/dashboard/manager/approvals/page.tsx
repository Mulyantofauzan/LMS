import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { approvals, jobsites, questionSets, trainingMaterials, trainingQuestionSets, trainings, users } from "@/db/schema";
import { submitApprovalStatus, submitTrainingApprovalStatus } from "@/lib/actions/approval-actions";
import { and, eq, inArray } from "drizzle-orm";
import { BookOpen, CalendarDays, ClipboardCheck, DollarSign, FileText, MapPin } from "lucide-react";

type SessionUser = {
  id?: string | number | null;
  role?: string | null;
};

function formatDate(value: Date | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(value);
}

export default async function ApprovalsPage({
  searchParams,
}: {
  searchParams?: Promise<{ site?: string }>;
}) {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  if (user?.role !== 'manager') redirect('/dashboard');
  const managerId = Number(user.id);
  const params = await searchParams;
  const selectedSiteId = Number(params?.site) || null;
  const siteOptions = await db.select({ id: jobsites.id, name: jobsites.name }).from(jobsites).orderBy(jobsites.name);

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

  const trainingRequests = await db.select({
    id: trainings.id,
    title: trainings.title,
    description: trainings.description,
    category: trainings.category,
    createdAt: trainings.createdAt,
    trainerName: users.name,
    siteName: jobsites.name,
    certificateEnabled: trainings.certificateEnabled,
    certificateValidityMonths: trainings.certificateValidityMonths,
    certificatePassingScore: trainings.certificatePassingScore,
    certificateTemplateUrl: trainings.certificateTemplateUrl,
  })
  .from(trainings)
  .innerJoin(users, eq(trainings.proposedBy, users.id))
  .leftJoin(jobsites, eq(trainings.jobsiteId, jobsites.id))
  .where(and(
    eq(trainings.approvalStatus, 'pending_manager'),
    selectedSiteId ? eq(trainings.jobsiteId, selectedSiteId) : undefined,
  ))
  .orderBy(trainings.createdAt);
  const pendingTrainingIds = trainingRequests.map((request) => request.id);
  const materialRows = pendingTrainingIds.length > 0
    ? await db.select({
      trainingId: trainingMaterials.trainingId,
      id: trainingMaterials.id,
      title: trainingMaterials.title,
      type: trainingMaterials.type,
      fileUrl: trainingMaterials.fileUrl,
    }).from(trainingMaterials).where(and(
      inArray(trainingMaterials.trainingId, pendingTrainingIds),
      eq(trainingMaterials.approvalStatus, 'pending_manager'),
    ))
    : [];
  const setRows = pendingTrainingIds.length > 0
    ? await db.select({
      trainingId: trainingQuestionSets.trainingId,
      id: questionSets.id,
      title: questionSets.title,
      description: questionSets.description,
    })
      .from(trainingQuestionSets)
      .innerJoin(questionSets, eq(trainingQuestionSets.questionSetId, questionSets.id))
      .where(and(
        inArray(trainingQuestionSets.trainingId, pendingTrainingIds),
        eq(trainingQuestionSets.approvalStatus, 'pending_manager'),
      ))
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Persetujuan Tertunda</h1>
        <p className="text-gray-500 dark:text-gray-400">Tinjau permintaan training anggota tim dan pengajuan materi dari trainer.</p>
      </div>
      <form method="get" className="flex max-w-sm items-end gap-2">
        <label className="flex-1 space-y-1 text-sm font-medium">
          Filter Site
          <select name="site" defaultValue={selectedSiteId ?? ''} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm">
            <option value="">Semua site</option>
            {siteOptions.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}
          </select>
        </label>
        <button className="h-10 rounded-md border border-border bg-background px-4 text-sm font-medium">Terapkan</button>
      </form>
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Pengajuan Training Trainer</h2>
        {trainingRequests.length === 0 ? (
          <div className="p-6 border border-dashed border-border rounded-xl bg-card text-center">
            <BookOpen className="h-9 w-9 mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-500">Tidak ada pengajuan training trainer yang menunggu approval manager.</p>
          </div>
        ) : trainingRequests.map((req) => (
          <div key={req.id} className="p-5 border border-border rounded-xl bg-card shadow-sm">
            <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-sm">{req.trainerName}</p>
                <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">pending manager</span>
              </div>
              <p className="font-bold text-primary">{req.title}</p>
              <p className="mt-1 text-sm text-gray-500 line-clamp-2">{req.description}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {formatDate(req.createdAt)}</span>
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {req.siteName || 'Global'}</span>
                <span>{req.category || 'Umum'}</span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-md border border-border bg-background p-3">
                  <p className="text-xs font-semibold uppercase text-gray-500">Materi</p>
                  <div className="mt-2 space-y-1">
                    {materialRows.filter((item) => item.trainingId === req.id).map((item) => (
                      <a key={item.id} href={item.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm text-primary hover:underline">
                        <FileText className="h-3.5 w-3.5" /> {item.title} ({item.type})
                      </a>
                    ))}
                  </div>
                </div>
                <div className="rounded-md border border-border bg-background p-3">
                  <p className="text-xs font-semibold uppercase text-gray-500">Paket Soal</p>
                  <div className="mt-2 space-y-1">
                    {setRows.filter((item) => item.trainingId === req.id).map((item) => (
                      <p key={item.id} className="text-sm font-medium">{item.title}</p>
                    ))}
                  </div>
                </div>
              </div>
              {req.certificateEnabled && (
                <div className="mt-3 rounded-md bg-amber-50 p-3 text-xs text-amber-800">
                  Sertifikat aktif · Passing score {req.certificatePassingScore}% · Masa berlaku {req.certificateValidityMonths ? `${req.certificateValidityMonths} bulan` : 'tanpa kedaluwarsa'} · Template {req.certificateTemplateUrl ? 'tersedia' : 'belum tersedia'}
                </div>
              )}
            </div>
            <div className="space-y-3">
              <form action={submitTrainingApprovalStatus} className="space-y-2">
                <input type="hidden" name="trainingId" value={req.id} />
                <input type="hidden" name="status" value="rejected" />
                <textarea name="rejectionReason" required rows={3} placeholder="Alasan penolakan wajib diisi" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
                <button type="submit" className="w-full bg-white dark:bg-transparent border border-red-200 text-red-600 hover:bg-red-50 px-6 py-2 rounded-md text-sm font-medium">Tolak & Kembalikan</button>
              </form>
              <form action={submitTrainingApprovalStatus}>
                <input type="hidden" name="trainingId" value={req.id} />
                <input type="hidden" name="status" value="approved" />
                <button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2 rounded-md shadow-sm text-sm font-medium transition-colors">Approve</button>
              </form>
            </div>
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
