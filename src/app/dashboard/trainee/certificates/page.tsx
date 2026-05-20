import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Award, Download } from "lucide-react";

export default async function TraineeCertificatesPage() {
  const session = await auth();
  if ((session?.user as any)?.role !== 'trainee') redirect('/dashboard');

  const certs = [
    { training: "Basic Safety Induction", certNo: "CERT-2026-001", issued: "Jan 15, 2026", expiry: "Jan 15, 2027", status: "valid" },
    { training: "Working at Heights — Level 1", certNo: "CERT-2026-034", issued: "Feb 20, 2026", expiry: "Feb 20, 2027", status: "valid" },
    { training: "Hazardous Materials Handling", certNo: "CERT-2026-089", issued: "Mar 10, 2026", expiry: "Mar 10, 2027", status: "valid" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">My Certificates</h1>
        <p className="text-gray-500 dark:text-gray-400">Download and verify your training certificates.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {certs.map((c, i) => (
          <div key={i} className="p-6 border border-border rounded-xl bg-card shadow-sm card-hover">
            <div className="flex items-start justify-between mb-3">
              <Award className="h-8 w-8 text-amber-500" />
              <span className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full ${
                c.status === 'valid' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}>{c.status}</span>
            </div>
            <h3 className="font-bold text-lg mb-1">{c.training}</h3>
            <p className="text-xs text-gray-500 font-mono mb-1">ID: {c.certNo}</p>
            <p className="text-xs text-gray-500 mb-1">Issued: {c.issued}</p>
            <p className="text-xs text-gray-500 mb-4">Expires: {c.expiry}</p>
            <a 
              href={`/api/certificate/${c.certNo}`}
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 text-sm font-medium transition-colors"
            >
              <Download className="h-4 w-4" /> Download PDF
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
