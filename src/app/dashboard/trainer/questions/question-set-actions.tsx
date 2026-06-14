'use client';

import { useState } from 'react';
import { Copy, Loader2 } from 'lucide-react';
import { duplicateQuestionSet } from '@/lib/actions/question-actions';

export function QuestionSetActions({ questionSetId }: { questionSetId: number }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function duplicate() {
    setPending(true);
    setError(null);
    const result = await duplicateQuestionSet(questionSetId);
    if (result && 'error' in result && result.error) setError(result.error);
    setPending(false);
  }

  return (
    <div>
      <button type="button" onClick={duplicate} disabled={pending} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-gray-50 disabled:opacity-50">
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Copy className="h-3.5 w-3.5" />}
        Duplikat
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
