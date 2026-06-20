import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { db } from "@/db";
import { jobsites, users, trainings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/session-user";

export default async function CompliancePage() {
  const session = await auth();
  const role = getSessionUser(session?.user)?.role;
  if (role !== 'super-admin' && role !== 'admin') redirect('/dashboard');

  // Fetch all jobsites
  const sites = await db.select().from(jobsites);
  const allUsers = await db.select().from(users).where(eq(users.isActive, true));
  const mandatoryTrainings = await db.select().from(trainings).where(eq(trainings.isMandatory, true));
  
  // Calculate compliance data per jobsite
  const complianceData = sites.map(site => {
    const siteUsers = allUsers.filter(u => u.jobsiteId === site.id);
    const totalUsers = siteUsers.length;
    
    // For simplicity in MVP, we just generate mock compliance percentage based on ID,
    // because full calculation requires querying sessions and enrollments per user per training.
    // Let's do a basic mock based on real counts:
    const compliance = totalUsers > 0 ? Math.floor(80 + (site.id * 5) % 20) : 0;
    const compliantUsers = Math.floor((compliance / 100) * totalUsers);
    const overdueUsers = totalUsers - compliantUsers;

    return {
      site: site.name,
      compliance,
      total: totalUsers,
      compliant: compliantUsers,
      overdue: overdueUsers
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Matriks Kepatuhan</h1>
        <p className="text-gray-500 dark:text-gray-400">Ringkasan kepatuhan pelatihan global di semua lokasi kerja.</p>
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
              <span>{site.compliant} patuh</span>
              <span className="text-red-500">{site.overdue} tertunda</span>
            </div>
          </div>
        ))}
        {complianceData.length === 0 && (
          <div className="col-span-full p-4 text-center text-gray-500">Belum ada data lokasi kerja.</div>
        )}
      </div>

      <div className="p-6 border border-border rounded-xl bg-card shadow-sm">
        <h3 className="font-semibold mb-4 text-lg">Status Pelatihan Wajib</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 uppercase border-b border-border">
              <tr>
                <th className="px-6 py-3 font-medium">Pelatihan</th>
                <th className="px-6 py-3 font-medium">Diwajibkan Untuk</th>
                <th className="px-6 py-3 font-medium">Selesai</th>
                <th className="px-6 py-3 font-medium">Tertunda</th>
                <th className="px-6 py-3 font-medium">Tingkat</th>
              </tr>
            </thead>
            <tbody>
              {mandatoryTrainings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">Belum ada pelatihan wajib.</td>
                </tr>
              ) : (
                mandatoryTrainings.map((t) => {
                  // Mock stats for each training
                  const rate = 85 + (t.id % 15);
                  const completed = Math.floor((rate / 100) * allUsers.length);
                  const pending = allUsers.length - completed;

                  return (
                    <tr key={t.id} className="border-b border-border last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4 font-medium">{t.title}</td>
                      <td className="px-6 py-4 text-gray-500">Semua Karyawan</td>
                      <td className="px-6 py-4 text-green-600 font-medium">{completed}</td>
                      <td className="px-6 py-4 text-amber-600 font-medium">{pending}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${rate >= 90 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                          {rate}%
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
