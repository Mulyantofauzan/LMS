import { auth } from '@/auth';
import { db } from '@/db';
import {
  jobsites,
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
import { SearchableSelect } from '@/components/forms/SearchableSelect';
import { getManagedUsersForCertificateAdmin, getTnaRowsForUsers } from '@/lib/tna';
import { eq } from 'drizzle-orm';
import { Plus, Trash2 } from 'lucide-react';
import { redirect } from 'next/navigation';

type SessionUser = {
  id?: string | number | null;
  role?: string | null;
};

export default async function SuperAdminTnaPage() {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  if (!['super-admin', 'admin'].includes(user?.role ?? '') || !user?.id) redirect('/dashboard');

  const [trainingRows, jobsiteRows, departmentRows, positionRows, traineeRows, requirementRows, exclusionRows] = await Promise.all([
    db.select({ id: trainings.id, title: trainings.title }).from(trainings).orderBy(trainings.title),
    db.select({ id: jobsites.id, name: jobsites.name }).from(jobsites).orderBy(jobsites.name),
    db.select({ name: masterDepartments.name }).from(masterDepartments).orderBy(masterDepartments.name),
    db.select({ name: masterPositions.name }).from(masterPositions).orderBy(masterPositions.name),
    getManagedUsersForCertificateAdmin(user.role!, Number(user.id)),
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
    db.select({
      id: trainingRequirementExclusions.id,
      requirementId: trainingRequirementExclusions.requirementId,
      userName: users.name,
      reason: trainingRequirementExclusions.reason,
    })
      .from(trainingRequirementExclusions)
      .innerJoin(users, eq(trainingRequirementExclusions.userId, users.id))
      .orderBy(users.name),
  ]);
  const tnaRows = await getTnaRowsForUsers(traineeRows);
  const jobsiteName = new Map(jobsiteRows.map((jobsite) => [jobsite.id, jobsite.name]));
  const traineeName = new Map(traineeRows.map((trainee) => [trainee.id, trainee.name]));
  const trainingOptions = trainingRows.map((training) => ({ value: training.id, label: training.title }));
  const jobsiteOptions = jobsiteRows.map((jobsite) => ({ value: jobsite.id, label: jobsite.name }));
  const departmentOptions = departmentRows.map((department) => ({ value: department.name, label: department.name }));
  const positionOptions = positionRows.map((position) => ({ value: position.name, label: position.name }));
  const traineeOptions = traineeRows.map((trainee) => ({ value: trainee.id, label: trainee.name }));
  const requirementOptions = requirementRows.map((req) => ({ value: req.id, label: `${req.trainingTitle} - ${req.scope}` }));
  const scopeOptions = [
    { value: 'global', label: 'Global' },
    { value: 'jobsite', label: 'Jobsite' },
    { value: 'department', label: 'Departemen' },
    { value: 'position', label: 'Jabatan' },
    { value: 'user', label: 'Karyawan' },
  ];
  const requirementTypeOptions = [
    { value: 'mandatory', label: 'Mandatory' },
    { value: 'development', label: 'Development' },
  ];
  const recurrenceOptions = [
    { value: 'once', label: 'Sekali selama bekerja' },
    { value: 'annual', label: 'Tahunan' },
    { value: 'interval_months', label: 'Berkala bulan' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Training Need Analysis</h1>
        <p className="text-gray-500 dark:text-gray-400">Kelola matriks kebutuhan training global, site, departemen, jabatan, dan user.</p>
      </div>

      <section className="border border-border rounded-xl bg-card shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="text-lg font-semibold">Tambah Requirement TNA</h2>
        </div>
        <form action={createTrainingRequirementForm} className="p-5 grid gap-3 lg:grid-cols-4">
          <SearchableSelect name="trainingId" required placeholder="Cari training" options={trainingOptions} />
          <SearchableSelect name="scope" required placeholder="Cari scope" options={scopeOptions} defaultValue="global" />
          <SearchableSelect name="requirementType" required placeholder="Cari jenis requirement" options={requirementTypeOptions} defaultValue="mandatory" />
          <SearchableSelect name="recurrence" required placeholder="Cari periode" options={recurrenceOptions} defaultValue="once" />
          <SearchableSelect name="jobsiteId" placeholder="Cari jobsite jika scope jobsite" options={jobsiteOptions} />
          <SearchableSelect name="department" placeholder="Cari departemen jika scope departemen" options={departmentOptions} />
          <SearchableSelect name="position" placeholder="Cari jabatan jika scope jabatan" options={positionOptions} />
          <SearchableSelect name="userId" placeholder="Cari karyawan jika scope user" options={traineeOptions} />
          <input name="effectiveYear" type="number" min="2020" placeholder="Tahun annual" className="h-10 px-3 rounded-md border border-border bg-background text-sm" />
          <input name="intervalMonths" type="number" min="1" placeholder="Interval bulan" className="h-10 px-3 rounded-md border border-border bg-background text-sm" />
          <button type="submit" className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 lg:col-span-2">
            <Plus className="h-4 w-4" /> Tambah Requirement
          </button>
        </form>
        <div className="divide-y divide-border">
          {requirementRows.length === 0 ? (
            <div className="p-5 text-sm text-gray-500">Belum ada requirement TNA.</div>
          ) : requirementRows.map((req) => (
            <div key={req.id} className="p-4 grid gap-3 lg:grid-cols-[1.5fr_1fr_1fr_auto] lg:items-center">
              <div>
                <div className="font-semibold">{req.trainingTitle}</div>
                <div className="text-xs text-gray-500">
                  Scope: {req.scope}
                  {req.jobsiteId ? ` - ${jobsiteName.get(req.jobsiteId) ?? 'Jobsite'}` : ''}
                  {req.department ? ` - ${req.department}` : ''}
                  {req.position ? ` - ${req.position}` : ''}
                  {req.userId ? ` - ${traineeName.get(req.userId) ?? 'Karyawan'}` : ''}
                </div>
              </div>
              <div className="text-sm text-gray-500">{req.requirementType}</div>
              <div className="text-sm text-gray-500">{req.recurrence === 'interval_months' ? `${req.intervalMonths} bulan` : req.recurrence === 'annual' ? `Tahunan ${req.effectiveYear ?? ''}` : 'Sekali'}</div>
              <form action={deleteTrainingRequirementForm.bind(null, req.id)}>
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
          <h2 className="text-lg font-semibold">Exception Karyawan</h2>
        </div>
        <form action={createRequirementExclusionForm} className="p-5 grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
          <SearchableSelect name="requirementId" required placeholder="Cari requirement" options={requirementOptions} />
          <SearchableSelect name="userId" required placeholder="Cari karyawan" options={traineeOptions} />
          <input name="reason" placeholder="Alasan pengecualian" className="h-10 px-3 rounded-md border border-border bg-background text-sm" />
          <button type="submit" className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Tambah
          </button>
        </form>
        <div className="divide-y divide-border">
          {exclusionRows.length === 0 ? (
            <div className="p-5 text-sm text-gray-500">Belum ada exception.</div>
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
          <h2 className="text-lg font-semibold">Laporan Gap TNA</h2>
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
