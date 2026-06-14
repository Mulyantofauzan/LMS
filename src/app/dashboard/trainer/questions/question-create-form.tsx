'use client';

import { useState } from 'react';
import { createQuestion } from '@/lib/actions/question-actions';
import { ImagePlus, Loader2, Plus } from 'lucide-react';

type QuestionSetOption = {
  id: number;
  title: string;
  trainingId: number;
  isLocked: boolean;
};

export function QuestionCreateForm({
  trainings,
  questionSets,
}: {
  trainings: { id: number; title: string }[];
  questionSets: QuestionSetOption[];
}) {
  const [trainingId, setTrainingId] = useState('');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const editableSets = questionSets.filter((set) => !set.isLocked && String(set.trainingId) === trainingId);

  async function submit(formData: FormData) {
    setPending(true);
    setMessage(null);
    setError(null);
    try {
      const file = formData.get('media') as File | null;
      formData.delete('media');
      if (file?.size) {
        const questionSetId = Number(formData.get('questionSetId'));
        const response = await fetch(`/api/uploads/question-media?questionSetId=${questionSetId}`, {
          method: 'PUT',
          headers: {
            'content-type': file.type || 'application/octet-stream',
            'x-file-name': encodeURIComponent(file.name),
            'x-file-size': String(file.size),
          },
          body: file,
        });
        const uploaded = await response.json() as { error?: string; mediaUrl?: string; mediaType?: string; mediaName?: string };
        if (!response.ok || !uploaded.mediaUrl) throw new Error(uploaded.error || 'Upload media gagal.');
        formData.set('mediaUrl', uploaded.mediaUrl);
        formData.set('mediaType', uploaded.mediaType ?? '');
        formData.set('mediaName', uploaded.mediaName ?? file.name);
      }

      const result = await createQuestion(formData);
      if (result && 'error' in result && result.error) throw new Error(result.error);
      setMessage('Soal berhasil disimpan.');
      (document.getElementById('question-create-form') as HTMLFormElement | null)?.reset();
      setTrainingId('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Gagal menyimpan soal.');
    } finally {
      setPending(false);
    }
  }

  return (
    <form id="question-create-form" action={submit} className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2"><Plus className="h-5 w-5"/> Tambah Soal</h3>
      <label className="space-y-2 text-sm font-medium block">
        Pelatihan
        <select name="trainingId" required value={trainingId} onChange={(event) => setTrainingId(event.target.value)} className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm">
          <option value="">Pilih pelatihan</option>
          {trainings.map((training) => <option key={training.id} value={training.id}>{training.title}</option>)}
        </select>
      </label>
      <label className="space-y-2 text-sm font-medium block">
        Paket Soal Milik Saya
        <select name="questionSetId" required className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm">
          <option value="">Pilih paket yang belum dikunci</option>
          {editableSets.map((set) => <option key={set.id} value={set.id}>{set.title}</option>)}
        </select>
      </label>
      <label className="space-y-2 text-sm font-medium block">
        Tipe
        <select name="type" required className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm">
          <option value="multiple_choice">Multiple Choice</option>
          <option value="essay">Essay</option>
        </select>
      </label>
      <label className="space-y-2 text-sm font-medium block">
        Pertanyaan
        <textarea name="question" required rows={4} className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm" />
      </label>
      <div className="grid grid-cols-2 gap-3">
        {['A', 'B', 'C', 'D'].map((label) => (
          <label key={label} className="space-y-2 text-sm font-medium">Opsi {label}<input name={`option${label}`} className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm" /></label>
        ))}
      </div>
      <label className="space-y-2 text-sm font-medium block">
        Jawaban Benar
        <input name="correctAnswer" className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm" />
      </label>
      <label className="space-y-2 text-sm font-medium block">
        <span className="flex items-center gap-2"><ImagePlus className="h-4 w-4" /> Media Soal</span>
        <input name="media" type="file" accept=".png,.jpg,.jpeg,.webp,.mp4,.webm,image/*,video/mp4,video/webm" className="w-full text-xs" />
        <span className="block text-xs font-normal text-gray-500">Gambar maksimal 10 MB, video maksimal 95 MB.</span>
      </label>
      {message && <div className="rounded-md bg-green-50 p-2 text-xs text-green-700">{message}</div>}
      {error && <div className="rounded-md bg-red-50 p-2 text-xs text-red-700">{error}</div>}
      <button type="submit" disabled={pending} className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50">
        {pending && <Loader2 className="h-4 w-4 animate-spin" />} Simpan Soal
      </button>
    </form>
  );
}
