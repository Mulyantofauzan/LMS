import { NextResponse } from 'next/server';
import { generateCertificatePDF } from '@/lib/pdf-generator';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // In a real app, fetch certificate details from DB here using `id`.
    // For Phase 2 demo, we generate a mock valid certificate.
    const pdfBytes = await generateCertificatePDF(
      "Emily Trainee",
      "Hazardous Materials Handling",
      id,
      new Date().toLocaleDateString()
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
