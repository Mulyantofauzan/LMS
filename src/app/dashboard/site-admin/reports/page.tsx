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
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Laporan Site</h1>
        <p className="text-gray-500 dark:text-gray-400">Unduh laporan kepatuhan, absensi, sertifikat, dan matriks training site.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[
          { title: "Laporan Kepatuhan Site", desc: "Status penyelesaian training dan compliance untuk site.", format: "CSV", href: "/api/reports/compliance.csv" },
          { title: "Laporan Absensi Site", desc: "Data absensi seluruh sesi training di site.", format: "CSV", href: "/api/reports/attendance.csv" },
          { title: "Matriks Training Karyawan", desc: "Relasi karyawan, training, dan status penyelesaian.", format: "CSV", href: "/api/reports/training-matrix.csv" },
          { title: "Sertifikat Kedaluwarsa", desc: "Daftar sertifikat yang perlu diperbarui.", format: "CSV", href: "/api/reports/certificate-expiry.csv" },
          { title: "Performa Trainer", desc: "Jumlah sesi, nilai ujian, dan performa per trainer.", format: "CSV", href: "/api/reports/trainer-performance.csv" },
          { title: "Audit Trail", desc: "Log aktivitas sistem dalam rentang data tersedia.", format: "CSV", href: "/api/reports/audit.csv" },
        ].map((r, i) => (
          <div key={i} className="p-6 border border-border rounded-xl bg-card shadow-sm card-hover">
            <div className="flex items-start justify-between mb-3">
              <FileBarChart className="h-8 w-8 text-primary" />
              <span className="text-[10px] uppercase tracking-wider font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{r.format}</span>
            </div>
            <h3 className="font-bold mb-2">{r.title}</h3>
            <p className="text-sm text-gray-500 mb-4">{r.desc}</p>
            <Link href={r.href} className="block text-center w-full bg-background border border-border text-foreground px-4 py-2 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium transition-colors">Unduh Laporan</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
