import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, BookOpen, ShieldAlert, Award } from "lucide-react";

export default async function SiteAdminDashboard() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  
  if (role !== 'site-admin' && role !== 'admin') { 
    redirect('/dashboard');
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Site A Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage employees, trainings, and certificates for your site.</p>
        </div>
        <Link href="/api/reports/site-summary.csv" className="bg-primary text-primary-foreground px-4 py-2 rounded-md shadow-sm hover:bg-primary/90 text-sm font-medium transition-colors">Export Site Report</Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="p-6 border border-border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-gray-500">Site Employees</h3>
            <Users className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold">1,245</div>
        </div>
        <div className="p-6 border border-border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-gray-500">Scheduled Trainings</h3>
            <BookOpen className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold">12</div>
          <p className="text-xs text-gray-500 mt-1">This month</p>
        </div>
        <div className="p-6 border border-border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-gray-500">Site Compliance</h3>
            <ShieldAlert className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold">92.0%</div>
          <p className="text-xs text-green-500 mt-1">Above target</p>
        </div>
        <div className="p-6 border border-border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-gray-500">Issued Certificates</h3>
            <Award className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold">4,821</div>
          <p className="text-xs text-gray-500 mt-1">Total to date</p>
        </div>
      </div>

      <div className="p-6 border border-border rounded-xl bg-card shadow-sm">
        <h3 className="font-semibold mb-4 text-lg">Upcoming Trainings</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 uppercase border-b border-border">
              <tr>
                <th className="px-6 py-3 font-medium">Training Name</th>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Trainer</th>
                <th className="px-6 py-3 font-medium">Enrolled</th>
                <th className="px-6 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <td className="px-6 py-4 font-medium">Heavy Machinery Safety - Level 1</td>
                <td className="px-6 py-4 text-gray-500">Oct 12, 2026</td>
                <td className="px-6 py-4">Robert Chen</td>
                <td className="px-6 py-4">24 / 30</td>
                <td className="px-6 py-4 text-right"><Link href="/dashboard/site-admin/trainings" className="text-primary font-medium hover:underline">View Details</Link></td>
              </tr>
              <tr className="border-b border-border last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <td className="px-6 py-4 font-medium">Hazardous Materials Handling</td>
                <td className="px-6 py-4 text-gray-500">Oct 15, 2026</td>
                <td className="px-6 py-4">Sarah Johnson</td>
                <td className="px-6 py-4">15 / 20</td>
                <td className="px-6 py-4 text-right"><Link href="/dashboard/site-admin/trainings" className="text-primary font-medium hover:underline">View Details</Link></td>
              </tr>
              <tr className="border-b border-border last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <td className="px-6 py-4 font-medium">First Aid & CPR Certification</td>
                <td className="px-6 py-4 text-gray-500">Oct 18, 2026</td>
                <td className="px-6 py-4">External Vendor</td>
                <td className="px-6 py-4">50 / 50</td>
                <td className="px-6 py-4 text-right"><Link href="/dashboard/site-admin/trainings" className="text-primary font-medium hover:underline">View Details</Link></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
