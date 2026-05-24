import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== 'super-admin' && role !== 'admin') redirect('/dashboard');

  const allSettings = await db.select().from(settings);
  const initialSettings = allSettings.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {} as Record<string, string>);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Pengaturan Sistem</h1>
        <p className="text-gray-500 dark:text-gray-400">Konfigurasi pengaturan global untuk PST Learning Management System.</p>
      </div>

      <SettingsForm initialSettings={initialSettings} />
    </div>
  );
}
