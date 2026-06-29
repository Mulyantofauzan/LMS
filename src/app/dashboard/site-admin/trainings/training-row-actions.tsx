'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { deleteTraining, updateTraining } from './actions';
import { Edit3, Link2, Send, Settings, Trash2, Upload, X } from 'lucide-react';
import { addQuestionSetToTraining, submitTrainingProposal } from '@/lib/actions/training-proposal-actions';

function actionError(result: unknown) {
  return result && typeof result === 'object' && 'error' in result
    ? (result as { error?: unknown }).error
    : null;
}

async function uploadMaterial(trainingId: number, file: File) {
  const response = await fetch(`/api/uploads/training-asset?trainingId=${trainingId}&kind=material`, {
    method: 'PUT',
    headers: {
      'content-type': file.type || 'application/octet-stream',
      'x-file-name': encodeURIComponent(file.name),
      'x-file-size': String(file.size),
    },
    body: file,
  });
  const result = await response.json().catch(() => null) as { error?: string } | null;
  if (!response.ok) {
    throw new Error(result?.error || `Upload ${file.name} gagal.`);
  }
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
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [materialFiles, setMaterialFiles] = useState<File[]>([]);
  const [selectedQuestionSetId, setSelectedQuestionSetId] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onUpdate(formData: FormData) {
    setLoading(true);
    setMessage(null);
    setError(null);
    formData.delete('materials');
    const result = await updateTraining(formData);
    const error = actionError(result);
    if (typeof error === 'string') {
      setError(error);
      setLoading(false);
      return;
    }

    try {
      for (let index = 0; index < materialFiles.length; index += 1) {
        const file = materialFiles[index];
        setMessage(`Mengunggah materi ${index + 1} dari ${materialFiles.length}: ${file.name}`);
        await uploadMaterial(training.id, file);
      }
      setMaterialFiles([]);
      setMessage(materialFiles.length > 0 ? 'Training dan materi berhasil disimpan sebagai draft.' : null);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Upload materi gagal.');
      setLoading(false);
      return;
    }

    setLoading(false);
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
    setMessage(null);
    setError(null);

    if (selectedQuestionSetId) {
      const linkResult = await addQuestionSetToTraining(training.id, Number(selectedQuestionSetId));
      const linkError = actionError(linkResult);
      if (typeof linkError === 'string') {
        setError(linkError);
        setLoading(false);
        return;
      }
    }

    const result = await submitTrainingProposal(training.id);
    setLoading(false);
    const error = actionError(result);
    if (typeof error === 'string') setError(error);
    else router.refresh();
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
            <select
              name="questionSetId"
              required
              value={selectedQuestionSetId}
              onChange={(event) => setSelectedQuestionSetId(event.target.value)}
              className="max-w-44 rounded-md border border-border bg-background px-2 py-1.5 text-xs"
            >
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
              <label className="block space-y-2 text-sm font-medium">
                Materi training
                <span className="flex min-h-20 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-background px-4 py-3 text-center text-xs text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <Upload className="h-5 w-5 text-gray-400" />
                  Upload tambahan PDF, PPT, atau video, maksimal 95 MB per file
                  <input
                    name="materials"
                    type="file"
                    accept=".pdf,.ppt,.pptx,video/*"
                    multiple
                    className="sr-only"
                    onChange={(event) => setMaterialFiles(Array.from(event.target.files ?? []))}
                  />
                </span>
                {materialFiles.length > 0 && (
                  <span className="block text-xs font-normal text-gray-500">
                    {materialFiles.map((file) => file.name).join(', ')}
                  </span>
                )}
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
              {message && <div className="text-xs text-green-700">{message}</div>}
            </form>
          </div>
        </div>
      )}
    </>
  );
}
