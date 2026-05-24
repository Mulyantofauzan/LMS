import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FileBarChart } from "lucide-react";

export default async function SiteReportsPage() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== 'site-admin' && role !== 'admin') redirect('/dashboard');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Site Reports</h1>
        <p className="text-gray-500 dark:text-gray-400">Generate and download training compliance reports.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[
          { title: "Monthly Compliance Report", desc: "Training completion rates and compliance status for the current month.", format: "CSV", href: "/api/reports/compliance.csv" },
          { title: "Certificate Expiry Report", desc: "List of all certificates expiring within the next 30/60/90 days.", format: "CSV", href: "/api/reports/certificate-expiry.csv" },
          { title: "Training Attendance Summary", desc: "Attendance records for all sessions in the selected date range.", format: "CSV", href: "/api/reports/attendance.csv" },
          { title: "Employee Training Matrix", desc: "Cross-reference of employees vs required trainings with completion status.", format: "CSV", href: "/api/reports/training-matrix.csv" },
          { title: "Trainer Performance Report", desc: "Session count, average evaluation scores, and trainee pass rates per trainer.", format: "CSV", href: "/api/reports/trainer-performance.csv" },
          { title: "Audit Trail Export", desc: "Full system audit log for the selected date range.", format: "CSV", href: "/api/reports/audit.csv" },
        ].map((r, i) => (
          <div key={i} className="p-6 border border-border rounded-xl bg-card shadow-sm card-hover">
            <div className="flex items-start justify-between mb-3">
              <FileBarChart className="h-8 w-8 text-primary" />
              <span className="text-[10px] uppercase tracking-wider font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{r.format}</span>
            </div>
            <h3 className="font-bold mb-2">{r.title}</h3>
            <p className="text-sm text-gray-500 mb-4">{r.desc}</p>
            <Link href={r.href} className="block text-center w-full bg-background border border-border text-foreground px-4 py-2 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium transition-colors">Generate Report</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
