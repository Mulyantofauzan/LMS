'use client';

import { useState } from 'react';
import Link from 'next/link';
import { deleteTraining, updateTraining } from './actions';
import { Edit3, Link2, Send, Settings, Trash2, X } from 'lucide-react';
import { addQuestionSetToTraining, submitTrainingProposal } from '@/lib/actions/training-proposal-actions';

function actionError(result: unknown) {
  return result && typeof result === 'object' && 'error' in result
    ? (result as { error?: unknown }).error
    : null;
}

type Training = {
  id: number;
  title: string;
  description: string | null;
  category: string | null;
  type: string | null;
  isMandatory: boolean;
  trainingCode: string | null;
  certificateEnabled: boolean;
  certificateValidityMonths: number | null;
  certificatePassingScore: number;
  certificateNumberFormat: string;
  certificateTemplateUrl: string | null;
  approvalStatus: string;
};

export function TrainingRowActions({
  training,
  questionSets = [],
}: {
  training: Training;
  questionSets?: Array<{ id: number; title: string; ownerName: string }>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onUpdate(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await updateTraining(formData);
    setLoading(false);
    const error = actionError(result);
    if (typeof error === 'string') {
      setError(error);
      return;
    }
    setIsOpen(false);
  }

  async function onDelete() {
    if (!window.confirm(`Hapus pelatihan ${training.title}?`)) return;
    setLoading(true);
    setError(null);
    const result = await deleteTraining(training.id);
    setLoading(false);
    const error = actionError(result);
    if (typeof error === 'string') setError(error);
  }

  async function onSubmitProposal() {
    setLoading(true);
    setError(null);
    const result = await submitTrainingProposal(training.id);
    setLoading(false);
    const error = actionError(result);
    if (typeof error === 'string') setError(error);
  }

  async function onAddQuestionSet(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await addQuestionSetToTraining(training.id, Number(formData.get('questionSetId')));
    setLoading(false);
    const error = actionError(result);
    if (typeof error === 'string') setError(error);
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {training.approvalStatus !== 'pending_manager' && (
          <form action={onAddQuestionSet} className="flex items-center gap-1">
            <select name="questionSetId" required defaultValue="" className="max-w-44 rounded-md border border-border bg-background px-2 py-1.5 text-xs">
              <option value="" disabled>Tambah paket soal</option>
              {questionSets.map((set) => (
                <option key={set.id} value={set.id}>{set.title} - {set.ownerName}</option>
              ))}
            </select>
            <button type="submit" disabled={loading} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border disabled:opacity-50" title="Tambahkan paket soal">
              <Link2 className="h-3.5 w-3.5" />
            </button>
          </form>
        )}
        <Link href={`/dashboard/site-admin/trainings/${training.id}/certificate-template`} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-gray-50 dark:hover:bg-gray-800">
          <Settings className="h-3.5 w-3.5" />
          Template
        </Link>
        <button type="button" onClick={() => setIsOpen(true)} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/5">
          <Edit3 className="h-3.5 w-3.5" />
          Edit
        </button>
        {['draft', 'rejected'].includes(training.approvalStatus) && (
          <button type="button" onClick={onSubmitProposal} disabled={loading} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            <Send className="h-3.5 w-3.5" />
            Ajukan
          </button>
        )}
        <button type="button" onClick={onDelete} disabled={loading} className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-50">
          <Trash2 className="h-3.5 w-3.5" />
          Hapus
        </button>
      </div>
      {error && <div className="mt-2 text-xs text-red-600">{error}</div>}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-background rounded-xl shadow-lg w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-bold">Edit Training</h3>
              <button type="button" onClick={() => setIsOpen(false)} className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Tutup">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form action={onUpdate} encType="multipart/form-data" className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <input type="hidden" name="id" value={training.id} />
              {error && <div className="p-3 bg-red-100 text-red-700 text-sm rounded-md">{error}</div>}
              <label className="space-y-2 text-sm font-medium block">
                Training Title
                <input name="title" required defaultValue={training.title} className="w-full rounded-md border border-border px-3 py-2 bg-background" />
              </label>
              <label className="space-y-2 text-sm font-medium block">
                Kode Training
                <input name="trainingCode" defaultValue={training.trainingCode ?? ''} className="w-full rounded-md border border-border px-3 py-2 bg-background uppercase" />
              </label>
              <label className="space-y-2 text-sm font-medium block">
                Description
                <textarea name="description" rows={3} defaultValue={training.description ?? ''} className="w-full rounded-md border border-border px-3 py-2 bg-background" />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="space-y-2 text-sm font-medium">
                  Category
                  <select name="category" defaultValue={training.category ?? 'safety'} className="w-full rounded-md border border-border px-3 py-2 bg-background">
                    <option value="safety">Safety</option>
                    <option value="technical">Technical</option>
                    <option value="compliance">Compliance</option>
                    <option value="soft_skills">Soft Skills</option>
                  </select>
                </label>
                <label className="space-y-2 text-sm font-medium">
                  Type
                  <select name="type" defaultValue={training.type ?? 'offline'} className="w-full rounded-md border border-border px-3 py-2 bg-background">
                    <option value="offline">Offline</option>
                    <option value="online">Online</option>
                  </select>
                </label>
              </div>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input type="checkbox" name="isMandatory" defaultChecked={training.isMandatory} className="rounded border-border text-primary w-4 h-4" />
                Mandatory
              </label>
              <div className="rounded-lg border border-border bg-background p-4 space-y-3">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input type="checkbox" name="certificateEnabled" defaultChecked={training.certificateEnabled} className="rounded border-border text-primary w-4 h-4" />
                  Training ini menerbitkan sertifikat
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-sm font-medium space-y-1">
                    Masa berlaku (bulan)
                    <input type="number" min="1" name="certificateValidityMonths" defaultValue={training.certificateValidityMonths ?? 12} className="w-full rounded-md border border-border px-3 py-2 bg-background" />
                  </label>
                  <label className="block text-sm font-medium space-y-1">
                    Passing score
                    <input type="number" min="0" max="100" name="certificatePassingScore" defaultValue={training.certificatePassingScore ?? 70} className="w-full rounded-md border border-border px-3 py-2 bg-background" />
                  </label>
                </div>
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input type="checkbox" name="certificateNeverExpires" defaultChecked={training.certificateEnabled && training.certificateValidityMonths == null} className="rounded border-border text-primary w-4 h-4" />
                  Tanpa kedaluwarsa
                </label>
                <label className="block text-sm font-medium space-y-1">
                  Format nomor sertifikat
                  <input name="certificateNumberFormat" defaultValue={training.certificateNumberFormat ?? 'PST/{TRAINING_CODE}/{YEAR}/{SEQ}'} className="w-full rounded-md border border-border px-3 py-2 bg-background font-mono text-xs" />
                </label>
                <label className="block text-sm font-medium space-y-2">
                  Template sertifikat
                  <input name="certificateTemplate" type="file" accept=".png,.jpg,.jpeg" className="w-full rounded-md border border-border px-3 py-2 bg-background text-sm" />
                  {training.certificateTemplateUrl && <span className="text-xs text-gray-500">Template saat ini sudah tersimpan.</span>}
                </label>
              </div>
              <div className="pt-4 flex gap-2 justify-end border-t border-border">
                <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">Batal</button>
                <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50">
                  {loading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
