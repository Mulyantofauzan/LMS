import type { CertificateCardData } from '@/lib/certificate-data';
import { Award, Download } from 'lucide-react';

function certificateStatus(expiry: Date | null) {
  if (!expiry) return { label: 'tanpa kedaluwarsa', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' };
  const now = Date.now();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  const expiryTime = expiry.getTime();
  if (expiryTime < now) return { label: 'kedaluwarsa', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' };
  if (expiryTime - now <= thirtyDays) return { label: 'akan kedaluwarsa', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' };
  return { label: 'aktif', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' };
}

export function CertificateCards({ certs }: { certs: CertificateCardData[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {certs.length === 0 ? (
        <div className="md:col-span-2 lg:col-span-3 p-8 border border-dashed border-border rounded-xl bg-card text-center text-sm text-gray-500">
          Belum ada sertifikat.
        </div>
      ) : certs.map((cert) => {
        const status = certificateStatus(cert.expiry);
        return (
          <div key={`${cert.source}-${cert.certNo}`} className="p-6 border border-border rounded-xl bg-card shadow-sm card-hover">
            <div className="flex items-start justify-between gap-3 mb-3">
              <Award className="h-8 w-8 text-amber-500" />
              <div className="flex flex-col items-end gap-1">
                <span className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full ${status.className}`}>{status.label}</span>
                <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                  {cert.source === 'internal' ? 'internal' : 'eksternal'}
                </span>
              </div>
            </div>
            <h3 className="font-bold text-lg mb-1">{cert.title}</h3>
            {cert.issuer ? <p className="text-xs text-gray-500 mb-1">{cert.issuer}</p> : null}
            <p className="text-xs text-gray-500 font-mono mb-1">ID: {cert.certNo}</p>
            <p className="text-xs text-gray-500 mb-1">Terbit: {cert.issued ? cert.issued.toLocaleDateString('id-ID') : '-'}</p>
            <p className="text-xs text-gray-500 mb-4">Kedaluwarsa: {cert.expiry ? cert.expiry.toLocaleDateString('id-ID') : 'Tidak ada'}</p>
            <a
              href={`/api/certificate/${encodeURIComponent(cert.certNo)}`}
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 text-sm font-medium transition-colors"
            >
              <Download className="h-4 w-4" /> Unduh PDF
            </a>
          </div>
        );
      })}
    </div>
  );
}
