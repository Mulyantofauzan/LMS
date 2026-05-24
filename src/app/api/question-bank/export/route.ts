import { auth } from '@/auth';
import { db } from '@/db';
import { questionBank } from '@/db/schema';
import { eq } from 'drizzle-orm';

function toCsv(rows: Record<string, string>[]) {
  if (rows.length === 0) return 'type,question,optionA,optionB,optionC,optionD,correctAnswer\n';
  const headers = Object.keys(rows[0]);
  const body = rows.map((row) => headers.map((header) => `"${String(row[header] ?? '').replace(/"/g, '""')}"`).join(','));
  return `${headers.join(',')}\n${body.join('\n')}\n`;
}

export async function GET(request: Request) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || !['trainer', 'super-admin', 'admin'].includes(role ?? '')) {
    return new Response('Unauthorized', { status: 401 });
  }

  const url = new URL(request.url);
  const setId = Number(url.searchParams.get('setId'));
  if (!setId) return new Response('Missing setId', { status: 400 });

  const questions = await db.select().from(questionBank).where(eq(questionBank.questionSetId, setId)).orderBy(questionBank.id);
  const rows = questions.map((question) => {
    const options = Array.isArray(question.options) ? question.options as string[] : [];
    return {
      type: question.type,
      question: question.question,
      optionA: options[0] ?? '',
      optionB: options[1] ?? '',
      optionC: options[2] ?? '',
      optionD: options[3] ?? '',
      correctAnswer: question.correctAnswer ?? '',
    };
  });

  return new Response(toCsv(rows), {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="question-bank-${setId}.csv"`,
    },
  });
}
