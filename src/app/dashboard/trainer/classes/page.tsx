import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { questionSets, trainingMaterials, trainingQuestionSets, trainingSessions, trainings } from "@/db/schema";
import { BookOpen, FileText } from "lucide-react";
import { MaterialUploadForm } from "./material-upload-form";
import { and, eq, inArray, ne } from "drizzle-orm";
import { headers } from "next/headers";
import { ClassSessionControls } from "./class-session-controls";

type SessionUser = {
  id?: string | number | null;
  role?: string | null;
};

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(value);
}

export default async function TrainerClassesPage() {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  if (user?.role !== 'trainer') redirect('/dashboard');
  const trainerId = Number(user.id);

  const headerList = await headers();
  const host = headerList.get('host') ?? '';
  const proto = headerList.get('x-forwarded-proto') ?? (host.includes('localhost') ? 'http' : 'https');
  const origin = process.env.NEXT_PUBLIC_APP_URL || `${proto}://${host}`;

  const classes = await db.select({
    id: trainingSessions.id,
    trainingId: trainings.id,
    title: trainings.title,
    category: trainings.category,
    type: trainings.type,
    startTime: trainingSessions.startTime,
    endTime: trainingSessions.endTime,
    location: trainingSessions.location,
    status: trainingSessions.status,
    questionSetId: trainingSessions.questionSetId,
  })
  .from(trainingSessions)
  .innerJoin(trainings, eq(trainingSessions.trainingId, trainings.id))
  .where(and(eq(trainingSessions.trainerId, trainerId), ne(trainingSessions.status, 'ended')))
  .orderBy(trainingSessions.startTime);

  const trainingIds = Array.from(new Set(classes.map((item) => item.trainingId)));
  const materials = trainingIds.length > 0
    ? await db.select().from(trainingMaterials)
      .where(and(
        inArray(trainingMaterials.trainingId, trainingIds),
        eq(trainingMaterials.approvalStatus, 'approved'),
      ))
      .orderBy(trainingMaterials.uploadedAt)
    : [];
  const allQuestionSets = trainingIds.length > 0
    ? await db.select({
      id: questionSets.id,
      trainingId: trainingQuestionSets.trainingId,
      title: questionSets.title,
    })
      .from(trainingQuestionSets)
      .innerJoin(questionSets, eq(trainingQuestionSets.questionSetId, questionSets.id))
      .where(and(
        inArray(trainingQuestionSets.trainingId, trainingIds),
        eq(trainingQuestionSets.approvalStatus, 'approved'),
        eq(questionSets.status, 'published'),
      ))
      .orderBy(questionSets.title)
    : [];
  const materialsByTraining = materials.reduce<Record<number, typeof materials>>((acc, item) => {
    acc[item.trainingId] ??= [];
    acc[item.trainingId].push(item);
    return acc;
  }, {});
  const questionSetsByTraining = allQuestionSets.reduce<Record<number, typeof allQuestionSets>>((acc, item) => {
    acc[item.trainingId] ??= [];
    acc[item.trainingId].push(item);
    return acc;
  }, {});
  const qrBySession = Object.fromEntries(classes.map((item) => {
    const links = {
      attendance: `${origin}/class/${item.id}/attendance`,
      pretest: `${origin}/class/${item.id}/pretest`,
      posttest: `${origin}/class/${item.id}/posttest`,
    };
    return [item.id, { links }];
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Kelas Saya</h1>
        <p className="text-gray-500 dark:text-gray-400">Kelola kelas, materi PDF/PPT/Video, dan bank soal.</p>
      </div>
      <div className="p-6 border border-border rounded-xl bg-card shadow-sm">
        {classes.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">Tidak ada kelas aktif atau terjadwal.</p>
            <p className="text-sm text-gray-400">Kelas yang sudah selesai otomatis pindah ke Riwayat Training.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 uppercase border-b border-border">
                <tr>
                  <th className="px-6 py-3 font-medium">Pelatihan</th>
                  <th className="px-6 py-3 font-medium">Kategori</th>
                  <th className="px-6 py-3 font-medium">Tipe</th>
                  <th className="px-6 py-3 font-medium">Materi</th>
                  <th className="px-6 py-3 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {classes.map((t) => (
                  <tr key={t.id} className="border-b border-border last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium">{t.title}</div>
                      <div className="text-xs text-gray-500">{formatDate(t.startTime)} - {formatDate(t.endTime)}{t.location ? ` · ${t.location}` : ''}</div>
                      <div className="mt-2 inline-flex text-[10px] uppercase tracking-wider font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{t.status}</div>
                    </td>
                    <td className="px-6 py-4"><span className="text-[10px] uppercase tracking-wider font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{t.category || 'General'}</span></td>
                    <td className="px-6 py-4 text-gray-500 capitalize">{t.type || 'offline'}</td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {(materialsByTraining[t.trainingId] ?? []).length === 0 ? (
                          <span className="text-xs text-gray-500">Belum ada materi</span>
                        ) : (materialsByTraining[t.trainingId] ?? []).map((material) => (
                          <a key={material.id} href={material.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-primary hover:underline">
                            <FileText className="h-3.5 w-3.5" />
                            {material.title}
                          </a>
                        ))}
                      </div>
                      <MaterialUploadForm trainingId={t.trainingId} />
                    </td>
                    <td className="px-6 py-4 min-w-[280px]">
                      <div className="space-y-3">
                        <ClassSessionControls
                          sessionId={t.id}
                          trainingId={t.trainingId}
                          trainingTitle={t.title}
                          status={t.status}
                          selectedQuestionSetId={t.questionSetId}
                          questionSets={(questionSetsByTraining[t.trainingId] ?? []).map((set) => ({ id: set.id, title: set.title }))}
                          qr={qrBySession[t.id]}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
