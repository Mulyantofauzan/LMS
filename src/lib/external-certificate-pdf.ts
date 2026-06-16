import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export async function generateExternalCertificatePDF(certNumber: string) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]);
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const text = certNumber || '-';
  const size = 22;
  const width = font.widthOfTextAtSize(text, size);
  page.drawRectangle({ x: 0, y: 0, width: 595, height: 842, color: rgb(1, 1, 1) });
  page.drawText(text, {
    x: 297.5 - width / 2,
    y: 421,
    size,
    font,
    color: rgb(0.05, 0.07, 0.12),
  });
  return doc.save();
}
