import type { TnaResultRow } from '@/lib/tna';
import { CheckCircle2, ExternalLink, XCircle } from 'lucide-react';

type ExternalCertificateRow = {
  id: number;
  typeName: string;
  issuer: string | null;
  typeIssuer: string | null;
  certNumber: string;
  issueDate: Date | null;
  expiryDate: Date | null;
};

export function ExternalPassportSections({
  externalCertificates,
  tnaRows,
}: {
  externalCertificates: ExternalCertificateRow[];
  tnaRows: TnaResultRow[];
}) {
  return (
    <>
      <section className="p-6 border border-border rounded-xl bg-card shadow-sm">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-foreground">Sertifikasi Eksternal</h2>
          <p className="text-sm text-gray-500">Sertifikat luar yang diinput oleh admin dan dapat memenuhi TNA jika ada mapping ekuivalensi.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 uppercase border-b border-border">
              <tr>
                <th className="px-6 py-3 font-medium">Sertifikasi</th>
                <th className="px-6 py-3 font-medium">Penerbit</th>
                <th className="px-6 py-3 font-medium">No. Sertifikat</th>
                <th className="px-6 py-3 font-medium">Terbit</th>
                <th className="px-6 py-3 font-medium">Kedaluwarsa</th>
                <th className="px-6 py-3 font-medium">PDF</th>
              </tr>
            </thead>
            <tbody>
              {externalCertificates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Belum ada sertifikasi eksternal.</td>
                </tr>
              ) : externalCertificates.map((cert) => (
                <tr key={cert.id} className="border-b border-border last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 font-medium">{cert.typeName}</td>
                  <td className="px-6 py-4 text-gray-500">{cert.issuer ?? cert.typeIssuer ?? '-'}</td>
                  <td className="px-6 py-4 text-gray-500 font-mono text-xs">{cert.certNumber}</td>
                  <td className="px-6 py-4 text-gray-500">{cert.issueDate ? cert.issueDate.toLocaleDateString('id-ID') : '-'}</td>
                  <td className="px-6 py-4 text-gray-500">{cert.expiryDate ? cert.expiryDate.toLocaleDateString('id-ID') : 'Tidak ada'}</td>
                  <td className="px-6 py-4">
                    <a
                      href={`/api/certificate/${encodeURIComponent(cert.certNumber)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-primary font-medium hover:underline"
                    >
                      Buka <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="p-6 border border-border rounded-xl bg-card shadow-sm">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-foreground">Kebutuhan Training (TNA)</h2>
          <p className="text-sm text-gray-500">Gap mandatory memengaruhi compliance. Development tampil sebagai rencana pengembangan.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 uppercase border-b border-border">
              <tr>
                <th className="px-6 py-3 font-medium">Pelatihan</th>
                <th className="px-6 py-3 font-medium">Jenis</th>
                <th className="px-6 py-3 font-medium">Periode</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Pemenuhan</th>
              </tr>
            </thead>
            <tbody>
              {tnaRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Belum ada kebutuhan TNA untuk Anda.</td>
                </tr>
              ) : tnaRows.map((row) => (
                <tr key={`${row.requirementId}-${row.userId}`} className="border-b border-border last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 font-medium">{row.trainingTitle}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full ${
                      row.requirementType === 'mandatory'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    }`}>
                      {row.requirementType === 'mandatory' ? 'mandatory' : 'development'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {row.recurrence === 'once' ? 'Sekali selama bekerja' : row.recurrence === 'annual' ? `Tahunan ${row.effectiveYear ?? ''}` : `Setiap ${row.intervalMonths ?? '-'} bulan`}
                  </td>
                  <td className="px-6 py-4">
                    {row.fulfilled ? (
                      <span className="inline-flex items-center gap-1 text-green-600 text-xs font-semibold"><CheckCircle2 className="h-3.5 w-3.5" /> Terpenuhi</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-600 text-xs font-semibold"><XCircle className="h-3.5 w-3.5" /> Gap</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {row.fulfilledBy === 'internal' ? 'Sertifikat internal' : row.fulfilledBy === 'external' ? 'Sertifikasi eksternal ekuivalen' : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
