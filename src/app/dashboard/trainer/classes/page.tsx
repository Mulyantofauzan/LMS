import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { trainingMaterials, trainings } from "@/db/schema";
import { BookOpen, FileText } from "lucide-react";
import Link from "next/link";
import { MaterialUploadForm } from "./material-upload-form";

export default async function TrainerClassesPage() {
  const session = await auth();
  if ((session?.user as any)?.role !== 'trainer') redirect('/dashboard');

  const allTrainings = await db.select().from(trainings).orderBy(trainings.title);
  const materials = await db.select().from(trainingMaterials).orderBy(trainingMaterials.uploadedAt);
  const materialsByTraining = materials.reduce<Record<number, typeof materials>>((acc, item) => {
    acc[item.trainingId] ??= [];
    acc[item.trainingId].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Kelas Saya</h1>
        <p className="text-gray-500 dark:text-gray-400">Kelola kelas, materi PDF/PPT/Video, dan bank soal.</p>
      </div>
      <div className="p-6 border border-border rounded-xl bg-card shadow-sm">
        {allTrainings.length === 0 ? (
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
                {allTrainings.map((t) => (
                  <tr key={t.id} className="border-b border-border last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium">{t.title}</td>
                    <td className="px-6 py-4"><span className="text-[10px] uppercase tracking-wider font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{t.category || 'General'}</span></td>
                    <td className="px-6 py-4 text-gray-500 capitalize">{t.type || 'offline'}</td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {(materialsByTraining[t.id] ?? []).length === 0 ? (
                          <span className="text-xs text-gray-500">Belum ada materi</span>
                        ) : (materialsByTraining[t.id] ?? []).map((material) => (
                          <a key={material.id} href={material.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-primary hover:underline">
                            <FileText className="h-3.5 w-3.5" />
                            {material.title}
                          </a>
                        ))}
                      </div>
                      <MaterialUploadForm trainingId={t.id} />
                    </td>
                    <td className="px-6 py-4 text-right"><Link href={`/dashboard/trainer/questions?trainingId=${t.id}`} className="text-primary font-medium hover:underline text-sm">Kelola Soal</Link></td>
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
