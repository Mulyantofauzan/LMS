'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Edit3, Loader2, Trash2, X } from 'lucide-react';
import {
  createTrainingSession,
  deleteTrainingSession,
  updateTrainingSession,
} from './actions';

type Option = {
  id: number;
  name: string;
};

type TrainingOption = {
  id: number;
  title: string;
};

type SessionItem = {
  id: number;
  trainingId: number;
  trainerId: number;
  trainingTitle: string;
  trainerName: string;
  startTime: string;
  endTime: string;
  location: string | null;
  status: string;
};

function resultError(result: unknown) {
  return result && typeof result === 'object' && 'error' in result && typeof result.error === 'string'
    ? result.error
    : null;
}

function toDateTimeLocal(value: string) {
  const date = new Date(value);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

export function TrainingSessionCreateForm({
  trainings,
  trainers,
}: {
  trainings: TrainingOption[];
  trainers: Option[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(formData: FormData) {
    setPending(true);
    setMessage(null);
    setError(null);
    const result = await createTrainingSession(formData);
    setPending(false);

    const actionError = resultError(result);
    if (actionError) {
      setError(actionError);
      return;
    }

    setMessage('Jadwal training berhasil disimpan.');
    router.refresh();
  }

  return (
    <form action={submit} className="space-y-4">
      <label className="block text-sm font-medium space-y-1">
        Pelatihan
        <select name="trainingId" required className="w-full rounded-md border border-border px-3 py-2 bg-background">
          <option value="">Pilih pelatihan</option>
          {trainings.map((training) => (
            <option key={training.id} value={training.id}>{training.title}</option>
          ))}
        </select>
        {trainings.length === 0 && <span className="text-xs text-amber-600">Belum ada training yang sudah approve manager.</span>}
      </label>
      <label className="block text-sm font-medium space-y-1">
        Trainer
        <select name="trainerId" required className="w-full rounded-md border border-border px-3 py-2 bg-background">
          <option value="">Pilih trainer</option>
          {trainers.map((trainer) => (
            <option key={trainer.id} value={trainer.id}>{trainer.name}</option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-1 gap-4">
        <label className="block text-sm font-medium space-y-1">
          Mulai
          <input type="datetime-local" name="startTime" required className="w-full rounded-md border border-border px-3 py-2 bg-background" />
        </label>
        <label className="block text-sm font-medium space-y-1">
          Selesai
          <input type="datetime-local" name="endTime" required className="w-full rounded-md border border-border px-3 py-2 bg-background" />
        </label>
      </div>
      <label className="block text-sm font-medium space-y-1">
        Lokasi
        <input name="location" className="w-full rounded-md border border-border px-3 py-2 bg-background" placeholder="Ruang training / online" />
      </label>
      {message && <div className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">{message}</div>}
      {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      <button type="submit" disabled={pending || trainings.length === 0 || trainers.length === 0} className="inline-flex w-full items-center justify-center gap-2 bg-primary text-primary-foreground font-medium py-2 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-60">
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        {pending ? 'Menyimpan...' : 'Simpan Jadwal'}
      </button>
    </form>
  );
}

export function TrainingSessionRowActions({
  item,
  trainings,
  trainers,
}: {
  item: SessionItem;
  trainings: TrainingOption[];
  trainers: Option[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canModify = item.status === 'scheduled';

  async function remove() {
    if (!window.confirm(`Hapus jadwal "${item.trainingTitle}"?\n\nJadwal yang sudah memiliki peserta, absensi, nilai, atau sedang aktif tidak dapat dihapus.`)) {
      return;
    }

    setPending(true);
    setError(null);
    const result = await deleteTrainingSession(item.id);
    setPending(false);
    const actionError = resultError(result);
    if (actionError) {
      setError(actionError);
      return;
    }
    router.refresh();
  }

  async function update(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await updateTrainingSession(formData);
    setPending(false);
    const actionError = resultError(result);
    if (actionError) {
      setError(actionError);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => setOpen(true)} disabled={!canModify || pending} title={canModify ? 'Edit jadwal' : 'Kelas aktif tidak dapat diedit'} className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-primary hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-40">
          <Edit3 className="h-4 w-4" />
        </button>
        <button type="button" onClick={remove} disabled={!canModify || pending} title={canModify ? 'Hapus jadwal' : 'Kelas aktif tidak dapat dihapus'} className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </button>
      </div>
      {error && <div className="mt-2 max-w-xs text-right text-xs text-red-600">{error}</div>}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-lg bg-background shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h3 className="font-semibold">Edit Jadwal Training</h3>
                <p className="text-sm text-gray-500">{item.trainingTitle}</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Tutup">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form action={update} className="space-y-4 p-5">
              <input type="hidden" name="sessionId" value={item.id} />
              <label className="block space-y-1 text-sm font-medium">
                Pelatihan
                <select name="trainingId" required defaultValue={item.trainingId} className="w-full rounded-md border border-border bg-background px-3 py-2">
                  {trainings.map((training) => (
                    <option key={training.id} value={training.id}>{training.title}</option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1 text-sm font-medium">
                Trainer
                <select name="trainerId" required defaultValue={item.trainerId} className="w-full rounded-md border border-border bg-background px-3 py-2">
                  {trainers.map((trainer) => (
                    <option key={trainer.id} value={trainer.id}>{trainer.name}</option>
                  ))}
                </select>
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-1 text-sm font-medium">
                  Mulai
                  <input type="datetime-local" name="startTime" required defaultValue={toDateTimeLocal(item.startTime)} className="w-full rounded-md border border-border bg-background px-3 py-2" />
                </label>
                <label className="block space-y-1 text-sm font-medium">
                  Selesai
                  <input type="datetime-local" name="endTime" required defaultValue={toDateTimeLocal(item.endTime)} className="w-full rounded-md border border-border bg-background px-3 py-2" />
                </label>
              </div>
              <label className="block space-y-1 text-sm font-medium">
                Lokasi
                <input name="location" defaultValue={item.location ?? ''} className="w-full rounded-md border border-border bg-background px-3 py-2" />
              </label>
              {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
              <div className="flex justify-end gap-2 border-t border-border pt-4">
                <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800">Batal</button>
                <button type="submit" disabled={pending} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
                  {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
