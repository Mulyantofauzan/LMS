import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { auditLogs, users } from "@/db/schema";
import { Search, Filter, History } from "lucide-react";
import { sql, desc } from "drizzle-orm";

export default async function AuditLogsPage() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== 'super-admin') redirect('/dashboard'); // Only super admin should see global audit logs

  const logs = await db.select({
    id: auditLogs.id,
    action: auditLogs.action,
    target: auditLogs.target,
    timestamp: auditLogs.timestamp,
    userName: users.name,
    userRole: users.role,
  })
  .from(auditLogs)
  .leftJoin(users, sql`${auditLogs.userId} = ${users.id}`)
  .orderBy(desc(auditLogs.timestamp));

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Log Audit Sistem</h1>
          <p className="text-gray-500 dark:text-gray-400">Pantau semua aktivitas sistem untuk keamanan dan kepatuhan.</p>
        </div>
        <button className="bg-background border border-border text-foreground px-4 py-2 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium transition-colors">Ekspor CSV</button>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex gap-4 items-center bg-gray-50/50 dark:bg-gray-900/20">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Cari berdasarkan aksi, pengguna, atau entitas..." 
              className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-border bg-background rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            <Filter className="h-4 w-4" /> Rentang Waktu
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 dark:bg-gray-900/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-semibold">Waktu (WIB)</th>
                <th className="px-6 py-4 font-semibold">Pengguna</th>
                <th className="px-6 py-4 font-semibold">Aksi</th>
                <th className="px-6 py-4 font-semibold">Target / Entitas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">Belum ada log audit.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 flex items-center gap-2">
                      <History className="h-4 w-4 text-gray-400" />
                      {formatDate(log.timestamp)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{log.userName || 'Sistem'}</div>
                      <div className="text-xs text-gray-500 capitalize">{log.userRole?.replace('-', ' ') || 'Sistem'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {log.target || 'Global'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-border flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/20 text-sm">
          <span className="text-gray-500">Menampilkan <span className="font-medium text-foreground">{logs.length}</span> catatan</span>
          <div className="flex gap-1">
            <button className="px-3 py-1 border border-border rounded-md bg-background disabled:opacity-50" disabled>Sebelumnya</button>
            <button className="px-3 py-1 border border-border rounded-md bg-background disabled:opacity-50" disabled>Berikutnya</button>
          </div>
        </div>
      </div>
    </div>
  );
}
