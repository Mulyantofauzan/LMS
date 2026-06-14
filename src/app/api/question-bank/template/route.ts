import { auth } from '@/auth';
import * as XLSX from 'xlsx';

const rows = [
  {
    type: 'multiple_choice',
    question: 'Apa kepanjangan dari SHE?',
    optionA: 'Safety Health Environment',
    optionB: 'System Heavy Equipment',
    optionC: 'Site Human Education',
    optionD: 'Safety Hazard Evaluation',
    correctAnswer: 'Safety Health Environment',
    mediaUrl: '',
    mediaType: '',
    mediaName: '',
  },
];

function toCsv() {
  const headers = Object.keys(rows[0]);
  const body = rows.map((row) => headers.map((header) => `"${String(row[header as keyof typeof row] ?? '').replace(/"/g, '""')}"`).join(','));
  return `${headers.join(',')}\n${body.join('\n')}\n`;
}

export async function GET(request: Request) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || !['trainer', 'super-admin', 'admin'].includes(role ?? '')) {
    return new Response('Unauthorized', { status: 401 });
  }

  const url = new URL(request.url);
  const format = url.searchParams.get('format') === 'xlsx' ? 'xlsx' : 'csv';
  if (format === 'xlsx') {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), 'question-template');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
    return new Response(new Uint8Array(buffer), {
      headers: {
        'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'content-disposition': 'attachment; filename="question-bank-template.xlsx"',
      },
    });
  }

  return new Response(toCsv(), {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="question-bank-template.csv"',
    },
  });
}
