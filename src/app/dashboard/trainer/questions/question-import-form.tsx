'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
import { importQuestionsForm } from '@/lib/actions/question-actions';
import { Upload } from 'lucide-react';

export function QuestionImportForm({
  trainings,
  questionSets,
}: {
  trainings: { id: number; title: string }[];
  questionSets: { id: number; title: string; trainingId: number }[];
}) {
  const [trainingId, setTrainingId] = useState('');
  const [rowsJson, setRowsJson] = useState('');
  const filteredSets = questionSets.filter((set) => String(set.trainingId) === trainingId);

  async function onFileChange(file: File | null) {
    if (!file) return;
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' });
    setRowsJson(JSON.stringify(rows));
  }

  return (
    <form action={importQuestionsForm} className="space-y-3">
      <input type="hidden" name="rowsJson" value={rowsJson} />
      <select name="trainingId" required value={trainingId} onChange={(event) => setTrainingId(event.target.value)} className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm">
        <option value="">Pilih pelatihan</option>
        {trainings.map((training) => (
          <option key={training.id} value={training.id}>{training.title}</option>
        ))}
      </select>
      <select name="questionSetId" required className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm">
        <option value="">Pilih paket soal</option>
        {filteredSets.map((set) => (
          <option key={set.id} value={set.id}>{set.title}</option>
        ))}
      </select>
      <input type="file" accept=".xlsx,.xls,.csv" onChange={(event) => onFileChange(event.target.files?.[0] ?? null)} className="w-full text-sm" />
      <button type="submit" disabled={!rowsJson} className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md shadow-sm hover:bg-primary/90 text-sm font-medium disabled:opacity-50">
        <Upload className="h-4 w-4" />
        Import Soal
      </button>
    </form>
  );
}
