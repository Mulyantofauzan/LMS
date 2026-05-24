'use client';

import { useState } from 'react';
import { createJobsite } from '@/lib/actions/jobsite-actions';
import { Plus } from 'lucide-react';

function actionError(result: unknown) {
  return result && typeof result === 'object' && 'error' in result
    ? (result as { error?: unknown }).error
    : null;
}

export function JobsiteForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const res = await createJobsite(formData);
    setLoading(false);
    
    const error = actionError(res);
    if (typeof error === 'string') {
      setError(error);
    } else {
      setIsOpen(false);
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-primary text-primary-foreground px-4 py-2 rounded-md shadow-sm hover:bg-primary/90 text-sm font-medium transition-colors flex items-center gap-2"
      >
        <Plus className="h-4 w-4" /> Tambah Lokasi Kerja
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-background rounded-xl shadow-lg w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="text-lg font-bold">Tambah Lokasi Kerja Baru</h3>
            </div>
            <form action={onSubmit} className="p-6 space-y-4">
              {error && <div className="p-3 bg-red-100 text-red-700 text-sm rounded-md">{error}</div>}
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Nama Lokasi</label>
                <input 
                  name="name" 
                  required 
                  className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm focus:ring-1 focus:ring-primary outline-none" 
                  placeholder="Mis: Tambang Alpha" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Alamat/Wilayah</label>
                <input 
                  name="location" 
                  className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm focus:ring-1 focus:ring-primary outline-none" 
                  placeholder="Mis: Kalimantan Timur" 
                />
              </div>

              <div className="pt-4 flex gap-2 justify-end">
                <button 
                  type="button" 
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                >
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
