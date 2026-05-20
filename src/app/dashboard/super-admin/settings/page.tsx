import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { Settings } from "lucide-react";

export default async function SettingsPage() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== 'super-admin' && role !== 'admin') redirect('/dashboard');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">System Settings</h1>
        <p className="text-gray-500 dark:text-gray-400">Configure global settings for PST Learning Management System.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="p-6 border border-border rounded-xl bg-card shadow-sm">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><Settings className="h-5 w-5 text-primary" /> General Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">System Name</label>
              <input type="text" defaultValue="PST Learning Management System" className="w-full rounded-md border border-border px-3 py-2 bg-background text-foreground text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Compliance Threshold (%)</label>
              <input type="number" defaultValue="90" className="w-full rounded-md border border-border px-3 py-2 bg-background text-foreground text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Certificate Expiry Warning (days)</label>
              <input type="number" defaultValue="30" className="w-full rounded-md border border-border px-3 py-2 bg-background text-foreground text-sm" />
            </div>
            <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 text-sm font-medium transition-colors w-full">Save Settings</button>
          </div>
        </div>

        <div className="p-6 border border-border rounded-xl bg-card shadow-sm">
          <h3 className="font-semibold text-lg mb-4">Email Notifications</h3>
          <div className="space-y-3">
            {[
              { label: "Certificate expiry reminders", enabled: true },
              { label: "Training enrollment notifications", enabled: true },
              { label: "Compliance threshold alerts", enabled: true },
              { label: "New user registration emails", enabled: false },
              { label: "Weekly compliance digest", enabled: true },
            ].map((n, i) => (
              <div key={i} className="flex items-center justify-between p-3 border border-border rounded-lg bg-background">
                <span className="text-sm font-medium">{n.label}</span>
                <div className={`w-10 h-5 rounded-full cursor-pointer transition-colors ${n.enabled ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-700'} relative`}>
                  <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${n.enabled ? 'left-[22px]' : 'left-0.5'}`}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
