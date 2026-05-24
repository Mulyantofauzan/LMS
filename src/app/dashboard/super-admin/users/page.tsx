import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users, jobsites } from "@/db/schema";
import { Search, Filter, Shield, Briefcase, Mail } from "lucide-react";
import { UserForm } from "./user-form";
import { sql, eq } from "drizzle-orm";

export default async function UsersPage() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== 'super-admin' && role !== 'admin') redirect('/dashboard');

  // Fetch users and jobsites
  const allUsers = await db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    role: users.role,
    department: users.department,
    position: users.position,
    jobsiteName: jobsites.name
  })
  .from(users)
  .leftJoin(jobsites, eq(users.jobsiteId, jobsites.id))
  .orderBy(users.name);

  const allJobsites = await db.select({ id: jobsites.id, name: jobsites.name }).from(jobsites);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Manajemen Pengguna</h1>
          <p className="text-gray-500 dark:text-gray-400">Kelola akses, peran, dan profil pengguna di seluruh sistem.</p>
        </div>
        <UserForm jobsites={allJobsites} />
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border flex gap-4 items-center bg-gray-50/50 dark:bg-gray-900/20">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Cari berdasarkan nama atau email..." 
              className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-border bg-background rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            <Filter className="h-4 w-4" /> Filter
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 dark:bg-gray-900/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-semibold">Pengguna</th>
                <th className="px-6 py-4 font-semibold">Peran</th>
                <th className="px-6 py-4 font-semibold">Lokasi Kerja</th>
                <th className="px-6 py-4 font-semibold">Departemen</th>
                <th className="px-6 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {allUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Belum ada pengguna.</td>
                </tr>
              ) : (
                allUsers.map((user) => (
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
                      {user.department || '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-primary font-medium hover:underline text-sm mr-4">Edit</button>
                      <button className="text-red-500 font-medium hover:underline text-sm">Hapus</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-border flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/20 text-sm">
          <span className="text-gray-500">Menampilkan <span className="font-medium text-foreground">{allUsers.length}</span> pengguna</span>
          <div className="flex gap-1">
            <button className="px-3 py-1 border border-border rounded-md bg-background disabled:opacity-50">Sebelumnya</button>
            <button className="px-3 py-1 border border-border rounded-md bg-background disabled:opacity-50">Berikutnya</button>
          </div>
        </div>
      </div>
    </div>
  );
}
