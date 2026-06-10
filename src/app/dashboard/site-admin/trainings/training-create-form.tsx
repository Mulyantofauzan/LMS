'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2, Upload } from 'lucide-react';
import { createTraining } from './actions';

type UploadKind = 'material' | 'template';

async function uploadAsset(trainingId: number, file: File, kind: UploadKind) {
  const response = await fetch(`/api/uploads/training-asset?trainingId=${trainingId}&kind=${kind}`, {
    method: 'PUT',
    headers: {
      'content-type': file.type || 'application/octet-stream',
      'x-file-name': encodeURIComponent(file.name),
      'x-file-size': String(file.size),
    },
    body: file,
  });
  const result = await response.json().catch(() => null) as { error?: string } | null;
  if (!response.ok) {
    throw new Error(result?.error || `Upload ${file.name} gagal.`);
  }
}

export function TrainingCreateForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [materialFiles, setMaterialFiles] = useState<File[]>([]);
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(formData: FormData) {
    setPending(true);
    setMessage(null);
    setError(null);
    let createdTrainingId: number | null = null;

    formData.delete('materials');
    formData.delete('certificateTemplate');

    try {
      const result = await createTraining(formData);
      if (!result.success || !result.trainingId) {
        throw new Error(result.error || 'Pelatihan gagal dibuat.');
      }
      createdTrainingId = result.trainingId;

      const filesToUpload = [
        ...materialFiles.map((file) => ({ file, kind: 'material' as const })),
        ...(templateFile ? [{ file: templateFile, kind: 'template' as const }] : []),
      ];

      for (let index = 0; index < filesToUpload.length; index += 1) {
        const item = filesToUpload[index];
        setMessage(`Mengunggah ${index + 1} dari ${filesToUpload.length}: ${item.file.name}`);
        await uploadAsset(result.trainingId, item.file, item.kind);
      }

      setMessage(filesToUpload.length > 0
        ? 'Pelatihan dan seluruh file berhasil disimpan.'
        : 'Pelatihan berhasil disimpan.');
      formRef.current?.reset();
      setMaterialFiles([]);
      setTemplateFile(null);
      router.refresh();
    } catch (caught) {
      const detail = caught instanceof Error ? caught.message : 'Terjadi kesalahan saat menyimpan pelatihan.';
      setError(createdTrainingId
        ? `Pelatihan sudah dibuat, tetapi ada file yang gagal diunggah: ${detail}`
        : detail);
      if (createdTrainingId) router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form ref={formRef} action={submit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Judul Pelatihan</label>
        <input type="text" name="title" required className="w-full rounded-md border border-border px-3 py-2 bg-background" placeholder="Contoh: Safety Forklift" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Kode Training</label>
        <input type="text" name="trainingCode" className="w-full rounded-md border border-border px-3 py-2 bg-background uppercase" placeholder="Contoh: KPLH" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Deskripsi</label>
        <textarea name="description" rows={3} className="w-full rounded-md border border-border px-3 py-2 bg-background" placeholder="Detail pelatihan..." />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Kategori</label>
          <select name="category" className="w-full rounded-md border border-border px-3 py-2 bg-background">
            <option value="safety">Safety</option>
            <option value="technical">Technical</option>
            <option value="compliance">Compliance</option>
            <option value="soft_skills">Soft Skills</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Tipe</label>
          <select name="type" className="w-full rounded-md border border-border px-3 py-2 bg-background">
            <option value="offline">Offline</option>
            <option value="online">Online</option>
          </select>
        </div>
      </div>
      <div className="flex items-center gap-2 py-2">
        <input type="checkbox" name="isMandatory" id="isMandatory" className="rounded border-border text-primary w-4 h-4" />
        <label htmlFor="isMandatory" className="text-sm font-medium">Wajib untuk karyawan site</label>
      </div>
      <label className="block text-sm font-medium space-y-2">
        Materi awal
        <span className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-background px-4 py-3 text-center text-xs text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800">
          <Upload className="h-5 w-5 text-gray-400" />
          Upload PDF, PPT, atau video, maksimal 95 MB per file
          <input
            name="materials"
            type="file"
            accept=".pdf,.ppt,.pptx,video/*"
            multiple
            className="sr-only"
            onChange={(event) => setMaterialFiles(Array.from(event.target.files ?? []))}
          />
        </span>
        {materialFiles.length > 0 && (
          <span className="block text-xs font-normal text-gray-500">
            {materialFiles.map((file) => file.name).join(', ')}
          </span>
        )}
      </label>
      <div className="rounded-lg border border-border bg-background p-4 space-y-3">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" name="certificateEnabled" className="rounded border-border text-primary w-4 h-4" />
          Training ini menerbitkan sertifikat
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-medium space-y-1">
            Masa berlaku (bulan)
            <input type="number" min="1" name="certificateValidityMonths" defaultValue={12} className="w-full rounded-md border border-border px-3 py-2 bg-background" />
          </label>
          <label className="block text-sm font-medium space-y-1">
            Passing score
            <input type="number" min="0" max="100" name="certificatePassingScore" defaultValue={70} className="w-full rounded-md border border-border px-3 py-2 bg-background" />
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" name="certificateNeverExpires" className="rounded border-border text-primary w-4 h-4" />
          Tanpa kedaluwarsa
        </label>
        <label className="block text-sm font-medium space-y-1">
          Format nomor sertifikat
          <input name="certificateNumberFormat" defaultValue="PST/{TRAINING_CODE}/{YEAR}/{SEQ}" className="w-full rounded-md border border-border px-3 py-2 bg-background font-mono text-xs" />
        </label>
        <label className="block text-sm font-medium space-y-2">
          Template sertifikat
          <span className="flex min-h-20 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border px-4 py-3 text-center text-xs text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800">
            <Upload className="h-5 w-5 text-gray-400" />
            Upload background PNG/JPG, maksimal 10 MB
            <input
              name="certificateTemplate"
              type="file"
              accept=".png,.jpg,.jpeg"
              className="sr-only"
              onChange={(event) => setTemplateFile(event.target.files?.[0] ?? null)}
            />
          </span>
          {templateFile && <span className="block text-xs font-normal text-gray-500">{templateFile.name}</span>}
        </label>
      </div>

      {message && (
        <div className="flex items-start gap-2 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          {message}
        </div>
      )}
      {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <button type="submit" disabled={pending} className="inline-flex w-full items-center justify-center gap-2 bg-primary text-primary-foreground font-medium py-2 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-60">
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        {pending ? 'Menyimpan...' : 'Simpan Pelatihan'}
      </button>
    </form>
  );
}
