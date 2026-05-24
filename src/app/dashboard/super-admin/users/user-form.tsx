'use client';

import { useState } from 'react';
import { createUser } from '@/lib/actions/user-actions';
import { Plus } from 'lucide-react';

function actionError(result: unknown) {
  return result && typeof result === 'object' && 'error' in result
    ? (result as { error?: unknown }).error
    : null;
}

export function UserForm({
  jobsites,
  departments,
  positions,
}: {
  jobsites: { id: number, name: string }[];
  departments: { id: number; name: string }[];
  positions: { id: number; name: string }[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const res = await createUser(formData);
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
        <Plus className="h-4 w-4" /> Tambah Pengguna
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-background rounded-xl shadow-lg w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center">
              <h3 className="text-lg font-bold">Tambah Pengguna Baru</h3>
            </div>
            <form action={onSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {error && <div className="p-3 bg-red-100 text-red-700 text-sm rounded-md">{error}</div>}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nama Lengkap</label>
                  <input name="name" required className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm focus:ring-1 focus:ring-primary outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">NRP</label>
                  <input name="nrp" required className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm focus:ring-1 focus:ring-primary outline-none" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <input type="email" name="email" required className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm focus:ring-1 focus:ring-primary outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Departemen</label>
                  <select name="department" required className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm focus:ring-1 focus:ring-primary outline-none">
                    <option value="">Pilih departemen</option>
                    {departments.map((department) => (
                      <option key={department.id} value={department.name}>{department.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Jabatan</label>
                  <select name="position" required className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm focus:ring-1 focus:ring-primary outline-none">
                    <option value="">Pilih jabatan</option>
                    {positions.map((position) => (
                      <option key={position.id} value={position.name}>{position.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Peran (Role)</label>
                  <select name="role" required className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm focus:ring-1 focus:ring-primary outline-none">
                    <option value="">Pilih Peran</option>
                    <option value="super-admin">Super Admin</option>
                    <option value="site-admin">Site Admin</option>
                    <option value="manager">Manager</option>
                    <option value="trainer">Trainer</option>
                    <option value="trainee">Trainee</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Lokasi Kerja</label>
                  <select name="jobsiteId" className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm focus:ring-1 focus:ring-primary outline-none">
                    <option value="">(Tidak Ada/Global)</option>
                    {jobsites.map(site => (
                      <option key={site.id} value={site.id}>{site.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Kata Sandi</label>
                <input type="password" name="password" required minLength={6} className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm focus:ring-1 focus:ring-primary outline-none" />
              </div>

              <div className="pt-4 flex gap-2 justify-end border-t border-border mt-6">
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
