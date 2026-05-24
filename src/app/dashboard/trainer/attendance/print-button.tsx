'use client';

import { Printer } from 'lucide-react';

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border bg-background text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 print:hidden"
    >
      <Printer className="h-4 w-4" />
      Cetak Absensi
    </button>
  );
}
