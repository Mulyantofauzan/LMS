import { auth } from "@/auth";
import { db } from "@/db";
import { certificates, trainings, users } from "@/db/schema";
import { like, or } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Award, BookOpen, Search, Users } from "lucide-react";

export default async function DashboardSearchPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const params = await searchParams;
  const q = params?.q?.trim() ?? '';

  const [matchingUsers, matchingTrainings, matchingCertificates] = q
    ? await Promise.all([
        db.select({ id: users.id, name: users.name, email: users.email, role: users.role })
          .from(users)
          .where(or(like(users.name, `%${q}%`), like(users.email, `%${q}%`)))
          .limit(8),
        db.select({ id: trainings.id, title: trainings.title, category: trainings.category, type: trainings.type })
          .from(trainings)
          .where(or(like(trainings.title, `%${q}%`), like(trainings.category, `%${q}%`)))
          .limit(8),
        db.select({ certNumber: certificates.certNumber, issueDate: certificates.issueDate })
          .from(certificates)
          .where(like(certificates.certNumber, `%${q}%`))
          .limit(8),
      ])
    : [[], [], []];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Search</h1>
        <p className="text-gray-500 dark:text-gray-400">Hasil pencarian untuk pengguna, pelatihan, dan sertifikat.</p>
      </div>

      <form className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input name="q" defaultValue={q} autoFocus placeholder="Ketik kata kunci..." className="w-full h-11 pl-10 pr-4 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
      </form>

      {!q ? (
        <div className="p-8 border border-dashed border-border rounded-xl bg-card text-center text-sm text-gray-500">
          Masukkan kata kunci untuk mulai mencari.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <section className="border border-border rounded-xl bg-card p-5">
            <h2 className="font-semibold mb-4 flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Pengguna</h2>
            <div className="space-y-3">
              {matchingUsers.length === 0 ? <p className="text-sm text-gray-500">Tidak ada hasil.</p> : matchingUsers.map((user) => (
                <Link key={user.id} href="/dashboard/super-admin/users" className="block rounded-md border border-border p-3 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <p className="font-medium text-sm">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email} · {user.role}</p>
                </Link>
              ))}
            </div>
          </section>

          <section className="border border-border rounded-xl bg-card p-5">
            <h2 className="font-semibold mb-4 flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" /> Pelatihan</h2>
            <div className="space-y-3">
              {matchingTrainings.length === 0 ? <p className="text-sm text-gray-500">Tidak ada hasil.</p> : matchingTrainings.map((training) => (
                <Link key={training.id} href="/dashboard/site-admin/trainings" className="block rounded-md border border-border p-3 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <p className="font-medium text-sm">{training.title}</p>
                  <p className="text-xs text-gray-500">{training.category || 'General'} · {training.type || 'offline'}</p>
                </Link>
              ))}
            </div>
          </section>

          <section className="border border-border rounded-xl bg-card p-5">
            <h2 className="font-semibold mb-4 flex items-center gap-2"><Award className="h-4 w-4 text-amber-500" /> Sertifikat</h2>
            <div className="space-y-3">
              {matchingCertificates.length === 0 ? <p className="text-sm text-gray-500">Tidak ada hasil.</p> : matchingCertificates.map((cert) => (
                <a key={cert.certNumber} href={`/api/certificate/${cert.certNumber}`} target="_blank" rel="noreferrer" className="block rounded-md border border-border p-3 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <p className="font-medium text-sm">{cert.certNumber}</p>
                  <p className="text-xs text-gray-500">{cert.issueDate ? cert.issueDate.toLocaleDateString('id-ID') : '-'}</p>
                </a>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
