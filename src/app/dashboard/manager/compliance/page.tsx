import { auth } from '@/auth';
import { db } from '@/db';
import { jobsites, users } from '@/db/schema';
import { getTnaRowsForUsers } from '@/lib/tna';
import { eq } from 'drizzle-orm';
import { CheckCircle2, XCircle } from 'lucide-react';
import { redirect } from 'next/navigation';

type SessionUser = {
  role?: string | null;
};

export default async function TeamCompliancePage() {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  if (user?.role !== 'manager') redirect('/dashboard');

  const traineeRows = await db.select({
    id: users.id,
    name: users.name,
    position: users.position,
    department: users.department,
    jobsiteId: users.jobsiteId,
    jobsiteName: jobsites.name,
  })
    .from(users)
    .leftJoin(jobsites, eq(users.jobsiteId, jobsites.id))
    .where(eq(users.role, 'trainee'))
    .orderBy(users.name);
  const tnaRows = await getTnaRowsForUsers(traineeRows);
  const rowsByUser = new Map<number, typeof tnaRows>();
  for (const row of tnaRows) {
    const list = rowsByUser.get(row.userId) ?? [];
    list.push(row);
    rowsByUser.set(row.userId, list);
  }
  const teamMembers = traineeRows.map((trainee) => {
    const rows = rowsByUser.get(trainee.id) ?? [];
    const mandatory = rows.filter((row) => row.requirementType === 'mandatory');
    const completed = mandatory.filter((row) => row.fulfilled).length;
    const gaps = mandatory.filter((row) => !row.fulfilled).map((row) => row.trainingTitle);
    return {
      ...trainee,
      trainings: mandatory.length,
      completed,
      gaps,
      status: mandatory.length === 0 || completed >= mandatory.length ? 'compliant' : 'non-compliant',
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Kepatuhan Tim</h1>
        <p className="text-gray-500 dark:text-gray-400">Pantau compliance mandatory dari TNA seluruh site.</p>
      </div>
      <div className="p-6 border border-border rounded-xl bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 uppercase border-b border-border">
              <tr>
                <th className="px-6 py-3 font-medium">Anggota</th>
                <th className="px-6 py-3 font-medium">Site</th>
                <th className="px-6 py-3 font-medium">Wajib</th>
                <th className="px-6 py-3 font-medium">Selesai</th>
                <th className="px-6 py-3 font-medium">Gap</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {teamMembers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Belum ada karyawan trainee.</td>
                </tr>
              ) : teamMembers.map((member) => (
                <tr key={member.id} className="border-b border-border last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 font-medium">
                    <div>{member.name}</div>
                    <div className="text-xs text-gray-500">{member.department || '-'} · {member.position || '-'}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{member.jobsiteName || '-'}</td>
                  <td className="px-6 py-4">{member.trainings}</td>
                  <td className="px-6 py-4">{member.completed}</td>
                  <td className="px-6 py-4 text-gray-500">{member.gaps.length > 0 ? member.gaps.join(', ') : '-'}</td>
                  <td className="px-6 py-4">
                    {member.status === 'compliant' ? (
                      <span className="flex items-center gap-1 text-green-600 text-xs font-semibold"><CheckCircle2 className="h-3.5 w-3.5" /> Patuh</span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-600 text-xs font-semibold"><XCircle className="h-3.5 w-3.5" /> Belum Patuh</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
