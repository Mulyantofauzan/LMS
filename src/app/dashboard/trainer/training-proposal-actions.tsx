'use client';

import { useRef, useState } from 'react';
import { Link2, Send, Upload } from 'lucide-react';
import { addQuestionSetToTraining, submitTrainingProposal } from '@/lib/actions/training-proposal-actions';

export function TrainingProposalActions({
  trainingId,
  certificateEnabled,
  questionSets = [],
}: {
  trainingId: number;
  certificateEnabled: boolean;
  questionSets?: Array<{ id: number; title: string; ownerName: string }>;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File, kind: 'material' | 'template') {
    const response = await fetch(`/api/uploads/training-asset?trainingId=${trainingId}&kind=${kind}`, {
      method: 'PUT',
      headers: {
        'content-type': file.type || 'application/octet-stream',
        'x-file-name': encodeURIComponent(file.name),
        'x-file-size': String(file.size),
      },
      body: file,
    });
    const result = await response.json() as { error?: string };
    if (!response.ok) throw new Error(result.error || 'Upload gagal.');
  }

  async function onUpload(formData: FormData) {
    setPending(true);
    setMessage(null);
    setError(null);
    try {
      const material = formData.get('material') as File | null;
      const template = formData.get('template') as File | null;
      if (material?.size) await upload(material, 'material');
      if (template?.size) await upload(template, 'template');
      setMessage('File revisi berhasil disimpan.');
      formRef.current?.reset();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Upload gagal.');
    } finally {
      setPending(false);
    }
  }

  async function submit() {
    setPending(true);
    setMessage(null);
    setError(null);
    const result = await submitTrainingProposal(trainingId);
    if ('error' in result && result.error) setError(result.error);
    else setMessage('Pengajuan dikirim ke manager.');
    setPending(false);
  }

  async function addQuestionSet(formData: FormData) {
    setPending(true);
    setMessage(null);
    setError(null);
    const questionSetId = Number(formData.get('questionSetId'));
    const result = await addQuestionSetToTraining(trainingId, questionSetId);
    if ('error' in result && result.error) setError(result.error);
    else setMessage('Paket soal ditambahkan ke draft pengajuan.');
    setPending(false);
  }

  return (
    <div className="mt-3 space-y-2">
      <form action={addQuestionSet} className="flex gap-2">
        <select name="questionSetId" required defaultValue="" className="min-w-0 flex-1 rounded-md border border-border bg-background px-2 py-2 text-xs">
          <option value="" disabled>Tambah paket soal</option>
          {questionSets.map((set) => (
            <option key={set.id} value={set.id}>{set.title} - {set.ownerName}</option>
          ))}
        </select>
        <button type="submit" disabled={pending} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border disabled:opacity-50" title="Tambahkan paket soal">
          <Link2 className="h-4 w-4" />
        </button>
      </form>
      <form ref={formRef} action={onUpload} className="grid gap-2 sm:grid-cols-2">
        <label className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-medium">
          <Upload className="h-3.5 w-3.5" /> Materi
          <input name="material" type="file" accept=".pdf,.ppt,.pptx,video/*" className="sr-only" onChange={(event) => event.currentTarget.form?.requestSubmit()} />
        </label>
        {certificateEnabled && (
          <label className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-medium">
            <Upload className="h-3.5 w-3.5" /> Template
            <input name="template" type="file" accept=".png,.jpg,.jpeg" className="sr-only" onChange={(event) => event.currentTarget.form?.requestSubmit()} />
          </label>
        )}
      </form>
      <button type="button" onClick={submit} disabled={pending} className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground disabled:opacity-50">
        <Send className="h-3.5 w-3.5" /> {pending ? 'Memproses...' : 'Ajukan ke Manager'}
      </button>
      {message && <p className="text-xs text-green-600">{message}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
