import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';

export async function generateCertificatePDF(
  traineeName: string,
  trainingTitle: string,
  certNumber: string,
  issueDate: string
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([842, 595]); // A4 Landscape

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  // Background
  page.drawRectangle({
    x: 0, y: 0, width: 842, height: 595,
    color: rgb(0.97, 0.98, 0.99)
  });

  // Border
  page.drawRectangle({
    x: 20, y: 20, width: 802, height: 555,
    borderColor: rgb(0.1, 0.4, 0.8),
    borderWidth: 4,
    color: rgb(1, 1, 1)
  });

  page.drawText('PST Learning Management System', {
    x: 240, y: 520, size: 20, font: fontBold, color: rgb(0.1, 0.4, 0.8)
  });

  page.drawText('CERTIFICATE OF COMPLETION', {
    x: 170, y: 440, size: 36, font: fontBold, color: rgb(0.2, 0.2, 0.2)
  });

  page.drawText('This certifies that', {
    x: 360, y: 380, size: 16, font
  });

  // Calculate center x for trainee name
  const nameWidth = fontBold.widthOfTextAtSize(traineeName, 32);
  page.drawText(traineeName, {
    x: 421 - (nameWidth / 2),
    y: 330, size: 32, font: fontBold, color: rgb(0.1, 0.4, 0.8)
  });

  page.drawText('has successfully completed the training requirements for', {
    x: 250, y: 280, size: 14, font
  });

  const titleWidth = fontBold.widthOfTextAtSize(trainingTitle, 24);
  page.drawText(trainingTitle, {
    x: 421 - (titleWidth / 2),
    y: 230, size: 24, font: fontBold
  });

  page.drawText(`Date: ${issueDate}`, { x: 150, y: 150, size: 14, font });
  page.drawText(`Certificate ID: ${certNumber}`, { x: 150, y: 130, size: 12, font, color: rgb(0.5, 0.5, 0.5) });

  // QR Code
  const qrDataUrl = await QRCode.toDataURL(`https://pst-lms.com/verify/${certNumber}`, { margin: 1 });
  const qrImage = await doc.embedPng(qrDataUrl);
  page.drawImage(qrImage, { x: 600, y: 100, width: 100, height: 100 });

  return await doc.save();
}
