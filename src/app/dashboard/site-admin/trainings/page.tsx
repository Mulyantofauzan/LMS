import { db } from "@/db";
import { trainings } from "@/db/schema";
import { createTraining } from "./actions";
import { BookOpen, Plus } from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { TrainingRowActions } from "./training-row-actions";

export default async function TrainingsPage() {
  const session = await auth();
  if ((session?.user as any)?.role !== 'site-admin' && (session?.user as any)?.role !== 'super-admin') {
    redirect('/dashboard');
  }

  const allTrainings = await db.select().from(trainings);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Training Management</h1>
          <p className="text-gray-500 dark:text-gray-400">Create and manage training programs for your site.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1 border border-border bg-card rounded-xl shadow-sm p-6 h-fit">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Plus className="h-5 w-5"/> Create Training</h3>
          <form action={createTraining} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Training Title</label>
              <input type="text" name="title" required className="w-full rounded-md border border-border px-3 py-2 bg-background" placeholder="e.g. Forklift Safety"/>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea name="description" rows={3} className="w-full rounded-md border border-border px-3 py-2 bg-background" placeholder="Training details..."/>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select name="category" className="w-full rounded-md border border-border px-3 py-2 bg-background">
                  <option value="safety">Safety</option>
                  <option value="technical">Technical</option>
                  <option value="compliance">Compliance</option>
                  <option value="soft_skills">Soft Skills</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select name="type" className="w-full rounded-md border border-border px-3 py-2 bg-background">
                  <option value="offline">Offline</option>
                  <option value="online">Online</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2 pb-2">
              <input type="checkbox" name="isMandatory" id="isMandatory" className="rounded border-border text-primary w-4 h-4"/>
              <label htmlFor="isMandatory" className="text-sm font-medium">Mandatory for all site employees</label>
            </div>
            <button type="submit" className="w-full bg-primary text-primary-foreground font-medium py-2 rounded-md hover:bg-primary/90 transition-colors">Save Training</button>
          </form>
        </div>

        <div className="md:col-span-2 border border-border bg-card rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><BookOpen className="h-5 w-5"/> Training Directory</h3>
          {allTrainings.length === 0 ? (
            <div className="text-center py-12 text-gray-500 border border-dashed border-border rounded-lg">
              No trainings created yet.
            </div>
          ) : (
            <div className="space-y-3">
              {allTrainings.map(t => (
                <div key={t.id} className="p-4 border border-border rounded-lg bg-background flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-gray-300 transition-colors">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold">{t.title}</h4>
                      {t.isMandatory && <span className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">Mandatory</span>}
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-1">{t.description}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs font-medium bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-600 dark:text-gray-300 capitalize">{t.category?.replace('_', ' ')}</span>
                    <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded capitalize">{t.type}</span>
                    <TrainingRowActions training={t} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
