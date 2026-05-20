import { db } from "@/db";
import { trainings } from "@/db/schema";
import { auth } from "@/auth";
import TrainingForm from "./class-form";
import { redirect } from "next/navigation";
import { BookOpen, Plus } from "lucide-react";

export default async function TrainerDashboard() {
  const session = await auth();
  if ((session?.user as any)?.role !== 'trainer') {
    redirect('/dashboard');
  }

  const allTrainings = await db.select().from(trainings);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Trainer Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage your trainings, track attendance, and generate reports.</p>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-3">
        <div className="p-6 border border-border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-gray-500">Total Trainings</h3>
            <BookOpen className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold">{allTrainings.length}</div>
        </div>
        <div className="p-6 border border-border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-gray-500">Active Sessions</h3>
            <Plus className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold">0</div>
          <p className="text-xs text-gray-500 mt-1">No active sessions</p>
        </div>
        <div className="p-6 border border-border rounded-xl bg-card shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-gray-500">Upcoming</h3>
            <BookOpen className="h-4 w-4 text-gray-400" />
          </div>
          <div className="text-2xl font-bold">0</div>
          <p className="text-xs text-gray-500 mt-1">This week</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="p-6 border border-border rounded-xl shadow-sm bg-card text-card-foreground">
          <h3 className="font-semibold mb-4 text-xl flex items-center gap-2"><Plus className="h-5 w-5 text-primary" /> Create New Training</h3>
          <TrainingForm />
        </div>
        
        <div className="p-6 border border-border rounded-xl shadow-sm bg-card text-card-foreground flex flex-col max-h-[500px]">
          <h3 className="font-semibold mb-4 text-xl flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" /> My Trainings</h3>
          {allTrainings.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-gray-500">You haven&apos;t created any trainings yet.</p>
            </div>
          ) : (
            <ul className="space-y-3 flex-1 overflow-y-auto pr-2">
              {allTrainings.map(t => (
                <li key={t.id} className="p-3 border border-border rounded-md bg-background hover:border-gray-300 transition-colors">
                  <div className="flex items-start justify-between">
                    <h4 className="font-medium text-sm">{t.title}</h4>
                    {t.category && <span className="text-[10px] uppercase tracking-wider font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{t.category}</span>}
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2 mt-1">{t.description}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
