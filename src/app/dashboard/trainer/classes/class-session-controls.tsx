'use client';

import { assignSessionQuestionSet, endTrainingSession, startTrainingSession } from '@/lib/actions/class-actions';
import { ExternalLink, Play, QrCode, Square, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

type ActionResult = {
  success?: boolean;
  error?: string;
};

type QrPayload = {
  links: Record<'attendance' | 'pretest' | 'posttest', string>;
  images: Record<'attendance' | 'pretest' | 'posttest', string>;
};

export function ClassSessionControls({
  sessionId,
  trainingId,
  trainingTitle,
  status,
  selectedQuestionSetId,
  questionSets,
  qr,
}: {
  sessionId: number;
  trainingId: number;
  trainingTitle: string;
  status: string;
  selectedQuestionSetId: number | null;
  questionSets: { id: number; title: string }[];
  qr: QrPayload;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedQr, setSelectedQr] = useState<null | 'attendance' | 'pretest' | 'posttest'>(null);
  const isActive = status === 'active';
  const isEnded = status === 'ended';
  const canStart = !isActive && !isEnded && !isPending;
  const canEnd = isActive && !isPending;
  const startLabel = isActive ? 'Berjalan' : isEnded ? 'Selesai' : 'Mulai';
  const endLabel = isEnded ? 'Sudah Diakhiri' : 'Akhiri';

  function runAction(action: 'assign' | 'start' | 'end', questionSetId?: string) {
    if (action === 'start' && !canStart) return;
    if (action === 'end' && !canEnd) return;

    const confirmText = action === 'start'
      ? `Mulai kelas "${trainingTitle}" sekarang? Peserta akan bisa scan QR untuk absensi, pre-test, dan post-test.`
      : action === 'end'
        ? `Akhiri kelas "${trainingTitle}" sekarang? Peserta tidak bisa lagi mengakses QR kelas ini.`
        : '';

    if (confirmText && !window.confirm(confirmText)) return;

    const formData = new FormData();
    formData.set('sessionId', String(sessionId));
    if (questionSetId != null) formData.set('questionSetId', questionSetId);

    startTransition(async () => {
      setMessage(null);
      const result: ActionResult = action === 'assign'
        ? await assignSessionQuestionSet(formData)
        : action === 'start'
          ? await startTrainingSession(formData)
          : await endTrainingSession(formData);

      if (result?.error) {
        setMessage({ type: 'error', text: result.error });
        return;
      }

      const text = action === 'assign'
        ? 'Paket bank soal berhasil disimpan.'
        : action === 'start'
          ? 'Kelas berhasil dimulai. QR Code sudah aktif.'
          : 'Kelas berhasil diakhiri.';

      setMessage({ type: 'success', text });
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2 justify-end">
        <select
          name="questionSetId"
          defaultValue={selectedQuestionSetId ?? ''}
          disabled={isPending}
          onChange={(event) => runAction('assign', event.target.value)}
          className="h-9 min-w-0 flex-1 px-3 rounded-md border border-border bg-background text-sm disabled:opacity-50"
        >
          <option value="">Pilih bank soal</option>
          {questionSets.map((set) => (
            <option key={set.id} value={set.id}>{set.title}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => runAction('start')}
          disabled={!canStart}
          className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold shadow-sm ring-1 transition-colors ${
            canStart
              ? 'bg-green-600 text-white ring-green-700/25 hover:bg-green-700'
              : 'cursor-not-allowed bg-gray-100 text-gray-500 ring-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700'
          }`}
        >
          <Play className="h-4 w-4" />
          {startLabel}
        </button>
        <button
          type="button"
          onClick={() => runAction('end')}
          disabled={!canEnd}
          className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold shadow-sm ring-1 transition-colors ${
            canEnd
              ? 'bg-red-600 text-white ring-red-700/25 hover:bg-red-700'
              : 'cursor-not-allowed bg-gray-100 text-gray-500 ring-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700'
          }`}
        >
          <Square className="h-4 w-4" />
          {endLabel}
        </button>
        <Link href={`/dashboard/trainer/questions?trainingId=${trainingId}`} className="inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800">
          Kelola Soal
        </Link>
      </div>

      {message && (
        <div className={`rounded-md px-3 py-2 text-xs font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      {isActive ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 text-right">QR Code kelas aktif</p>
          <div className="grid grid-cols-3 gap-2 rounded-lg border border-border p-2 bg-background">
            {(['attendance', 'pretest', 'posttest'] as const).map((mode) => (
              <button key={mode} type="button" onClick={() => setSelectedQr(mode)} className="text-center text-[11px] font-medium text-gray-600 hover:text-primary">
                <img src={qr.images[mode]} alt={`QR ${mode}`} className="w-full aspect-square object-contain" />
                <span className="inline-flex items-center gap-1"><QrCode className="h-3 w-3" />{mode}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-border bg-background px-3 py-2 text-xs text-gray-500 text-right">
          QR Code otomatis muncul di sini setelah kelas dimulai.
        </div>
      )}

      {selectedQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900">QR Code {selectedQr}</h3>
                <p className="text-sm text-gray-500">{trainingTitle}</p>
              </div>
              <button type="button" onClick={() => setSelectedQr(null)} className="rounded-md p-2 text-gray-500 hover:bg-gray-100" aria-label="Tutup QR">
                <X className="h-5 w-5" />
              </button>
            </div>
            <img src={qr.images[selectedQr]} alt={`QR ${selectedQr}`} className="mx-auto w-full max-w-sm rounded-lg border border-gray-200 bg-white p-3" />
            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              <a href={qr.links[selectedQr]} target="_blank" rel="noreferrer" className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                <ExternalLink className="h-4 w-4" />
                Buka Halaman
              </a>
              <button type="button" onClick={() => setSelectedQr(null)} className="rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
