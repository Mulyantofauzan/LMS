import { auth } from "@/auth";
import { db } from "@/db";
import { certificates, enrollments, trainingMaterials, trainingSessions, trainings, users } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import { BookOpen, Award, CheckCircle2 } from "lucide-react";

type SessionUser = {
  id?: string | number | null;
  role?: string | null;
};

export default async function TraineeDashboard() {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  if (user?.role !== 'trainee') {
    redirect('/dashboard');
  }
  const traineeId = Number(user.id);

  const enrolledTrainings = await db.select({
    id: enrollments.id,
    status: enrollments.status,
    trainingId: trainings.id,
    trainingTitle: trainings.title,
    trainer: users.name,
  })
  .from(enrollments)
  .innerJoin(trainingSessions, eq(enrollments.sessionId, trainingSessions.id))
  .innerJoin(trainings, eq(trainingSessions.trainingId, trainings.id))
  .innerJoin(users, eq(trainingSessions.trainerId, users.id))
  .where(eq(enrollments.traineeId, traineeId));

  const attendedTrainingIds = [...new Set(enrolledTrainings.map((item) => item.trainingId))];
  const materials = attendedTrainingIds.length > 0
    ? await db.select().from(trainingMaterials)
      .where(and(
        inArray(trainingMaterials.trainingId, attendedTrainingIds),
        eq(trainingMaterials.approvalStatus, 'approved'),
      ))
      .orderBy(trainingMaterials.uploadedAt)
    : [];
  const materialsByTraining = materials.reduce<Record<number, typeof materials>>((acc, material) => {
    acc[material.trainingId] ??= [];
    acc[material.trainingId].push(material);
    return acc;
  }, {});

  const myCertificates = await db.select({
    certNumber: certificates.certNumber,
    issueDate: certificates.issueDate,
    trainingTitle: trainings.title,
  })
  .from(certificates)
  .innerJoin(trainings, eq(certificates.trainingId, trainings.id))
  .where(eq(certificates.userId, traineeId));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Pembelajaran Saya</h1>
          <p className="text-gray-500 dark:text-gray-400">Akses materi training yang pernah Anda ikuti dan unduh sertifikat.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="p-6 border border-border rounded-xl shadow-sm bg-card">
          <h3 className="font-semibold mb-4 text-xl flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary"/> Training Terdaftar</h3>
          <div className="space-y-4">
            {enrolledTrainings.length === 0 ? (
              <div className="p-6 border border-dashed border-border rounded-lg text-center text-sm text-gray-500">
                Belum ada kelas terdaftar.
              </div>
            ) : enrolledTrainings.map((item) => (
            <div key={item.id} className="p-4 border border-border rounded-lg bg-background hover:border-gray-300 transition-colors">
              <h4 className="font-bold text-lg mb-1">{item.trainingTitle}</h4>
              <p className="text-xs text-primary font-medium mb-3">Trainer: {item.trainer}</p>
              {item.status === 'completed' ? (
                <div className="flex items-center gap-2 mt-4 text-sm font-medium text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Selesai</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-4 text-sm font-medium text-blue-600">
                  <BookOpen className="h-4 w-4" />
                  <span>Terdaftar</span>
                </div>
              )}
              <div className="mt-4 pt-4 border-t border-border space-y-2">
                <p className="text-xs font-semibold uppercase text-gray-500">Materi Kelas</p>
                {(materialsByTraining[item.trainingId] ?? []).length === 0 ? (
                  <p className="text-xs text-gray-500">Belum ada materi untuk kelas ini.</p>
                ) : (materialsByTraining[item.trainingId] ?? []).map((material) => (
                  <a key={material.id} href={material.fileUrl} target="_blank" rel="noreferrer" className="block text-sm text-primary hover:underline">
                    {material.title} ({material.type.toUpperCase()})
                  </a>
                ))}
              </div>
            </div>
            ))}
          </div>
        </div>

        <div className="p-6 border border-border rounded-xl shadow-sm bg-card h-fit">
          <h3 className="font-semibold mb-4 text-xl flex items-center gap-2"><Award className="h-5 w-5 text-amber-500"/> Sertifikat Saya</h3>
          <div className="space-y-3">
            {myCertificates.length === 0 ? (
              <div className="p-6 border border-dashed border-border rounded-lg text-center text-sm text-gray-500">
                Belum ada sertifikat.
              </div>
            ) : myCertificates.map((cert) => (
            <div key={cert.certNumber} className="p-4 border border-border rounded-lg bg-background flex flex-col gap-3 hover:border-gray-300 transition-colors">
              <div>
                <h4 className="font-bold text-md text-foreground">{cert.trainingTitle}</h4>
                <p className="text-xs text-gray-500 mt-1">Terbit: {cert.issueDate ? cert.issueDate.toLocaleDateString('id-ID') : '-'}</p>
                <p className="text-xs text-gray-500">ID: {cert.certNumber}</p>
              </div>
              <a 
                href={`/api/certificate/${cert.certNumber}`}
                target="_blank" 
                rel="noreferrer"
                className="text-center w-full text-sm border border-primary text-primary px-4 py-2 rounded-md hover:bg-primary/10 font-medium transition-colors"
              >
                Unduh Sertifikat PDF
              </a>
            </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
