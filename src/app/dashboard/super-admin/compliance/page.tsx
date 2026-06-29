import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { getSessionUser } from "@/lib/session-user";
import { getComplianceStats } from "@/lib/compliance-stats";
import { connection } from "next/server";

export default async function CompliancePage() {
  await connection();
  const session = await auth();
  const role = getSessionUser(session?.user)?.role;
  if (role !== 'super-admin' && role !== 'admin') redirect('/dashboard');

  const complianceStats = await getComplianceStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Matriks Kepatuhan</h1>
        <p className="text-gray-500 dark:text-gray-400">Ringkasan kepatuhan pelatihan global di semua lokasi kerja.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {complianceStats.sites.map((site) => (
          <div key={site.id} className="p-6 border border-border rounded-xl bg-card shadow-sm card-hover">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-bold">{site.name}</h3>
              {site.percentage >= 90 ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              )}
            </div>
            <div className="text-3xl font-extrabold mb-2">{site.percentage}%</div>
            <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2 mb-3">
              <div 
                className={`h-2 rounded-full ${site.percentage >= 90 ? 'bg-green-500' : site.percentage >= 80 ? 'bg-amber-500' : 'bg-red-500'}`}
                style={{ width: `${site.percentage}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>{site.fulfilled} terpenuhi</span>
              <span className="text-red-500">{site.missing} gap</span>
            </div>
            <p className="mt-2 text-xs text-gray-400">{site.users} karyawan aktif · {site.total} kebutuhan mandatory</p>
          </div>
        ))}
        {complianceStats.sites.length === 0 && (
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
                <th className="px-6 py-3 font-medium">Penugasan TNA</th>
                <th className="px-6 py-3 font-medium">Selesai</th>
                <th className="px-6 py-3 font-medium">Tertunda</th>
                <th className="px-6 py-3 font-medium">Tingkat</th>
              </tr>
            </thead>
            <tbody>
              {complianceStats.trainings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">Belum ada pelatihan wajib.</td>
                </tr>
              ) : (
                complianceStats.trainings.map((training) => (
                    <tr key={training.id} className="border-b border-border last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4 font-medium">{training.title}</td>
                      <td className="px-6 py-4 text-gray-500">{training.total} kebutuhan mandatory</td>
                      <td className="px-6 py-4 text-green-600 font-medium">{training.fulfilled}</td>
                      <td className="px-6 py-4 text-amber-600 font-medium">{training.missing}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${training.percentage >= 90 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                          {training.percentage}%
                        </span>
                      </td>
                    </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
