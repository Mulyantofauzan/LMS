import { auth } from '@/auth';
import * as XLSX from 'xlsx';

type TemplateType = 'employees' | 'certifications' | 'accounts';

const templates: Record<TemplateType, Record<string, string>[]> = {
  employees: [
    {
      name: 'Budi Santoso',
      email: 'budi@example.com',
      role: 'trainee',
      jobsiteId: '1',
      department: 'Operations',
      position: 'Operator',
    },
  ],
  accounts: [
    {
      name: 'Siti Aminah',
      email: 'siti@example.com',
      role: 'trainer',
      jobsiteId: '1',
      department: 'HSE',
      position: 'Trainer',
      password: 'password123',
    },
  ],
  certifications: [
    {
      userEmail: 'trainee@demo.com',
      trainingTitle: 'Keselamatan Kerja Dasar (HSE Basic)',
      certNumber: 'CERT-HSE-2026-999',
      issueDate: '2026-05-24',
      expiryDate: '2027-05-24',
      url: '',
    },
  ],
};

function toCsv(rows: Record<string, string>[]) {
  const headers = Object.keys(rows[0]);
  const body = rows.map((row) => headers.map((header) => `"${String(row[header] ?? '').replace(/"/g, '""')}"`).join(','));
  return `${headers.join(',')}\n${body.join('\n')}\n`;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ type: string }> },
) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || !['super-admin', 'admin'].includes(role ?? '')) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { type } = await params;
  if (!['employees', 'certifications', 'accounts'].includes(type)) {
    return new Response('Template not found', { status: 404 });
  }

  const url = new URL(request.url);
  const format = url.searchParams.get('format') === 'xlsx' ? 'xlsx' : 'csv';
  const rows = templates[type as TemplateType];

  if (format === 'xlsx') {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), 'template');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
    return new Response(new Uint8Array(buffer), {
      headers: {
        'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'content-disposition': `attachment; filename="${type}-template.xlsx"`,
      },
    });
  }

  return new Response(toCsv(rows), {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="${type}-template.csv"`,
    },
  });
}
