import { auth } from '@/auth';
import { db } from '@/db';
import { externalCertificateTypes, externalCertificates, users } from '@/db/schema';
import {
  createExternalCertificateForm,
  deleteExternalCertificateForm,
  importExternalCertificates,
  updateExternalCertificateForm,
} from '@/lib/actions/external-certificate-actions';
import { ExternalCertificateImportForm } from '@/components/certificates/ExternalCertificateImportForm';
import { SearchableSelect } from '@/components/forms/SearchableSelect';
import { getManagedUsersForCertificateAdmin } from '@/lib/tna';
import { eq, inArray } from 'drizzle-orm';
import { Plus, Save, Trash2 } from 'lucide-react';
import { redirect } from 'next/navigation';

type SessionUser = {
  id?: string | number | null;
  role?: string | null;
};

function dateInput(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : '';
}

export default async function SiteExternalCertificatesPage() {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  if (!['site-admin', 'admin'].includes(user?.role ?? '') || !user?.id) redirect('/dashboard');

  const managedUsers = await getManagedUsersForCertificateAdmin(user.role!, Number(user.id));
  const userIds = managedUsers.map((item) => item.id);
  const [types, certRows] = await Promise.all([
    db.select().from(externalCertificateTypes).orderBy(externalCertificateTypes.name),
    userIds.length === 0
      ? []
      : db.select({
        id: externalCertificates.id,
        userId: externalCertificates.userId,
        userName: users.name,
        typeId: externalCertificates.typeId,
        certNumber: externalCertificates.certNumber,
        issuer: externalCertificates.issuer,
        issueDate: externalCertificates.issueDate,
        expiryDate: externalCertificates.expiryDate,
        notes: externalCertificates.notes,
      })
        .from(externalCertificates)
        .innerJoin(users, eq(externalCertificates.userId, users.id))
        .where(inArray(externalCertificates.userId, userIds))
        .orderBy(externalCertificates.issueDate),
  ]);
  const userOptions = managedUsers.map((row) => ({
    value: row.id,
    label: `${row.name}${row.nrp ? ` (${row.nrp})` : ''}`,
  }));
  const typeOptions = types.map((type) => ({ value: type.id, label: type.name }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Sertifikasi Eksternal Site</h1>
        <p className="text-gray-500 dark:text-gray-400">Input, edit, dan hapus sertifikat eksternal karyawan di site Anda.</p>
      </div>

      <section className="border border-border rounded-xl bg-card shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="text-lg font-semibold">Tambah Sertifikat Eksternal</h2>
        </div>
        <form action={createExternalCertificateForm} className="p-5 grid gap-3 lg:grid-cols-3">
          <SearchableSelect name="userId" required placeholder="Cari karyawan" options={userOptions} />
          <SearchableSelect name="typeId" required placeholder="Cari jenis sertifikasi" options={typeOptions} />
          <input name="certNumber" required placeholder="No. sertifikat" className="h-10 px-3 rounded-md border border-border bg-background text-sm" />
          <input name="issuer" placeholder="Penerbit di sertifikat" className="h-10 px-3 rounded-md border border-border bg-background text-sm" />
          <input name="issueDate" type="date" className="h-10 px-3 rounded-md border border-border bg-background text-sm" />
          <input name="expiryDate" type="date" className="h-10 px-3 rounded-md border border-border bg-background text-sm" />
          <input name="notes" placeholder="Catatan" className="h-10 px-3 rounded-md border border-border bg-background text-sm lg:col-span-2" />
          <button type="submit" className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Simpan
          </button>
        </form>
      </section>

      <ExternalCertificateImportForm action={importExternalCertificates} />

      <section className="border border-border rounded-xl bg-card shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="text-lg font-semibold">Daftar Sertifikat Eksternal</h2>
        </div>
        <div className="divide-y divide-border">
          {certRows.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">Belum ada sertifikat eksternal di site ini.</div>
          ) : certRows.map((cert) => (
            <details key={cert.id} className="group">
              <summary className="p-4 cursor-pointer list-none hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto] md:items-center">
                  <div>
                    <div className="font-semibold">{cert.userName}</div>
                    <div className="text-xs text-gray-500 font-mono">{cert.certNumber}</div>
                  </div>
                  <div className="text-sm text-gray-500">{types.find((type) => type.id === cert.typeId)?.name ?? '-'}</div>
                  <div className="text-sm text-gray-500">
                    {cert.issueDate ? cert.issueDate.toLocaleDateString('id-ID') : '-'} - {cert.expiryDate ? cert.expiryDate.toLocaleDateString('id-ID') : 'Tidak ada'}
                  </div>
                  <span className="text-sm text-primary font-medium">Edit</span>
                </div>
              </summary>
              <form action={updateExternalCertificateForm} className="p-4 pt-0 grid gap-3 lg:grid-cols-3">
                <input type="hidden" name="id" value={cert.id} />
                <SearchableSelect name="userId" required placeholder="Cari karyawan" options={userOptions} defaultValue={cert.userId} />
                <SearchableSelect name="typeId" required placeholder="Cari jenis sertifikasi" options={typeOptions} defaultValue={cert.typeId} />
                <input name="certNumber" required defaultValue={cert.certNumber} className="h-10 px-3 rounded-md border border-border bg-background text-sm" />
                <input name="issuer" defaultValue={cert.issuer ?? ''} className="h-10 px-3 rounded-md border border-border bg-background text-sm" />
                <input name="issueDate" type="date" defaultValue={dateInput(cert.issueDate)} className="h-10 px-3 rounded-md border border-border bg-background text-sm" />
                <input name="expiryDate" type="date" defaultValue={dateInput(cert.expiryDate)} className="h-10 px-3 rounded-md border border-border bg-background text-sm" />
                <input name="notes" defaultValue={cert.notes ?? ''} className="h-10 px-3 rounded-md border border-border bg-background text-sm lg:col-span-2" />
                <div className="flex gap-2">
                  <button type="submit" className="inline-flex flex-1 items-center justify-center gap-2 h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
                    <Save className="h-4 w-4" /> Simpan
                  </button>
                  <button formAction={deleteExternalCertificateForm.bind(null, cert.id)} type="submit" className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-md border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50">
                    <Trash2 className="h-4 w-4" /> Hapus
                  </button>
                </div>
              </form>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
