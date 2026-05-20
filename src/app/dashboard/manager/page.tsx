import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Users, ShieldAlert, ClipboardCheck } from "lucide-react";

export default async function ManagerDashboard() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  
  if (role !== 'manager') { 
    redirect('/dashboard');
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Team Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">Review pending training requests and team compliance.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="p-6 border border-border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-gray-500">My Team Members</h3>
            <Users className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold">14</div>
        </div>
        <div className="p-6 border border-border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-gray-500">Pending Approvals</h3>
            <ClipboardCheck className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600">3</div>
          <p className="text-xs text-gray-500 mt-1">Requires your action</p>
        </div>
        <div className="p-6 border border-border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-gray-500">Team Compliance</h3>
            <ShieldAlert className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold">100%</div>
          <p className="text-xs text-green-500 mt-1">All members compliant</p>
        </div>
      </div>

      <div className="p-6 border border-border rounded-xl bg-card shadow-sm">
        <h3 className="font-semibold mb-6 text-lg">Action Required: Training Approvals</h3>
        <div className="space-y-4">
          {[
            { trainee: 'David Kim', training: 'Advanced Working at Heights', date: 'Oct 20, 2026', cost: '$450' },
            { trainee: 'Emily Chen', training: 'Electrical Safety Refresher', date: 'Oct 22, 2026', cost: '$0 (Internal)' },
            { trainee: 'Mark Johnson', training: 'Leadership in Safety', date: 'Nov 01, 2026', cost: '$1,200' },
          ].map((req, i) => (
            <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 border border-border rounded-lg bg-background hover:border-gray-300 transition-colors">
              <div>
                <p className="font-semibold text-sm">{req.trainee} <span className="text-gray-400 font-normal">requests to attend</span></p>
                <p className="font-bold text-primary mt-1">{req.training}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1">📅 {req.date}</span>
                  <span className="flex items-center gap-1">💰 {req.cost}</span>
                </div>
              </div>
              <div className="flex gap-2 mt-4 sm:mt-0 w-full sm:w-auto">
                <button className="flex-1 sm:flex-none bg-white dark:bg-transparent border border-border text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 px-6 py-2 rounded-md shadow-sm text-sm font-medium transition-colors">Reject</button>
                <button className="flex-1 sm:flex-none bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2 rounded-md shadow-sm text-sm font-medium transition-colors">Approve</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
