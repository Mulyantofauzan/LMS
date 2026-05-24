import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { jobsites, users } from "@/db/schema";
import { UserForm } from "../../super-admin/users/user-form";
import { UserRowActions } from "../../super-admin/users/user-row-actions";
import { eq } from "drizzle-orm";

export default async function SiteUsersPage() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== 'site-admin' && role !== 'admin') redirect('/dashboard');

  const currentUser = await db.select({ jobsiteId: users.jobsiteId }).from(users).where(eq(users.id, Number((session?.user as any)?.id))).get();
  const allJobsites = await db.select({ id: jobsites.id, name: jobsites.name }).from(jobsites).orderBy(jobsites.name);
  const allUsers = currentUser?.jobsiteId
    ? await db.select().from(users).where(eq(users.jobsiteId, currentUser.jobsiteId)).orderBy(users.name)
    : await db.select().from(users).orderBy(users.name);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Site Employees</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage employees at your jobsite.</p>
        </div>
        <UserForm jobsites={allJobsites} />
      </div>
      <div className="p-6 border border-border rounded-xl bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 uppercase border-b border-border">
              <tr>
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium">Role</th>
                <th className="px-6 py-3 font-medium">Position</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {allUsers.map((user) => (
                <tr key={user.id} className="border-b border-border last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 font-medium flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">{user.name.charAt(0)}</div>
                    {user.name}
                  </td>
                  <td className="px-6 py-4 text-gray-500">{user.email}</td>
                  <td className="px-6 py-4"><span className="text-[10px] uppercase tracking-wider font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{user.role}</span></td>
                  <td className="px-6 py-4 text-gray-500">{user.position || '—'}</td>
                  <td className="px-6 py-4 text-right"><UserRowActions user={user} jobsites={allJobsites} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
