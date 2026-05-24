'use client';

import { useState } from 'react';
import { saveSystemSettings } from '@/lib/actions/settings-actions';
import { Settings as SettingsIcon } from 'lucide-react';

export function SettingsForm({ initialSettings }: { initialSettings: Record<string, string> }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setSuccess(false);
    const res = await saveSystemSettings(formData);
    setLoading(false);
    
    if (res.success) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="p-6 border border-border rounded-xl bg-card shadow-sm">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><SettingsIcon className="h-5 w-5 text-primary" /> Pengaturan Umum</h3>
        <form action={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nama Sistem</label>
            <input 
              name="brandName"
              type="text" 
              defaultValue={initialSettings['brandName'] || "PST Learning Management System"} 
              className="w-full rounded-md border border-border px-3 py-2 bg-background text-foreground text-sm" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nama Pendek (Singkatan)</label>
            <input 
              name="brandShort"
              type="text" 
              defaultValue={initialSettings['brandShort'] || "PST"} 
              className="w-full rounded-md border border-border px-3 py-2 bg-background text-foreground text-sm" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Ambang Batas Kepatuhan (%)</label>
            <input 
              name="complianceThreshold"
              type="number" 
              defaultValue={initialSettings['complianceThreshold'] || "90"} 
              className="w-full rounded-md border border-border px-3 py-2 bg-background text-foreground text-sm" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Peringatan Sertifikat Kedaluwarsa (hari)</label>
            <input 
              name="certExpiryWarning"
              type="number" 
              defaultValue={initialSettings['certExpiryWarning'] || "30"} 
              className="w-full rounded-md border border-border px-3 py-2 bg-background text-foreground text-sm" 
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 text-sm font-medium transition-colors w-full disabled:opacity-50"
          >
            {loading ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </button>
          {success && <p className="text-sm text-green-600 text-center mt-2">Pengaturan berhasil disimpan!</p>}
        </form>
      </div>

      <div className="p-6 border border-border rounded-xl bg-card shadow-sm">
        <h3 className="font-semibold text-lg mb-4">Notifikasi Email</h3>
        <form action={onSubmit} className="space-y-3">
          {[
            { id: "notif_cert_expiry", label: "Pengingat sertifikat kedaluwarsa" },
            { id: "notif_enrollment", label: "Notifikasi pendaftaran pelatihan" },
            { id: "notif_compliance", label: "Peringatan ambang batas kepatuhan" },
            { id: "notif_new_user", label: "Email registrasi pengguna baru" },
            { id: "notif_digest", label: "Laporan kepatuhan mingguan" },
          ].map((n, i) => {
            const isEnabled = initialSettings[n.id] === 'true' || (!initialSettings[n.id] && i !== 3); // Default true except new user
            return (
              <div key={i} className="flex items-center justify-between p-3 border border-border rounded-lg bg-background">
                <span className="text-sm font-medium">{n.label}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" name={n.id} value="true" defaultChecked={isEnabled} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                </label>
              </div>
            );
          })}
          <div className="pt-2">
            <button 
              type="submit" 
              disabled={loading}
              className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border border-border px-4 py-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-medium transition-colors w-full disabled:opacity-50"
            >
              Simpan Notifikasi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
