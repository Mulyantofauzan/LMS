import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { jobsites } from "@/db/schema";
import { Briefcase, Plus, MapPin } from "lucide-react";

export default async function JobsitesPage() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== 'super-admin' && role !== 'admin') redirect('/dashboard');

  const allJobsites = await db.select().from(jobsites);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Jobsite Management</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage all operational jobsites across the organization.</p>
        </div>
        <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md shadow-sm hover:bg-primary/90 text-sm font-medium transition-colors flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Jobsite
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {allJobsites.length === 0 ? (
          <>
            {[
              { name: "Site Alpha — Kalimantan", location: "East Kalimantan", employees: 342 },
              { name: "Site Bravo — Sulawesi", location: "South Sulawesi", employees: 218 },
              { name: "Site Charlie — Sumatra", location: "South Sumatra", employees: 485 },
            ].map((site, i) => (
              <div key={i} className="p-6 border border-border rounded-xl bg-card shadow-sm card-hover">
                <div className="flex items-start justify-between mb-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Briefcase className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-[10px] uppercase tracking-wider font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">Active</span>
                </div>
                <h3 className="font-bold text-lg">{site.name}</h3>
                <p className="text-sm text-gray-500 flex items-center gap-1 mt-1"><MapPin className="h-3 w-3" /> {site.location}</p>
                <div className="mt-4 pt-4 border-t border-border flex justify-between text-sm">
                  <span className="text-gray-500">{site.employees} employees</span>
                  <button className="text-primary font-medium hover:underline">Manage</button>
                </div>
              </div>
            ))}
          </>
        ) : (
          allJobsites.map((site) => (
            <div key={site.id} className="p-6 border border-border rounded-xl bg-card shadow-sm card-hover">
              <div className="flex items-start justify-between mb-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Briefcase className="h-5 w-5 text-primary" />
                </div>
                <span className="text-[10px] uppercase tracking-wider font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">Active</span>
              </div>
              <h3 className="font-bold text-lg">{site.name}</h3>
              <p className="text-sm text-gray-500 flex items-center gap-1 mt-1"><MapPin className="h-3 w-3" /> {site.location || 'No location set'}</p>
              <div className="mt-4 pt-4 border-t border-border flex justify-between text-sm">
                <span className="text-gray-500">Jobsite #{site.id}</span>
                <button className="text-primary font-medium hover:underline">Manage</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
