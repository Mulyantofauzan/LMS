'use client';

import { useRef, useState, useTransition } from 'react';
import { uploadTrainingMaterial } from '@/lib/actions/training-actions';
import { Upload } from 'lucide-react';

export function MaterialUploadForm({ trainingId }: { trainingId: number }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      ref={formRef}
      action={(formData) => startTransition(async () => {
        setError(null);
        const result = await uploadTrainingMaterial(formData);
        if (result && 'error' in result && typeof result.error === 'string') {
          setError(result.error);
          return;
        }
        formRef.current?.reset();
      })}
      className="mt-3 grid gap-2 sm:grid-cols-[1fr_120px_110px]"
    >
      <input type="hidden" name="trainingId" value={trainingId} />
      <input name="title" className="h-9 rounded-md border border-border bg-background px-3 text-xs" placeholder="Judul materi" />
      <select name="type" className="h-9 rounded-md border border-border bg-background px-3 text-xs">
        <option value="pdf">PDF</option>
        <option value="ppt">PPT</option>
        <option value="video">Video</option>
      </select>
      <label className="h-9 inline-flex items-center justify-center gap-1.5 rounded-md border border-border bg-background px-3 text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
        <Upload className="h-3.5 w-3.5" />
        Upload
        <input name="file" type="file" accept=".pdf,.ppt,.pptx,video/*" required className="sr-only" onChange={(event) => event.currentTarget.form?.requestSubmit()} disabled={isPending} />
      </label>
      {error && <div className="sm:col-span-3 text-xs text-red-600">{error}</div>}
    </form>
  );
}
