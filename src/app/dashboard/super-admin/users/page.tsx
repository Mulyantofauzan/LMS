import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users, jobsites, masterDepartments, masterPositions } from "@/db/schema";
import { Search, Filter, Shield, Briefcase, Mail } from "lucide-react";
import { UserForm } from "./user-form";
import { eq } from "drizzle-orm";
import { UserRowActions } from "./user-row-actions";
import { getSessionUser } from "@/lib/session-user";

export default async function UsersPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; role?: string }>;
}) {
  const session = await auth();
  const role = getSessionUser(session?.user)?.role;
  if (role !== 'super-admin' && role !== 'admin') redirect('/dashboard');
  const params = await searchParams;
  const q = params?.q?.toLowerCase().trim() ?? '';
  const selectedRole = params?.role ?? '';

  // Fetch users and jobsites
  const allUsers = await db.select({
    id: users.id,
    nrp: users.nrp,
    name: users.name,
    email: users.email,
    role: users.role,
    jobsiteId: users.jobsiteId,
    department: users.department,
    position: users.position,
    isActive: users.isActive,
    jobsiteName: jobsites.name
  })
  .from(users)
  .leftJoin(jobsites, eq(users.jobsiteId, jobsites.id))
  .orderBy(users.name);

  const allJobsites = await db.select({ id: jobsites.id, name: jobsites.name }).from(jobsites);
  const departments = await db.select({ id: masterDepartments.id, name: masterDepartments.name }).from(masterDepartments).where(eq(masterDepartments.isActive, true)).orderBy(masterDepartments.name);
  const positions = await db.select({ id: masterPositions.id, name: masterPositions.name }).from(masterPositions).where(eq(masterPositions.isActive, true)).orderBy(masterPositions.name);
  const filteredUsers = allUsers.filter((user) => {
    const matchesSearch = !q || [user.name, user.nrp, user.email, user.department, user.position, user.jobsiteName]
      .filter(Boolean)
      .some((value) => value!.toLowerCase().includes(q));
    const matchesRole = !selectedRole || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Manajemen Pengguna</h1>
          <p className="text-gray-500 dark:text-gray-400">Kelola akses, peran, dan profil pengguna di seluruh sistem.</p>
        </div>
        <UserForm jobsites={allJobsites} departments={departments} positions={positions} />
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        <form className="p-4 border-b border-border flex flex-col sm:flex-row gap-4 sm:items-center bg-gray-50/50 dark:bg-gray-900/20">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              name="q"
              defaultValue={params?.q ?? ''}
              placeholder="Cari nama, NRP, atau email..." 
              className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <select
            name="role"
            defaultValue={selectedRole}
            className="h-10 px-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Semua peran</option>
            <option value="super-admin">Super Admin</option>
            <option value="site-admin">Site Admin</option>
            <option value="manager">Manager</option>
            <option value="trainer">Trainer</option>
            <option value="trainee">Trainee</option>
          </select>
          <button type="submit" className="flex items-center justify-center gap-2 px-4 py-2 border border-border bg-background rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            <Filter className="h-4 w-4" /> Filter
          </button>
        </form>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 dark:bg-gray-900/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-semibold">Pengguna</th>
                <th className="px-6 py-4 font-semibold">NRP</th>
                <th className="px-6 py-4 font-semibold">Peran</th>
                <th className="px-6 py-4 font-semibold">Lokasi Kerja</th>
                <th className="px-6 py-4 font-semibold">Departemen/Jabatan</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">Tidak ada pengguna yang cocok.</td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{user.name}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Mail className="h-3 w-3"/>{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-700 dark:text-gray-200">{user.nrp || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 capitalize">
                        <Shield className="h-3 w-3" />
                        {user.role.replace('-', ' ')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                        <Briefcase className="h-3.5 w-3.5 text-gray-400" />
                        {user.jobsiteName || 'Global'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      <div>{user.department || '-'}</div>
                      <div className="text-xs text-gray-500">{user.position || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        user.isActive
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                      }`}>
                        {user.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <UserRowActions user={user} jobsites={allJobsites} departments={departments} positions={positions} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-border flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/20 text-sm">
          <span className="text-gray-500">Menampilkan <span className="font-medium text-foreground">{filteredUsers.length}</span> pengguna</span>
          <div className="flex gap-1">
            <button disabled className="px-3 py-1 border border-border rounded-md bg-background disabled:opacity-50">Sebelumnya</button>
            <button disabled className="px-3 py-1 border border-border rounded-md bg-background disabled:opacity-50">Berikutnya</button>
          </div>
        </div>
      </div>
    </div>
  );
}
