import { auth } from '@/auth';
import { db } from '@/db';
import {
  masterDepartments,
  masterPositions,
  trainingRequirementExclusions,
  trainingRequirements,
  trainings,
  users,
} from '@/db/schema';
import {
  createRequirementExclusionForm,
  createTrainingRequirementForm,
  deleteRequirementExclusionForm,
  deleteTrainingRequirementForm,
} from '@/lib/actions/external-certificate-actions';
import { getManagedUsersForCertificateAdmin, getTnaRowsForUsers } from '@/lib/tna';
import { eq, inArray } from 'drizzle-orm';
import { Plus, Trash2 } from 'lucide-react';
import { redirect } from 'next/navigation';

type SessionUser = {
  id?: string | number | null;
  role?: string | null;
};

export default async function SiteAdminTnaPage() {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  if (!['site-admin', 'admin'].includes(user?.role ?? '') || !user?.id) redirect('/dashboard');

  const currentUser = await db.select({ jobsiteId: users.jobsiteId }).from(users).where(eq(users.id, Number(user.id))).get();
  const managedUsers = await getManagedUsersForCertificateAdmin(user.role!, Number(user.id));
  const userIds = managedUsers.map((item) => item.id);
  const [trainingRows, departmentRows, positionRows, allRequirementRows, exclusionRows] = await Promise.all([
    db.select({ id: trainings.id, title: trainings.title }).from(trainings).orderBy(trainings.title),
    db.select({ name: masterDepartments.name }).from(masterDepartments).orderBy(masterDepartments.name),
    db.select({ name: masterPositions.name }).from(masterPositions).orderBy(masterPositions.name),
    db.select({
      id: trainingRequirements.id,
      trainingTitle: trainings.title,
      scope: trainingRequirements.scope,
      jobsiteId: trainingRequirements.jobsiteId,
      department: trainingRequirements.department,
      position: trainingRequirements.position,
      userId: trainingRequirements.userId,
      requirementType: trainingRequirements.requirementType,
      recurrence: trainingRequirements.recurrence,
      intervalMonths: trainingRequirements.intervalMonths,
      effectiveYear: trainingRequirements.effectiveYear,
    })
      .from(trainingRequirements)
      .innerJoin(trainings, eq(trainingRequirements.trainingId, trainings.id))
      .orderBy(trainings.title),
    userIds.length === 0
      ? []
      : db.select({
        id: trainingRequirementExclusions.id,
        requirementId: trainingRequirementExclusions.requirementId,
        userName: users.name,
        reason: trainingRequirementExclusions.reason,
      })
        .from(trainingRequirementExclusions)
        .innerJoin(users, eq(trainingRequirementExclusions.userId, users.id))
        .where(inArray(trainingRequirementExclusions.userId, userIds))
        .orderBy(users.name),
  ]);
  const siteRequirementRows = allRequirementRows.filter((req) => {
    if (req.scope === 'global') return true;
    if (req.jobsiteId && req.jobsiteId === currentUser?.jobsiteId) return true;
    return !!req.userId && userIds.includes(req.userId);
  });
  const editableRequirementRows = siteRequirementRows.filter((req) => req.scope !== 'global');
  const tnaRows = await getTnaRowsForUsers(managedUsers);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">TNA Site</h1>
        <p className="text-gray-500 dark:text-gray-400">Kelola kebutuhan training dan exception karyawan di site Anda.</p>
      </div>

      <section className="border border-border rounded-xl bg-card shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="text-lg font-semibold">Tambah Requirement Site</h2>
        </div>
        <form action={createTrainingRequirementForm} className="p-5 grid gap-3 lg:grid-cols-4">
          <select name="trainingId" required className="h-10 px-3 rounded-md border border-border bg-background text-sm">
            <option value="">Training</option>
            {trainingRows.map((training) => <option key={training.id} value={training.id}>{training.title}</option>)}
          </select>
          <select name="scope" required className="h-10 px-3 rounded-md border border-border bg-background text-sm">
            <option value="jobsite">Seluruh site</option>
            <option value="department">Departemen</option>
            <option value="position">Jabatan</option>
            <option value="user">Karyawan</option>
          </select>
          <select name="requirementType" required className="h-10 px-3 rounded-md border border-border bg-background text-sm">
            <option value="mandatory">Mandatory</option>
            <option value="development">Development</option>
          </select>
          <select name="recurrence" required className="h-10 px-3 rounded-md border border-border bg-background text-sm">
            <option value="once">Sekali selama bekerja</option>
            <option value="annual">Tahunan</option>
            <option value="interval_months">Berkala bulan</option>
          </select>
          <select name="department" className="h-10 px-3 rounded-md border border-border bg-background text-sm">
            <option value="">Departemen jika scope departemen</option>
            {departmentRows.map((department) => <option key={department.name} value={department.name}>{department.name}</option>)}
          </select>
          <select name="position" className="h-10 px-3 rounded-md border border-border bg-background text-sm">
            <option value="">Jabatan jika scope jabatan</option>
            {positionRows.map((position) => <option key={position.name} value={position.name}>{position.name}</option>)}
          </select>
          <select name="userId" className="h-10 px-3 rounded-md border border-border bg-background text-sm">
            <option value="">Karyawan jika scope user</option>
            {managedUsers.map((trainee) => <option key={trainee.id} value={trainee.id}>{trainee.name}</option>)}
          </select>
          <input name="effectiveYear" type="number" min="2020" placeholder="Tahun annual" className="h-10 px-3 rounded-md border border-border bg-background text-sm" />
          <input name="intervalMonths" type="number" min="1" placeholder="Interval bulan" className="h-10 px-3 rounded-md border border-border bg-background text-sm" />
          <button type="submit" className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 lg:col-span-3">
            <Plus className="h-4 w-4" /> Tambah Requirement
          </button>
        </form>
        <div className="divide-y divide-border">
          {siteRequirementRows.length === 0 ? (
            <div className="p-5 text-sm text-gray-500">Belum ada requirement TNA untuk site ini.</div>
          ) : siteRequirementRows.map((req) => (
            <div key={req.id} className="p-4 grid gap-3 lg:grid-cols-[1.5fr_1fr_1fr_auto] lg:items-center">
              <div>
                <div className="font-semibold">{req.trainingTitle}</div>
                <div className="text-xs text-gray-500">
                  {req.scope}
                  {req.department ? ` - ${req.department}` : ''}
                  {req.position ? ` - ${req.position}` : ''}
                  {req.userId ? ` - ${managedUsers.find((item) => item.id === req.userId)?.name ?? 'Karyawan'}` : ''}
                </div>
              </div>
              <div className="text-sm text-gray-500">{req.requirementType}</div>
              <div className="text-sm text-gray-500">{req.recurrence === 'interval_months' ? `${req.intervalMonths} bulan` : req.recurrence === 'annual' ? `Tahunan ${req.effectiveYear ?? ''}` : 'Sekali'}</div>
              {req.scope === 'global' ? (
                <span className="text-xs text-gray-500">Global</span>
              ) : (
                <form action={deleteTrainingRequirementForm.bind(null, req.id)}>
                  <button type="submit" className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50">
                    <Trash2 className="h-4 w-4" /> Hapus
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="border border-border rounded-xl bg-card shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="text-lg font-semibold">Exception Karyawan Site</h2>
        </div>
        <form action={createRequirementExclusionForm} className="p-5 grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
          <select name="requirementId" required className="h-10 px-3 rounded-md border border-border bg-background text-sm">
            <option value="">Requirement site</option>
            {editableRequirementRows.map((req) => <option key={req.id} value={req.id}>{req.trainingTitle} - {req.scope}</option>)}
          </select>
          <select name="userId" required className="h-10 px-3 rounded-md border border-border bg-background text-sm">
            <option value="">Karyawan</option>
            {managedUsers.map((trainee) => <option key={trainee.id} value={trainee.id}>{trainee.name}</option>)}
          </select>
          <input name="reason" placeholder="Alasan pengecualian" className="h-10 px-3 rounded-md border border-border bg-background text-sm" />
          <button type="submit" className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Tambah
          </button>
        </form>
        <div className="divide-y divide-border">
          {exclusionRows.length === 0 ? (
            <div className="p-5 text-sm text-gray-500">Belum ada exception site.</div>
          ) : exclusionRows.map((item) => (
            <div key={item.id} className="p-4 flex items-center justify-between gap-3">
              <div className="text-sm"><span className="font-semibold">{item.userName}</span> dikecualikan dari requirement #{item.requirementId}. {item.reason ?? ''}</div>
              <form action={deleteRequirementExclusionForm.bind(null, item.id)}>
                <button type="submit" className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50">
                  <Trash2 className="h-4 w-4" /> Hapus
                </button>
              </form>
            </div>
          ))}
        </div>
      </section>

      <section className="border border-border rounded-xl bg-card shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="text-lg font-semibold">Laporan Gap Site</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 uppercase border-b border-border">
              <tr>
                <th className="px-6 py-3 font-medium">Karyawan</th>
                <th className="px-6 py-3 font-medium">Training</th>
                <th className="px-6 py-3 font-medium">Jenis</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Pemenuhan</th>
              </tr>
            </thead>
            <tbody>
              {tnaRows.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Belum ada data gap TNA.</td></tr>
              ) : tnaRows.map((row) => (
                <tr key={`${row.userId}-${row.requirementId}`} className="border-b border-border last:border-0">
                  <td className="px-6 py-4 font-medium">{row.userName}</td>
                  <td className="px-6 py-4">{row.trainingTitle}</td>
                  <td className="px-6 py-4">{row.requirementType}</td>
                  <td className="px-6 py-4">{row.fulfilled ? 'Terpenuhi' : 'Gap'}</td>
                  <td className="px-6 py-4 text-gray-500">{row.fulfilledBy ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
