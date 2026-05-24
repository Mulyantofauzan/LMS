import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { questionSets, trainingMaterials, trainingSessions, trainings } from "@/db/schema";
import { assignSessionQuestionSetForm, endTrainingSessionForm, startTrainingSessionForm } from "@/lib/actions/class-actions";
import { BookOpen, FileText, Play, Square, QrCode } from "lucide-react";
import Link from "next/link";
import { MaterialUploadForm } from "./material-upload-form";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import QRCode from "qrcode";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(value);
}

export default async function TrainerClassesPage() {
  const session = await auth();
  if ((session?.user as any)?.role !== 'trainer') redirect('/dashboard');
  const trainerId = Number((session?.user as any)?.id);

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
  .where(eq(trainingSessions.trainerId, trainerId))
  .orderBy(trainingSessions.startTime);

  const materials = await db.select().from(trainingMaterials).orderBy(trainingMaterials.uploadedAt);
  const allQuestionSets = await db.select().from(questionSets).where(eq(questionSets.trainerId, trainerId)).orderBy(questionSets.title);
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
  const qrBySession = Object.fromEntries(await Promise.all(classes.map(async (item) => {
    const links = {
      attendance: `${origin}/class/${item.id}/attendance`,
      pretest: `${origin}/class/${item.id}/pretest`,
      posttest: `${origin}/class/${item.id}/posttest`,
    };
    return [item.id, {
      links,
      images: {
        attendance: await QRCode.toDataURL(links.attendance),
        pretest: await QRCode.toDataURL(links.pretest),
        posttest: await QRCode.toDataURL(links.posttest),
      },
    }];
  })));

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
            <p className="text-gray-500 mb-2">Belum ada kelas.</p>
            <p className="text-sm text-gray-400">Buat pelatihan pertama dari dashboard trainer.</p>
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
                        <form action={assignSessionQuestionSetForm} className="flex gap-2 justify-end">
                          <input type="hidden" name="sessionId" value={t.id} />
                          <select name="questionSetId" defaultValue={t.questionSetId ?? ''} className="h-9 min-w-0 flex-1 px-3 rounded-md border border-border bg-background text-sm">
                            <option value="">Pilih bank soal</option>
                            {(questionSetsByTraining[t.trainingId] ?? []).map((set) => (
                              <option key={set.id} value={set.id}>{set.title}</option>
                            ))}
                          </select>
                          <button type="submit" className="px-3 py-2 rounded-md border border-border text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800">Simpan</button>
                        </form>
                        <div className="flex flex-wrap justify-end gap-2">
                          <form action={startTrainingSessionForm}>
                            <input type="hidden" name="sessionId" value={t.id} />
                            <button type="submit" disabled={t.status === 'active'} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                              <Play className="h-4 w-4" />
                              Mulai
                            </button>
                          </form>
                          <form action={endTrainingSessionForm}>
                            <input type="hidden" name="sessionId" value={t.id} />
                            <button type="submit" disabled={t.status === 'ended'} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                              <Square className="h-4 w-4" />
                              Akhiri
                            </button>
                          </form>
                          <Link href={`/dashboard/trainer/questions?trainingId=${t.trainingId}`} className="px-3 py-2 rounded-md border border-border text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800">Kelola Soal</Link>
                        </div>
                        {t.status === 'active' && (
                          <div className="grid grid-cols-3 gap-2 rounded-lg border border-border p-2 bg-background">
                            {(['attendance', 'pretest', 'posttest'] as const).map((mode) => (
                              <a key={mode} href={qrBySession[t.id].links[mode]} target="_blank" rel="noreferrer" className="text-center text-[11px] font-medium text-gray-600 hover:text-primary">
                                <img src={qrBySession[t.id].images[mode]} alt={`QR ${mode}`} className="w-full aspect-square object-contain" />
                                <span className="inline-flex items-center gap-1"><QrCode className="h-3 w-3" />{mode}</span>
                              </a>
                            ))}
                          </div>
                        )}
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
