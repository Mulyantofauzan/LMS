'use client';

import { useState } from 'react';
import { deleteJobsite, updateJobsite } from '@/lib/actions/jobsite-actions';
import { Edit3, Trash2, X } from 'lucide-react';

function actionError(result: unknown) {
  return result && typeof result === 'object' && 'error' in result
    ? (result as { error?: unknown }).error
    : null;
}

export function JobsiteCardActions({
  site,
  canDelete,
}: {
  site: { id: number; name: string; location: string | null };
  canDelete: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onUpdate(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await updateJobsite(formData);
    setLoading(false);
    const error = actionError(result);
    if (typeof error === 'string') {
      setError(error);
      return;
    }
    setIsOpen(false);
  }

  async function onDelete() {
    if (!canDelete || !window.confirm(`Hapus lokasi kerja ${site.name}?`)) return;
    setLoading(true);
    setError(null);
    const result = await deleteJobsite(site.id);
    setLoading(false);
    const error = actionError(result);
    if (typeof error === 'string') setError(error);
  }

  return (
    <>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-1.5 text-primary font-medium hover:underline"
        >
          <Edit3 className="h-3.5 w-3.5" />
          Edit
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={!canDelete || loading}
          className="inline-flex items-center gap-1.5 text-red-500 font-medium hover:underline disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Hapus
        </button>
      </div>
      {error && <div className="mt-2 text-xs text-red-600">{error}</div>}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-background rounded-xl shadow-lg w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-bold">Edit Lokasi Kerja</h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Tutup"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form action={onUpdate} className="p-6 space-y-4">
              <input type="hidden" name="id" value={site.id} />
              {error && <div className="p-3 bg-red-100 text-red-700 text-sm rounded-md">{error}</div>}
              <label className="space-y-2 text-sm font-medium block">
                Nama Lokasi
                <input name="name" required defaultValue={site.name} className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm focus:ring-1 focus:ring-primary outline-none" />
              </label>
              <label className="space-y-2 text-sm font-medium block">
                Alamat/Wilayah
                <input name="location" defaultValue={site.location ?? ''} className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm focus:ring-1 focus:ring-primary outline-none" />
              </label>
              <div className="pt-4 flex gap-2 justify-end border-t border-border">
                <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">
                  Batal
                </button>
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
