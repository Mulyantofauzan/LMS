import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ComplianceChart } from "@/components/charts/ComplianceChart";
import { Users, BookOpen, ShieldAlert, CheckCircle2 } from "lucide-react";

export default async function SuperAdminDashboard() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  
  if (role !== 'super-admin' && role !== 'admin') { 
    redirect('/dashboard');
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Global Overview</h1>
          <p className="text-gray-500 dark:text-gray-400">Monitor multi-jobsite training compliance and statistics.</p>
        </div>
        <div className="flex gap-2">
          <button className="bg-background border border-border text-foreground px-4 py-2 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium transition-colors">Download Report</button>
          <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md shadow-sm hover:bg-primary/90 text-sm font-medium transition-colors">Manage Jobsites</button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="p-6 border border-border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
            <Users className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold">12,482</div>
          <p className="text-xs text-green-500 mt-1 flex items-center"><CheckCircle2 className="h-3 w-3 mr-1"/> +2.5% from last month</p>
        </div>
        <div className="p-6 border border-border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-gray-500">Active Trainings</h3>
            <BookOpen className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold">148</div>
          <p className="text-xs text-gray-500 mt-1">Across 12 jobsites</p>
        </div>
        <div className="p-6 border border-border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-gray-500">Global Compliance</h3>
            <ShieldAlert className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold">84.2%</div>
          <p className="text-xs text-green-500 mt-1 flex items-center"><CheckCircle2 className="h-3 w-3 mr-1"/> Target: 90%</p>
        </div>
        <div className="p-6 border border-border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-gray-500">Expiring Certificates</h3>
            <ShieldAlert className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600">342</div>
          <p className="text-xs text-gray-500 mt-1">Within next 30 days</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <div className="p-6 border border-border rounded-xl bg-card shadow-sm md:col-span-4">
          <h3 className="font-semibold mb-6 text-lg">Jobsite Compliance Comparison</h3>
          <ComplianceChart />
        </div>
        <div className="p-6 border border-border rounded-xl bg-card shadow-sm md:col-span-3">
          <h3 className="font-semibold mb-4 text-lg">Recent Audit Logs</h3>
          <div className="space-y-4">
            {[
              { time: '10 mins ago', user: 'John Doe', action: 'Created new safety training', site: 'Site B' },
              { time: '1 hour ago', user: 'Jane Smith', action: 'Approved 24 certificates', site: 'Site A' },
              { time: '2 hours ago', user: 'System', action: 'Sent 145 expiry reminders', site: 'Global' },
              { time: '5 hours ago', user: 'Mike Ross', action: 'Onboarded 50 new contractors', site: 'Site C' },
            ].map((log, i) => (
              <div key={i} className="flex flex-col pb-4 border-b border-border last:border-0 last:pb-0">
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium text-foreground">{log.action}</span>
                  <span className="text-xs text-gray-400">{log.time}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-500">{log.user}</span>
                  <span className="text-[10px] uppercase tracking-wider font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{log.site}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
