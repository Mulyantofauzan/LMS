'use client';

import { useState } from 'react';
import { deleteQuestion, updateQuestion } from '@/lib/actions/question-actions';
import { Edit3, Eye, Trash2, X } from 'lucide-react';

function actionError(result: unknown) {
  return result && typeof result === 'object' && 'error' in result
    ? (result as { error?: unknown }).error
    : null;
}

type Question = {
  id: number;
  trainingId: number;
  type: string;
  question: string;
  options: unknown;
  correctAnswer: string | null;
};

function optionValue(options: unknown, index: number) {
  return Array.isArray(options) ? String(options[index] ?? '') : '';
}

export function QuestionCardActions({
  question,
  trainings,
}: {
  question: Question;
  trainings: { id: number; title: string }[];
}) {
  const [mode, setMode] = useState<'edit' | 'preview' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onUpdate(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await updateQuestion(formData);
    setLoading(false);
    const error = actionError(result);
    if (typeof error === 'string') {
      setError(error);
      return;
    }
    setMode(null);
  }

  async function onDelete() {
    if (!window.confirm('Hapus soal ini?')) return;
    setLoading(true);
    setError(null);
    const result = await deleteQuestion(question.id);
    setLoading(false);
    const error = actionError(result);
    if (typeof error === 'string') setError(error);
  }

  return (
    <>
      <div className="flex gap-2">
        <button type="button" onClick={() => setMode('edit')} className="flex-1 inline-flex items-center justify-center gap-1.5 bg-background border border-border text-foreground px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          <Edit3 className="h-3.5 w-3.5" />
          Edit
        </button>
        <button type="button" onClick={() => setMode('preview')} className="flex-1 inline-flex items-center justify-center gap-1.5 bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
          <Eye className="h-3.5 w-3.5" />
          Preview
        </button>
        <button type="button" onClick={onDelete} disabled={loading} className="inline-flex items-center justify-center bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-100 disabled:opacity-50">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      {error && <div className="mt-2 text-xs text-red-600">{error}</div>}

      {mode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-background rounded-xl shadow-lg w-full max-w-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-bold">{mode === 'edit' ? 'Edit Soal' : 'Preview Soal'}</h3>
              <button type="button" onClick={() => setMode(null)} className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Tutup">
                <X className="h-4 w-4" />
              </button>
            </div>
            {mode === 'preview' ? (
              <div className="p-6 space-y-4">
                <p className="text-sm font-semibold text-primary uppercase">{question.type.replace('_', ' ')}</p>
                <p className="font-medium">{question.question}</p>
                {Array.isArray(question.options) && (
                  <div className="grid gap-2">
                    {question.options.map((option, index) => (
                      <div key={index} className="rounded-md border border-border bg-background px-3 py-2 text-sm">
                        {String(option)}
                      </div>
                    ))}
                  </div>
                )}
                {question.correctAnswer && (
                  <div className="rounded-md bg-green-50 border border-green-200 text-green-700 px-3 py-2 text-sm">
                    Jawaban: {question.correctAnswer}
                  </div>
                )}
              </div>
            ) : (
              <form action={onUpdate} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                <input type="hidden" name="id" value={question.id} />
                {error && <div className="p-3 bg-red-100 text-red-700 text-sm rounded-md">{error}</div>}
                <label className="space-y-2 text-sm font-medium block">
                  Pelatihan
                  <select name="trainingId" required defaultValue={question.trainingId} className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm">
                    {trainings.map((training) => (
                      <option key={training.id} value={training.id}>{training.title}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2 text-sm font-medium block">
                  Tipe
                  <select name="type" required defaultValue={question.type} className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm">
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="essay">Essay</option>
                  </select>
                </label>
                <label className="space-y-2 text-sm font-medium block">
                  Pertanyaan
                  <textarea name="question" required defaultValue={question.question} rows={4} className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm" />
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {['A', 'B', 'C', 'D'].map((label, index) => (
                    <label key={label} className="space-y-2 text-sm font-medium">
                      Opsi {label}
                      <input name={`option${label}`} defaultValue={optionValue(question.options, index)} className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm" />
                    </label>
                  ))}
                </div>
                <label className="space-y-2 text-sm font-medium block">
                  Jawaban Benar
                  <input name="correctAnswer" defaultValue={question.correctAnswer ?? ''} className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm" />
                </label>
                <div className="pt-4 flex gap-2 justify-end border-t border-border">
                  <button type="button" onClick={() => setMode(null)} className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">Batal</button>
                  <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50">
                    {loading ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
