import { NextResponse } from 'next/server';
import { generateCertificatePDF } from '@/lib/pdf-generator';
import { db } from '@/db';
import { certificates, trainings, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getTrainingMaterialObject } from '@/lib/r2-upload';

function formatDate(value: Date | null) {
  return value ? value.toLocaleDateString('id-ID') : null;
}

async function loadTemplate(url: string | null) {
  if (!url?.startsWith('/api/materials/')) return null;
  const key = decodeURIComponent(url.replace('/api/materials/', ''));
  const object = await getTrainingMaterialObject(key);
  if (!object) return null;
  return {
    bytes: await object.arrayBuffer(),
    contentType: object.httpMetadata?.contentType ?? null,
  };
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const certNumber = decodeURIComponent(id);
    const certificate = await db.select({
      certNumber: certificates.certNumber,
      issueDate: certificates.issueDate,
      expiryDate: certificates.expiryDate,
      participantName: users.name,
      trainingTitle: trainings.title,
      templateUrl: trainings.certificateTemplateUrl,
      templateConfig: trainings.certificateTemplateConfig,
    })
    .from(certificates)
    .innerJoin(users, eq(certificates.userId, users.id))
    .innerJoin(trainings, eq(certificates.trainingId, trainings.id))
    .where(eq(certificates.certNumber, certNumber))
    .get();

    if (!certificate) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
    }

    const template = await loadTemplate(certificate.templateUrl);
    
    const pdfBytes = await generateCertificatePDF(
      certificate.participantName,
      certificate.trainingTitle,
      certificate.certNumber,
      formatDate(certificate.issueDate) ?? '-',
      formatDate(certificate.expiryDate),
      template,
      certificate.templateConfig,
    );

    return new NextResponse(Buffer.from(pdfBytes) as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="certificate-${id}.pdf"`
      }
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
