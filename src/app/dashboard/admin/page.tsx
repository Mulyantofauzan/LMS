import { db } from "@/db";
import { settings } from "@/db/schema";
import SettingsForm from "./settings-form";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function AdminDashboard() {
  const session = await auth();
  if ((session?.user as any)?.role !== 'admin') {
    redirect('/dashboard');
  }

  const allSettings = await db.select().from(settings);
  const settingsMap = allSettings.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {} as Record<string, string>);
  
  const heroTitle = settingsMap['heroTitle'] || "";
  const heroSubtitle = settingsMap['heroSubtitle'] || "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Admin Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400">Manage the system, users, and customize the landing page.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="p-6 border border-border rounded-xl shadow-sm bg-card text-card-foreground">
          <h3 className="font-semibold mb-4 text-xl">Landing Page Settings</h3>
          <SettingsForm heroTitle={heroTitle} heroSubtitle={heroSubtitle} />
        </div>
        <div className="p-6 border border-border rounded-xl shadow-sm bg-card text-card-foreground">
          <h3 className="font-semibold mb-2">User Management</h3>
          <p className="text-sm text-gray-500 mb-4">Add, edit, or remove Trainers and Trainees. (Coming soon)</p>
          <button className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 font-medium w-full sm:w-auto opacity-50 cursor-not-allowed">Manage Users</button>
        </div>
      </div>
    </div>
  );
}
