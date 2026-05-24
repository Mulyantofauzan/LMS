import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { jobsites, users } from "@/db/schema";
import { Briefcase, MapPin } from "lucide-react";
import { JobsiteForm } from "./jobsite-form";
import { sql, eq } from "drizzle-orm";
import { JobsiteCardActions } from "./jobsite-card-actions";

export default async function JobsitesPage() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== 'super-admin' && role !== 'admin') redirect('/dashboard');

  // Fetch jobsites and their employee count
  const allJobsitesData = await db.select({
    id: jobsites.id,
    name: jobsites.name,
    location: jobsites.location,
    employees: sql<number>`count(${users.id})`
  })
  .from(jobsites)
  .leftJoin(users, eq(users.jobsiteId, jobsites.id))
  .groupBy(jobsites.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Manajemen Lokasi Kerja</h1>
          <p className="text-gray-500 dark:text-gray-400">Kelola semua lokasi kerja operasional di seluruh organisasi.</p>
        </div>
        <JobsiteForm />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {allJobsitesData.length === 0 ? (
          <div className="col-span-full p-8 text-center text-gray-500 border border-dashed rounded-xl">
            Belum ada lokasi kerja yang ditambahkan.
          </div>
        ) : (
          allJobsitesData.map((site) => (
            <div key={site.id} className="p-6 border border-border rounded-xl bg-card shadow-sm card-hover">
              <div className="flex items-start justify-between mb-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Briefcase className="h-5 w-5 text-primary" />
                </div>
                <span className="text-[10px] uppercase tracking-wider font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">Aktif</span>
              </div>
              <h3 className="font-bold text-lg">{site.name}</h3>
              <p className="text-sm text-gray-500 flex items-center gap-1 mt-1"><MapPin className="h-3 w-3" /> {site.location || 'Lokasi tidak diatur'}</p>
              <div className="mt-4 pt-4 border-t border-border flex justify-between text-sm">
                <span className="text-gray-500">{site.employees} karyawan</span>
                <JobsiteCardActions site={site} canDelete={Number(site.employees) === 0} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
