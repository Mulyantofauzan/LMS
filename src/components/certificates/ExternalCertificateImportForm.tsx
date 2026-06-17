'use client';

import { useRef, useState, useTransition } from 'react';
import * as XLSX from 'xlsx';
import { FileSpreadsheet, Upload } from 'lucide-react';
import Link from 'next/link';

type ImportResult = {
  success?: boolean;
  message?: string;
  error?: string;
};

export function ExternalCertificateImportForm({
  action,
}: {
  action: (formData: FormData) => Promise<ImportResult>;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function parseFile(file: File) {
    setMessage(null);
    setError(null);
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' });
    setPreview(rows.slice(0, 5));
    const hidden = formRef.current?.querySelector<HTMLInputElement>('input[name="rowsJson"]');
    if (hidden) hidden.value = JSON.stringify(rows);
  }

  return (
    <form
      ref={formRef}
      action={(formData) => startTransition(async () => {
        setMessage(null);
        setError(null);
        const result = await action(formData);
        if (result.error) {
          setError(result.error);
          return;
        }
        setMessage(result.message ?? 'Import sertifikat eksternal selesai.');
        formRef.current?.reset();
        setPreview([]);
      })}
      className="border border-border rounded-xl bg-card p-5 shadow-sm space-y-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-semibold flex items-center gap-2"><Upload className="h-4 w-4 text-primary" /> Import Sertifikat Eksternal</h2>
          <p className="text-xs text-gray-500 mt-1">Kolom: nrp/email, certificateType, issuer, certNumber, issueDate, expiryDate, notes.</p>
        </div>
        <div className="flex gap-2 text-xs">
          <Link href="/api/import/templates/external-certificates?format=csv" className="px-2.5 py-1 rounded-md border border-border hover:bg-gray-50 dark:hover:bg-gray-800">CSV</Link>
          <Link href="/api/import/templates/external-certificates?format=xlsx" className="px-2.5 py-1 rounded-md border border-border hover:bg-gray-50 dark:hover:bg-gray-800">XLSX</Link>
        </div>
      </div>

      <input type="hidden" name="rowsJson" />
      <label className="min-h-28 flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-background p-4 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
        <FileSpreadsheet className="h-8 w-8 text-primary" />
        <span className="text-sm font-medium">Upload file CSV/XLSX</span>
        <span className="text-xs text-gray-500">Sertifikat eksternal tidak menyimpan file asli, hanya data dan nomor sertifikat.</span>
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          className="sr-only"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            if (file) void parseFile(file);
          }}
        />
      </label>

      {preview.length > 0 && (
        <div className="rounded-md border border-border overflow-hidden">
          <div className="px-3 py-2 text-xs font-medium bg-gray-50 dark:bg-gray-900/50">Preview {preview.length} baris pertama</div>
          <pre className="p-3 text-[11px] overflow-x-auto">{JSON.stringify(preview, null, 2)}</pre>
        </div>
      )}

      {message && <div className="text-xs text-green-600">{message}</div>}
      {error && <div className="text-xs text-red-600">{error}</div>}
      <button type="submit" disabled={isPending || preview.length === 0} className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
        {isPending ? 'Mengimpor...' : 'Import Sertifikat Eksternal'}
      </button>
    </form>
  );
}
