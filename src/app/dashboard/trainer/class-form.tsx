'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2, Upload } from 'lucide-react';
import { createTraining } from './actions';
import { submitTrainingProposal } from '@/lib/actions/training-proposal-actions';

async function uploadAsset(trainingId: number, file: File, kind: 'material' | 'template') {
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
  if (!response.ok) throw new Error(result?.error || `Upload ${file.name} gagal.`);
}

export default function TrainingForm({
  questionSets,
}: {
  questionSets: { id: number; title: string; ownerName: string }[];
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [materials, setMaterials] = useState<File[]>([]);
  const [template, setTemplate] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(formData: FormData) {
    setPending(true);
    setMessage(null);
    setError(null);
    formData.delete('materials');
    formData.delete('certificateTemplate');

    try {
      const result = await createTraining(formData);
      if (!result?.success || !result.trainingId) throw new Error(result?.error || 'Training gagal dibuat.');

      const files = [
        ...materials.map((file) => ({ file, kind: 'material' as const })),
        ...(template ? [{ file: template, kind: 'template' as const }] : []),
      ];
      for (let index = 0; index < files.length; index += 1) {
        setMessage(`Mengunggah ${index + 1} dari ${files.length}: ${files[index].file.name}`);
        await uploadAsset(result.trainingId, files[index].file, files[index].kind);
      }

      const proposal = await submitTrainingProposal(result.trainingId);
      if ('error' in proposal && proposal.error) throw new Error(proposal.error);

      setMessage('Paket training berhasil diajukan ke manager.');
      formRef.current?.reset();
      setMaterials([]);
      setTemplate(null);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Gagal mengajukan training.');
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form ref={formRef} action={submit} className="space-y-4 mt-4">
      <label className="block text-sm font-medium space-y-1">
        Judul Pelatihan
        <input name="title" required className="w-full rounded-md border border-border px-3 py-2 bg-background text-sm" placeholder="Contoh: Safety Alat Berat" />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm font-medium space-y-1">
          Kategori
          <select name="category" className="w-full rounded-md border border-border px-3 py-2 bg-background text-sm">
            <option value="Safety">Safety</option>
            <option value="Compliance">Compliance</option>
            <option value="Technical">Technical</option>
            <option value="Leadership">Leadership</option>
            <option value="General">General</option>
          </select>
        </label>
        <label className="block text-sm font-medium space-y-1">
          Kode Training
          <input name="trainingCode" className="w-full rounded-md border border-border px-3 py-2 bg-background text-sm uppercase" />
        </label>
      </div>
      <label className="block text-sm font-medium space-y-1">
        Deskripsi
        <textarea name="description" required rows={3} className="w-full rounded-md border border-border px-3 py-2 bg-background text-sm" />
      </label>
      <label className="block text-sm font-medium space-y-1">
        Paket Soal Global
        <select name="questionSetId" required className="w-full rounded-md border border-border px-3 py-2 bg-background text-sm">
          <option value="">Pilih paket soal</option>
          {questionSets.map((set) => <option key={set.id} value={set.id}>{set.title} · {set.ownerName}</option>)}
        </select>
      </label>
      <label className="block text-sm font-medium space-y-2">
        Materi Training
        <span className="flex min-h-20 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-border px-3 text-xs text-gray-500">
          <Upload className="h-4 w-4" /> PDF, PPT, atau video
          <input type="file" multiple accept=".pdf,.ppt,.pptx,video/*" className="sr-only" onChange={(event) => setMaterials(Array.from(event.target.files ?? []))} />
        </span>
        {materials.length > 0 && <span className="block text-xs font-normal text-gray-500">{materials.map((file) => file.name).join(', ')}</span>}
      </label>
      <div className="rounded-md border border-border p-3 space-y-3">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" name="certificateEnabled" /> Terbitkan sertifikat
        </label>
        <div className="grid grid-cols-2 gap-3">
          <input type="number" min="1" name="certificateValidityMonths" defaultValue={12} aria-label="Masa berlaku bulan" className="rounded-md border border-border px-3 py-2 bg-background text-sm" />
          <input type="number" min="0" max="100" name="certificatePassingScore" defaultValue={70} aria-label="Passing score" className="rounded-md border border-border px-3 py-2 bg-background text-sm" />
        </div>
        <label className="flex items-center gap-2 text-xs"><input type="checkbox" name="certificateNeverExpires" /> Tanpa kedaluwarsa</label>
        <input name="certificateNumberFormat" defaultValue="PST/{TRAINING_CODE}/{YEAR}/{SEQ}" className="w-full rounded-md border border-border px-3 py-2 bg-background text-xs font-mono" />
        <label className="block text-xs font-medium space-y-1">
          Template sertifikat
          <input type="file" accept=".png,.jpg,.jpeg" onChange={(event) => setTemplate(event.target.files?.[0] ?? null)} className="w-full text-xs" />
        </label>
      </div>
      {message && <div className="flex gap-2 rounded-md bg-green-50 p-3 text-sm text-green-700"><CheckCircle2 className="h-4 w-4" />{message}</div>}
      {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <button type="submit" disabled={pending} className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-md font-medium disabled:opacity-50 text-sm">
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        {pending ? 'Mengunggah & Mengajukan...' : 'Ajukan Training ke Manager'}
      </button>
    </form>
  );
}
