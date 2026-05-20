import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Award } from "lucide-react";

export default async function SiteCertificatesPage() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== 'site-admin' && role !== 'admin') redirect('/dashboard');

  const certs = [
    { name: "Ahmad K.", training: "Basic Safety Induction", certNo: "CERT-2026-001", issued: "Jan 15, 2026", expiry: "Jan 15, 2027", status: "valid" },
    { name: "Siti R.", training: "Working at Heights", certNo: "CERT-2026-034", issued: "Feb 20, 2026", expiry: "Feb 20, 2027", status: "valid" },
    { name: "Budi P.", training: "Hazmat Handling", certNo: "CERT-2026-089", issued: "Mar 10, 2026", expiry: "Jun 10, 2026", status: "expiring" },
    { name: "Dewi L.", training: "First Aid & CPR", certNo: "CERT-2025-421", issued: "Dec 01, 2025", expiry: "Apr 01, 2026", status: "expired" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Site Certificates</h1>
        <p className="text-gray-500 dark:text-gray-400">Track all issued certificates and their expiry status.</p>
      </div>
      <div className="p-6 border border-border rounded-xl bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 uppercase border-b border-border">
              <tr>
                <th className="px-6 py-3 font-medium">Employee</th>
                <th className="px-6 py-3 font-medium">Training</th>
                <th className="px-6 py-3 font-medium">Cert No.</th>
                <th className="px-6 py-3 font-medium">Issued</th>
                <th className="px-6 py-3 font-medium">Expiry</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {certs.map((c, i) => (
                <tr key={i} className="border-b border-border last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 font-medium">{c.name}</td>
                  <td className="px-6 py-4">{c.training}</td>
                  <td className="px-6 py-4 text-gray-500 font-mono text-xs">{c.certNo}</td>
                  <td className="px-6 py-4 text-gray-500">{c.issued}</td>
                  <td className="px-6 py-4 text-gray-500">{c.expiry}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full ${
                      c.status === 'valid' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      c.status === 'expiring' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>{c.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
