import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { FileCheck, Clock } from "lucide-react";

export default async function AuditPage() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== 'super-admin' && role !== 'admin') redirect('/dashboard');

  const auditLogs = [
    { time: '2 mins ago', user: 'Super Admin', action: 'Viewed compliance matrix', site: 'Global', type: 'view' },
    { time: '10 mins ago', user: 'Ahmad Rifai', action: 'Created training: Hazmat Level 2', site: 'Site Alpha', type: 'create' },
    { time: '25 mins ago', user: 'Sarah Wijaya', action: 'Approved 12 certificates', site: 'Site Bravo', type: 'approve' },
    { time: '1 hour ago', user: 'System', action: 'Sent 45 certificate expiry reminders', site: 'Global', type: 'system' },
    { time: '2 hours ago', user: 'Budi Santoso', action: 'Onboarded 15 new contractors', site: 'Site Charlie', type: 'create' },
    { time: '3 hours ago', user: 'Trainer Demo', action: 'Completed attendance for Session #42', site: 'Site Alpha', type: 'update' },
    { time: '5 hours ago', user: 'Manager Demo', action: 'Rejected training request: Leadership Program', site: 'Site Bravo', type: 'reject' },
    { time: '1 day ago', user: 'Super Admin', action: 'Updated global compliance threshold to 90%', site: 'Global', type: 'update' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Audit Logs</h1>
        <p className="text-gray-500 dark:text-gray-400">Complete audit trail of all system activities.</p>
      </div>

      <div className="p-6 border border-border rounded-xl bg-card shadow-sm">
        <div className="space-y-0">
          {auditLogs.map((log, i) => (
            <div key={i} className="flex items-start gap-4 py-4 border-b border-border last:border-0">
              <div className={`mt-0.5 h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                log.type === 'create' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                log.type === 'approve' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                log.type === 'reject' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                log.type === 'system' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' :
                'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
              }`}>
                <FileCheck className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{log.action}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-gray-500">{log.user}</span>
                  <span className="text-[10px] uppercase tracking-wider font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{log.site}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
                <Clock className="h-3 w-3" />
                {log.time}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
