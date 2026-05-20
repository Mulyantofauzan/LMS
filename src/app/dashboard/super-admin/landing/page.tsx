import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { settings } from "@/db/schema";
import LandingForm from "./landing-form";
import { Globe } from "lucide-react";

export default async function LandingPageCustomizer() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== 'super-admin' && role !== 'admin') redirect('/dashboard');

  const allSettings = await db.select().from(settings);
  const settingsMap = allSettings.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {} as Record<string, string>);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Globe className="h-8 w-8 text-primary" />
            Landing Page Customizer
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Customize your public landing page content, branding, and features display.</p>
        </div>
        <a href="/" target="_blank" rel="noreferrer" className="bg-background border border-border text-foreground px-4 py-2 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium transition-colors">
          View Live Page ↗
        </a>
      </div>

      <LandingForm settings={settingsMap} />
    </div>
  );
}
