'use client';

import { useState } from 'react';
import { deleteUser, updateUser } from '@/lib/actions/user-actions';
import { Edit3, Trash2, X } from 'lucide-react';

function actionError(result: unknown) {
  return result && typeof result === 'object' && 'error' in result
    ? (result as { error?: unknown }).error
    : null;
}

type UserRow = {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string | null;
  position: string | null;
  jobsiteId: number | null;
};

export function UserRowActions({
  user,
  jobsites,
}: {
  user: UserRow;
  jobsites: { id: number; name: string }[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onUpdate(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await updateUser(formData);
    setLoading(false);

    const error = actionError(result);
    if (typeof error === 'string') {
      setError(error);
      return;
    }

    setIsOpen(false);
  }

  async function onDelete() {
    if (!window.confirm(`Hapus pengguna ${user.name}?`)) return;
    setLoading(true);
    setError(null);
    const result = await deleteUser(user.id);
    setLoading(false);
    const error = actionError(result);
    if (typeof error === 'string') setError(error);
  }

  return (
    <>
      <div className="inline-flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-1.5 text-primary font-medium hover:underline text-sm"
        >
          <Edit3 className="h-3.5 w-3.5" />
          Edit
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={loading}
          className="inline-flex items-center gap-1.5 text-red-500 font-medium hover:underline text-sm disabled:opacity-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Hapus
        </button>
      </div>
      {error && <div className="mt-2 text-xs text-red-600">{error}</div>}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-background rounded-xl shadow-lg w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-lg font-bold">Edit Pengguna</h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Tutup"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form action={onUpdate} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <input type="hidden" name="id" value={user.id} />
              {error && <div className="p-3 bg-red-100 text-red-700 text-sm rounded-md">{error}</div>}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="space-y-2 text-sm font-medium">
                  Nama Lengkap
                  <input name="name" required defaultValue={user.name} className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm focus:ring-1 focus:ring-primary outline-none" />
                </label>
                <label className="space-y-2 text-sm font-medium">
                  Email
                  <input type="email" name="email" required defaultValue={user.email} className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm focus:ring-1 focus:ring-primary outline-none" />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="space-y-2 text-sm font-medium">
                  Peran
                  <select name="role" required defaultValue={user.role} className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm focus:ring-1 focus:ring-primary outline-none">
                    <option value="super-admin">Super Admin</option>
                    <option value="site-admin">Site Admin</option>
                    <option value="manager">Manager</option>
                    <option value="trainer">Trainer</option>
                    <option value="trainee">Trainee</option>
                  </select>
                </label>
                <label className="space-y-2 text-sm font-medium">
                  Lokasi Kerja
                  <select name="jobsiteId" defaultValue={user.jobsiteId ?? ''} className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm focus:ring-1 focus:ring-primary outline-none">
                    <option value="">Global</option>
                    {jobsites.map((site) => (
                      <option key={site.id} value={site.id}>{site.name}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="space-y-2 text-sm font-medium">
                  Departemen
                  <input name="department" defaultValue={user.department ?? ''} className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm focus:ring-1 focus:ring-primary outline-none" />
                </label>
                <label className="space-y-2 text-sm font-medium">
                  Posisi/Jabatan
                  <input name="position" defaultValue={user.position ?? ''} className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm focus:ring-1 focus:ring-primary outline-none" />
                </label>
              </div>

              <label className="space-y-2 text-sm font-medium block">
                Kata Sandi Baru
                <input type="password" name="password" minLength={6} className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm focus:ring-1 focus:ring-primary outline-none" />
              </label>

              <div className="pt-4 flex gap-2 justify-end border-t border-border">
                <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">
                  Batal
                </button>
                <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50">
                  {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
