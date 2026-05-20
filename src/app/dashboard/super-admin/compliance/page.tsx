import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ShieldAlert, CheckCircle2, AlertTriangle } from "lucide-react";

export default async function CompliancePage() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== 'super-admin' && role !== 'admin') redirect('/dashboard');

  const complianceData = [
    { site: "Site Alpha", compliance: 94, total: 342, compliant: 321, overdue: 21 },
    { site: "Site Bravo", compliance: 87, total: 218, compliant: 190, overdue: 28 },
    { site: "Site Charlie", compliance: 91, total: 485, compliant: 441, overdue: 44 },
    { site: "Site Delta", compliance: 78, total: 156, compliant: 122, overdue: 34 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Compliance Matrix</h1>
        <p className="text-gray-500 dark:text-gray-400">Global training compliance overview across all jobsites.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {complianceData.map((site, i) => (
          <div key={i} className="p-6 border border-border rounded-xl bg-card shadow-sm card-hover">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-bold">{site.site}</h3>
              {site.compliance >= 90 ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              )}
            </div>
            <div className="text-3xl font-extrabold mb-2">{site.compliance}%</div>
            <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2 mb-3">
              <div 
                className={`h-2 rounded-full ${site.compliance >= 90 ? 'bg-green-500' : site.compliance >= 80 ? 'bg-amber-500' : 'bg-red-500'}`} 
                style={{ width: `${site.compliance}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>{site.compliant} compliant</span>
              <span className="text-red-500">{site.overdue} overdue</span>
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 border border-border rounded-xl bg-card shadow-sm">
        <h3 className="font-semibold mb-4 text-lg">Mandatory Training Status</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 uppercase border-b border-border">
              <tr>
                <th className="px-6 py-3 font-medium">Training</th>
                <th className="px-6 py-3 font-medium">Required By</th>
                <th className="px-6 py-3 font-medium">Completed</th>
                <th className="px-6 py-3 font-medium">Pending</th>
                <th className="px-6 py-3 font-medium">Rate</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: "Basic Safety Induction", required: "All Employees", completed: 1180, pending: 21, rate: 98 },
                { name: "Working at Heights", required: "Field Workers", completed: 420, pending: 45, rate: 90 },
                { name: "Hazmat Handling", required: "Warehouse Staff", completed: 89, pending: 11, rate: 89 },
                { name: "First Aid & CPR", required: "All Employees", completed: 980, pending: 221, rate: 82 },
              ].map((t, i) => (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 font-medium">{t.name}</td>
                  <td className="px-6 py-4 text-gray-500">{t.required}</td>
                  <td className="px-6 py-4 text-green-600 font-medium">{t.completed}</td>
                  <td className="px-6 py-4 text-amber-600 font-medium">{t.pending}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${t.rate >= 90 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                      {t.rate}%
                    </span>
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
