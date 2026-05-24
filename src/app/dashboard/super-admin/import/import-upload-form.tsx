'use client';

import { useRef, useState, useTransition } from 'react';
import * as XLSX from 'xlsx';
import { FileSpreadsheet, Upload } from 'lucide-react';

type ImportAction = (formData: FormData) => Promise<void>;

export function ImportUploadForm({
  title,
  description,
  action,
  templateType,
  defaultPassword,
}: {
  title: string;
  description: string;
  action: ImportAction;
  templateType: 'employees' | 'certifications' | 'accounts';
  defaultPassword?: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function parseFile(file: File) {
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
        setError(null);
        try {
          await action(formData);
          formRef.current?.reset();
          setPreview([]);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Import gagal.');
        }
      })}
      className="border border-border rounded-xl bg-card p-6 shadow-sm space-y-4"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold flex items-center gap-2"><Upload className="h-4 w-4 text-primary" /> {title}</h2>
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        </div>
        <div className="flex gap-2 text-xs">
          <a href={`/api/import/templates/${templateType}?format=csv`} className="px-2.5 py-1 rounded-md border border-border hover:bg-gray-50 dark:hover:bg-gray-800">CSV</a>
          <a href={`/api/import/templates/${templateType}?format=xlsx`} className="px-2.5 py-1 rounded-md border border-border hover:bg-gray-50 dark:hover:bg-gray-800">XLSX</a>
        </div>
      </div>

      <input type="hidden" name="rowsJson" />
      {defaultPassword && (
        <input name="defaultPassword" defaultValue="password123" minLength={6} className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm" />
      )}

      <label className="min-h-32 flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-background p-4 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
        <FileSpreadsheet className="h-8 w-8 text-primary" />
        <span className="text-sm font-medium">Upload file CSV/XLSX</span>
        <span className="text-xs text-gray-500">Parser berjalan di browser sebelum dikirim ke server.</span>
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

      {error && <div className="text-xs text-red-600">{error}</div>}
      <button type="submit" disabled={isPending || preview.length === 0} className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
        {isPending ? 'Mengimpor...' : 'Import Data'}
      </button>
    </form>
  );
}
