'use client';

import { saveLandingSettings } from "./actions";
import { useTransition } from "react";
import { Save, Eye, Type, BarChart3, Megaphone, FileText, Palette } from "lucide-react";

interface LandingFormProps {
  settings: Record<string, string>;
}

export default function LandingForm({ settings: s }: LandingFormProps) {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      await saveLandingSettings(formData);
      alert('Landing page settings saved! Visit your homepage to see the changes.');
    });
  };

  return (
    <form action={handleSubmit} className="space-y-8">
      {/* Branding */}
      <section className="p-6 border border-border rounded-xl bg-card shadow-sm">
        <h3 className="font-bold text-lg mb-1 flex items-center gap-2"><Palette className="h-5 w-5 text-primary" /> Branding</h3>
        <p className="text-sm text-gray-500 mb-5">Customize your platform name and logo text.</p>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-1">Brand Name</label>
            <input type="text" name="brandName" defaultValue={s['brandName'] || 'PST Learning Management System'} className="w-full rounded-md border border-border px-3 py-2 bg-background text-foreground text-sm focus:ring-1 focus:ring-primary outline-none" />
            <p className="text-xs text-gray-400 mt-1">Displayed in header, sidebar, and footer</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Brand Short Name</label>
            <input type="text" name="brandShort" defaultValue={s['brandShort'] || 'PST'} maxLength={4} className="w-full rounded-md border border-border px-3 py-2 bg-background text-foreground text-sm focus:ring-1 focus:ring-primary outline-none" />
            <p className="text-xs text-gray-400 mt-1">Logo badge text (max 4 chars)</p>
          </div>
        </div>
      </section>

      {/* Hero Section */}
      <section className="p-6 border border-border rounded-xl bg-card shadow-sm">
        <h3 className="font-bold text-lg mb-1 flex items-center gap-2"><Type className="h-5 w-5 text-primary" /> Hero Section</h3>
        <p className="text-sm text-gray-500 mb-5">The first thing visitors see on your landing page.</p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Badge Text</label>
            <input type="text" name="heroBadge" defaultValue={s['heroBadge'] || 'Trusted by 50+ Industrial Companies'} className="w-full rounded-md border border-border px-3 py-2 bg-background text-foreground text-sm focus:ring-1 focus:ring-primary outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Hero Title</label>
            <input type="text" name="heroTitle" defaultValue={s['heroTitle'] || 'Empowering Industrial Workforce Through Smarter Training'} className="w-full rounded-md border border-border px-3 py-2 bg-background text-foreground text-sm focus:ring-1 focus:ring-primary outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Hero Subtitle</label>
            <textarea name="heroSubtitle" rows={3} defaultValue={s['heroSubtitle'] || 'PST Learning Management System helps mining and industrial companies manage training compliance, certifications, and workforce development across every jobsite — all in one platform.'} className="w-full rounded-md border border-border px-3 py-2 bg-background text-foreground text-sm focus:ring-1 focus:ring-primary outline-none" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="p-6 border border-border rounded-xl bg-card shadow-sm">
        <h3 className="font-bold text-lg mb-1 flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Features Section</h3>
        <p className="text-sm text-gray-500 mb-5">Highlight your platform capabilities (6 feature cards).</p>
        <div className="space-y-6">
          {[1,2,3,4,5,6].map((n) => {
            const defaults: Record<number, {icon: string, title: string, desc: string}> = {
              1: { icon: "🏗️", title: "Multi-Jobsite Management", desc: "Isolate data per jobsite. Super Admins oversee all sites while Site Admins manage their own operations independently." },
              2: { icon: "📋", title: "Training Compliance Matrix", desc: "Track mandatory and optional trainings per role. Get instant visibility into which employees are compliant or overdue." },
              3: { icon: "🎓", title: "Automated Certificates", desc: "Generate verifiable PDF certificates with QR codes instantly upon training completion. Track expiry and renewals." },
              4: { icon: "📊", title: "Real-time Analytics", desc: "Interactive dashboards with compliance charts, attendance trends, and training effectiveness metrics across all sites." },
              5: { icon: "✅", title: "Attendance & QR Check-in", desc: "Digital attendance tracking with manual or QR code-based check-in. Automatic late/absent flagging for compliance." },
              6: { icon: "🔐", title: "Role-Based Access Control", desc: "Five distinct roles — Super Admin, Site Admin, Manager, Trainer, and Trainee — each with precisely scoped permissions." },
            };
            const d = defaults[n];
            return (
              <div key={n} className="p-4 border border-border rounded-lg bg-background">
                <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">Feature {n}</p>
                <div className="grid gap-3 md:grid-cols-[80px_1fr]">
                  <div>
                    <label className="block text-xs font-medium mb-1">Icon</label>
                    <input type="text" name={`feature${n}Icon`} defaultValue={s[`feature${n}Icon`] || d.icon} maxLength={4} className="w-full rounded-md border border-border px-3 py-2 bg-background text-foreground text-sm text-center focus:ring-1 focus:ring-primary outline-none" />
                  </div>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs font-medium mb-1">Title</label>
                      <input type="text" name={`feature${n}Title`} defaultValue={s[`feature${n}Title`] || d.title} className="w-full rounded-md border border-border px-3 py-2 bg-background text-foreground text-sm focus:ring-1 focus:ring-primary outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Description</label>
                      <textarea name={`feature${n}Desc`} rows={2} defaultValue={s[`feature${n}Desc`] || d.desc} className="w-full rounded-md border border-border px-3 py-2 bg-background text-foreground text-sm focus:ring-1 focus:ring-primary outline-none" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Stats */}
      <section className="p-6 border border-border rounded-xl bg-card shadow-sm">
        <h3 className="font-bold text-lg mb-1 flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" /> Stats Section</h3>
        <p className="text-sm text-gray-500 mb-5">Showcase your impact numbers.</p>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            { n: 1, dv: "50+", dl: "Industrial Companies" },
            { n: 2, dv: "12K+", dl: "Active Trainees" },
            { n: 3, dv: "98.5%", dl: "Compliance Rate" },
            { n: 4, dv: "25K+", dl: "Certificates Issued" },
          ].map(({ n, dv, dl }) => (
            <div key={n} className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium mb-1">Value {n}</label>
                <input type="text" name={`stat${n}Value`} defaultValue={s[`stat${n}Value`] || dv} className="w-full rounded-md border border-border px-3 py-2 bg-background text-foreground text-sm focus:ring-1 focus:ring-primary outline-none" />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium mb-1">Label {n}</label>
                <input type="text" name={`stat${n}Label`} defaultValue={s[`stat${n}Label`] || dl} className="w-full rounded-md border border-border px-3 py-2 bg-background text-foreground text-sm focus:ring-1 focus:ring-primary outline-none" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="p-6 border border-border rounded-xl bg-card shadow-sm">
        <h3 className="font-bold text-lg mb-1 flex items-center gap-2"><Megaphone className="h-5 w-5 text-primary" /> Call to Action Section</h3>
        <p className="text-sm text-gray-500 mb-5">The bottom CTA banner on the landing page.</p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">CTA Title</label>
            <input type="text" name="ctaTitle" defaultValue={s['ctaTitle'] || 'Ready to Transform Your Training Compliance?'} className="w-full rounded-md border border-border px-3 py-2 bg-background text-foreground text-sm focus:ring-1 focus:ring-primary outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">CTA Subtitle</label>
            <textarea name="ctaSubtitle" rows={2} defaultValue={s['ctaSubtitle'] || 'Join 50+ industrial companies using PST Learning Management System to keep their workforce safe, certified, and compliant.'} className="w-full rounded-md border border-border px-3 py-2 bg-background text-foreground text-sm focus:ring-1 focus:ring-primary outline-none" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <section className="p-6 border border-border rounded-xl bg-card shadow-sm">
        <h3 className="font-bold text-lg mb-1 flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Footer</h3>
        <p className="text-sm text-gray-500 mb-5">Customize your footer description.</p>
        <div>
          <label className="block text-sm font-medium mb-1">Footer Description</label>
          <textarea name="footerDescription" rows={3} defaultValue={s['footerDescription'] || 'Enterprise Learning Management System for industrial and mining companies. Manage training compliance across all your jobsites.'} className="w-full rounded-md border border-border px-3 py-2 bg-background text-foreground text-sm focus:ring-1 focus:ring-primary outline-none" />
        </div>
      </section>

      {/* Actions */}
      <div className="flex items-center gap-4 sticky bottom-0 bg-background/95 backdrop-blur py-4 border-t border-border -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8">
        <button type="submit" disabled={isPending} className="bg-primary text-primary-foreground px-6 py-2.5 rounded-md hover:bg-primary/90 font-medium disabled:opacity-50 text-sm transition-colors flex items-center gap-2 shadow-sm">
          <Save className="h-4 w-4" />
          {isPending ? 'Saving...' : 'Save All Changes'}
        </button>
        <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-2 border border-border px-6 py-2.5 rounded-md text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          <Eye className="h-4 w-4" />
          Preview Landing Page
        </a>
      </div>
    </form>
  );
}
