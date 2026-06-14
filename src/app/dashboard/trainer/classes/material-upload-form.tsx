'use client';

import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { submitTrainingProposal } from '@/lib/actions/training-proposal-actions';

export function MaterialUploadForm({ trainingId }: { trainingId: number }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function upload(formData: FormData) {
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      const file = formData.get('file') as File;
      const response = await fetch(`/api/uploads/training-asset?trainingId=${trainingId}&kind=material`, {
        method: 'PUT',
        headers: {
          'content-type': file.type || 'application/octet-stream',
          'x-file-name': encodeURIComponent(file.name),
          'x-file-size': String(file.size),
        },
        body: file,
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Upload materi gagal.');

      const proposal = await submitTrainingProposal(trainingId);
      if ('error' in proposal && proposal.error) throw new Error(proposal.error);
      setMessage('Materi diunggah dan diajukan ke manager.');
      formRef.current?.reset();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Gagal mengunggah materi.');
    } finally {
      setPending(false);
    }
  }

  return (
    <form ref={formRef} action={upload} className="mt-3 space-y-2">
      <label className="h-9 inline-flex items-center justify-center gap-1.5 rounded-md border border-border bg-background px-3 text-xs font-medium hover:bg-gray-50 cursor-pointer">
        <Upload className="h-3.5 w-3.5" />
        {pending ? 'Mengunggah...' : 'Tambah Materi'}
        <input name="file" type="file" accept=".pdf,.ppt,.pptx,video/*" required className="sr-only" onChange={(event) => event.currentTarget.form?.requestSubmit()} disabled={pending} />
      </label>
      {message && <div className="text-xs text-green-600">{message}</div>}
      {error && <div className="text-xs text-red-600">{error}</div>}
    </form>
  );
}
