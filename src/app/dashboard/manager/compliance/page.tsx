import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { certificates, trainings, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { CheckCircle2, XCircle } from "lucide-react";

export default async function TeamCompliancePage() {
  const session = await auth();
  if ((session?.user as any)?.role !== 'manager') redirect('/dashboard');
  const manager = await db.select({ jobsiteId: users.jobsiteId })
    .from(users)
    .where(eq(users.id, Number((session?.user as any)?.id)))
    .get();

  const teamUsers = manager?.jobsiteId
    ? await db.select({ id: users.id, name: users.name, position: users.position }).from(users).where(eq(users.jobsiteId, manager.jobsiteId)).orderBy(users.name)
    : [];
  const requiredTrainings = manager?.jobsiteId
    ? await db.select({ id: trainings.id }).from(trainings).where(eq(trainings.jobsiteId, manager.jobsiteId))
    : [];
  const certRows = await db.select({ userId: certificates.userId, trainingId: certificates.trainingId }).from(certificates);
  const requiredIds = new Set(requiredTrainings.map((training) => training.id));
  const teamMembers = teamUsers
    .filter((user) => user.id !== Number((session?.user as any)?.id))
    .map((user) => {
      const completed = certRows.filter((cert) => cert.userId === user.id && requiredIds.has(cert.trainingId)).length;
      const trainingsRequired = requiredIds.size;
      return {
        ...user,
        trainings: trainingsRequired,
        completed,
        status: trainingsRequired > 0 && completed >= trainingsRequired ? 'compliant' : 'non-compliant',
      };
    });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Kepatuhan Tim</h1>
        <p className="text-gray-500 dark:text-gray-400">Pantau status kepatuhan training anggota tim di site Anda.</p>
      </div>
      <div className="p-6 border border-border rounded-xl bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 uppercase border-b border-border">
              <tr>
                <th className="px-6 py-3 font-medium">Anggota</th>
                <th className="px-6 py-3 font-medium">Posisi</th>
                <th className="px-6 py-3 font-medium">Wajib</th>
                <th className="px-6 py-3 font-medium">Selesai</th>
                <th className="px-6 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {teamMembers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Belum ada anggota tim di site ini.</td>
                </tr>
              ) : teamMembers.map((m) => (
                <tr key={m.id} className="border-b border-border last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 font-medium flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">{m.name.charAt(0)}</div>
                    {m.name}
                  </td>
                  <td className="px-6 py-4 text-gray-500">{m.position || '-'}</td>
                  <td className="px-6 py-4">{m.trainings}</td>
                  <td className="px-6 py-4">{m.completed}</td>
                  <td className="px-6 py-4">
                    {m.status === 'compliant' ? (
                      <span className="flex items-center gap-1 text-green-600 text-xs font-semibold"><CheckCircle2 className="h-3.5 w-3.5" /> Patuh</span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-600 text-xs font-semibold"><XCircle className="h-3.5 w-3.5" /> Belum Patuh</span>
                    )}
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
