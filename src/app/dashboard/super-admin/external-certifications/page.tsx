import { auth } from '@/auth';
import { db } from '@/db';
import {
  externalCertificateEquivalencies,
  externalCertificates,
  externalCertificateTypes,
  trainings,
  users,
} from '@/db/schema';
import {
  createExternalCertificateForm,
  createExternalCertificateTypeForm,
  createExternalEquivalencyForm,
  deleteExternalCertificateForm,
  deleteExternalCertificateTypeForm,
  deleteExternalEquivalencyForm,
  importExternalCertificates,
} from '@/lib/actions/external-certificate-actions';
import { ExternalCertificateImportForm } from '@/components/certificates/ExternalCertificateImportForm';
import { SearchableSelect } from '@/components/forms/SearchableSelect';
import { eq } from 'drizzle-orm';
import { Award, Link2, Plus, Trash2 } from 'lucide-react';
import { redirect } from 'next/navigation';

type SessionUser = {
  role?: string | null;
};

export default async function ExternalCertificationsPage() {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  if (!['super-admin', 'admin'].includes(user?.role ?? '')) redirect('/dashboard');

  const [types, trainingRows, traineeRows, equivalencies, certRows] = await Promise.all([
    db.select().from(externalCertificateTypes).orderBy(externalCertificateTypes.name),
    db.select({ id: trainings.id, title: trainings.title }).from(trainings).orderBy(trainings.title),
    db.select({ id: users.id, name: users.name, nrp: users.nrp }).from(users).orderBy(users.name),
    db.select({
      id: externalCertificateEquivalencies.id,
      typeName: externalCertificateTypes.name,
      trainingTitle: trainings.title,
    })
      .from(externalCertificateEquivalencies)
      .innerJoin(externalCertificateTypes, eq(externalCertificateEquivalencies.externalTypeId, externalCertificateTypes.id))
      .innerJoin(trainings, eq(externalCertificateEquivalencies.trainingId, trainings.id))
      .orderBy(externalCertificateTypes.name),
    db.select({
      id: externalCertificates.id,
      userName: users.name,
      typeName: externalCertificateTypes.name,
      certNumber: externalCertificates.certNumber,
      issuer: externalCertificates.issuer,
      issueDate: externalCertificates.issueDate,
      expiryDate: externalCertificates.expiryDate,
    })
      .from(externalCertificates)
      .innerJoin(users, eq(externalCertificates.userId, users.id))
      .innerJoin(externalCertificateTypes, eq(externalCertificates.typeId, externalCertificateTypes.id))
      .orderBy(externalCertificates.issueDate),
  ]);
  const typeOptions = types.map((type) => ({ value: type.id, label: type.name }));
  const trainingOptions = trainingRows.map((training) => ({ value: training.id, label: training.title }));
  const traineeOptions = traineeRows.map((row) => ({
    value: row.id,
    label: `${row.name}${row.nrp ? ` (${row.nrp})` : ''}`,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Sertifikasi Eksternal</h1>
        <p className="text-gray-500 dark:text-gray-400">Kelola master sertifikasi eksternal, ekuivalensi training, dan input sertifikat karyawan.</p>
      </div>

      <section className="border border-border rounded-xl bg-card shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Master Sertifikasi</h2>
        </div>
        <form action={createExternalCertificateTypeForm} className="p-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          <input name="name" required placeholder="Nama sertifikasi" className="h-10 min-w-0 px-3 rounded-md border border-border bg-background text-sm" />
          <input name="issuer" placeholder="Penerbit" className="h-10 min-w-0 px-3 rounded-md border border-border bg-background text-sm" />
          <input name="defaultValidityMonths" type="number" min="1" placeholder="Berlaku bulan" className="h-10 min-w-0 px-3 rounded-md border border-border bg-background text-sm" />
          <input name="description" placeholder="Catatan" className="h-10 min-w-0 px-3 rounded-md border border-border bg-background text-sm" />
          <button type="submit" className="inline-flex w-full min-w-0 items-center justify-center gap-2 h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Tambah
          </button>
        </form>
        <div className="divide-y divide-border">
          {types.length === 0 ? (
            <div className="p-5 text-sm text-gray-500">Belum ada master sertifikasi eksternal.</div>
          ) : types.map((type) => (
            <div key={type.id} className="p-4 grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto] md:items-center">
              <div>
                <div className="font-semibold">{type.name}</div>
                <div className="text-xs text-gray-500">{type.description || '-'}</div>
              </div>
              <div className="text-sm text-gray-500">{type.issuer || '-'}</div>
              <div className="text-sm text-gray-500">{type.defaultValidityMonths ? `${type.defaultValidityMonths} bulan` : 'Tanpa default'}</div>
              <form action={deleteExternalCertificateTypeForm.bind(null, type.id)}>
                <button type="submit" className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50">
                  <Trash2 className="h-4 w-4" /> Hapus
                </button>
              </form>
            </div>
          ))}
        </div>
      </section>

      <section className="border border-border rounded-xl bg-card shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border flex items-center gap-2">
          <Link2 className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Mapping Ekuivalensi</h2>
        </div>
        <form action={createExternalEquivalencyForm} className="p-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
          <SearchableSelect name="externalTypeId" required placeholder="Cari sertifikasi eksternal" options={typeOptions} />
          <SearchableSelect name="trainingId" required placeholder="Cari training internal ekuivalen" options={trainingOptions} />
          <button type="submit" className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Tambah
          </button>
        </form>
        <div className="divide-y divide-border">
          {equivalencies.length === 0 ? (
            <div className="p-5 text-sm text-gray-500">Belum ada mapping ekuivalensi.</div>
          ) : equivalencies.map((item) => (
            <div key={item.id} className="p-4 flex items-center justify-between gap-3">
              <div className="text-sm"><span className="font-semibold">{item.typeName}</span> memenuhi <span className="font-semibold">{item.trainingTitle}</span></div>
              <form action={deleteExternalEquivalencyForm.bind(null, item.id)}>
                <button type="submit" className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50">
                  <Trash2 className="h-4 w-4" /> Hapus
                </button>
              </form>
            </div>
          ))}
        </div>
      </section>

      <ExternalCertificateImportForm action={importExternalCertificates} />

      <section className="border border-border rounded-xl bg-card shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="text-lg font-semibold">Input Sertifikat Eksternal</h2>
        </div>
        <form action={createExternalCertificateForm} className="p-5 grid gap-3 lg:grid-cols-3">
          <SearchableSelect name="userId" required placeholder="Cari karyawan" options={traineeOptions} />
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
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 uppercase border-y border-border">
              <tr>
                <th className="px-6 py-3 font-medium">Karyawan</th>
                <th className="px-6 py-3 font-medium">Sertifikasi</th>
                <th className="px-6 py-3 font-medium">No.</th>
                <th className="px-6 py-3 font-medium">Terbit</th>
                <th className="px-6 py-3 font-medium">Kedaluwarsa</th>
                <th className="px-6 py-3 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {certRows.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Belum ada sertifikat eksternal.</td></tr>
              ) : certRows.map((cert) => (
                <tr key={cert.id} className="border-b border-border last:border-0">
                  <td className="px-6 py-4 font-medium">{cert.userName}</td>
                  <td className="px-6 py-4">{cert.typeName}</td>
                  <td className="px-6 py-4 font-mono text-xs text-gray-500">{cert.certNumber}</td>
                  <td className="px-6 py-4 text-gray-500">{cert.issueDate ? cert.issueDate.toLocaleDateString('id-ID') : '-'}</td>
                  <td className="px-6 py-4 text-gray-500">{cert.expiryDate ? cert.expiryDate.toLocaleDateString('id-ID') : 'Tidak ada'}</td>
                  <td className="px-6 py-4">
                    <form action={deleteExternalCertificateForm.bind(null, cert.id)}>
                      <button type="submit" className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50">
                        <Trash2 className="h-4 w-4" /> Hapus
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
