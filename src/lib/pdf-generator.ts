import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';
import {
  type CertificateTemplateField,
  CERTIFICATE_TEMPLATE_HEIGHT,
  CERTIFICATE_TEMPLATE_WIDTH,
  normalizeCertificateTemplateConfig,
} from '@/lib/certificate-template';

export async function generateCertificatePDF(
  traineeName: string,
  trainingTitle: string,
  certNumber: string,
  issueDate: string,
  expiryDate?: string | null,
  template?: { bytes: ArrayBuffer; contentType?: string | null } | null,
  templateConfig?: unknown,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([CERTIFICATE_TEMPLATE_WIDTH, CERTIFICATE_TEMPLATE_HEIGHT]);

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const config = normalizeCertificateTemplateConfig(templateConfig);

  if (template?.bytes) {
    try {
      const contentType = template.contentType ?? '';
      const image = contentType.includes('jpeg') || contentType.includes('jpg')
        ? await doc.embedJpg(template.bytes)
        : await doc.embedPng(template.bytes);
      page.drawImage(image, { x: 0, y: 0, width: CERTIFICATE_TEMPLATE_WIDTH, height: CERTIFICATE_TEMPLATE_HEIGHT });
    } catch {
      page.drawRectangle({ x: 0, y: 0, width: CERTIFICATE_TEMPLATE_WIDTH, height: CERTIFICATE_TEMPLATE_HEIGHT, color: rgb(0.97, 0.98, 0.99) });
    }
  } else {
    page.drawRectangle({
      x: 0, y: 0, width: CERTIFICATE_TEMPLATE_WIDTH, height: CERTIFICATE_TEMPLATE_HEIGHT,
      color: rgb(0.97, 0.98, 0.99)
    });

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

    page.drawText('has successfully completed the training requirements for', {
      x: 250, y: 280, size: 14, font
    });
  }

  function drawText(value: string | null | undefined, field: CertificateTemplateField, bold = false, color = rgb(0.12, 0.15, 0.22)) {
    if (!value || field.visible === false) return;
    const size = field.fontSize ?? 14;
    const usedFont = bold ? fontBold : font;
    const width = usedFont.widthOfTextAtSize(value, size);
    const x = field.align === 'center'
      ? field.x - width / 2
      : field.align === 'right'
        ? field.x - width
        : field.x;

    page.drawText(value, { x, y: field.y, size, font: usedFont, color });
  }

  drawText(traineeName, config.fields.participantName, true, rgb(0.1, 0.4, 0.8));
  drawText(trainingTitle, config.fields.trainingTitle, true);
  drawText(certNumber, config.fields.certificateNumber, false, rgb(0.38, 0.41, 0.48));
  drawText(issueDate, config.fields.issueDate);
  drawText(expiryDate, config.fields.expiryDate, false, rgb(0.38, 0.41, 0.48));

  if (config.fields.qrCode.visible !== false) {
    const qrDataUrl = await QRCode.toDataURL(`https://pst-lms.com/verify/${certNumber}`, { margin: 1 });
    const qrImage = await doc.embedPng(qrDataUrl);
    const size = config.fields.qrCode.size ?? 100;
    page.drawImage(qrImage, { x: config.fields.qrCode.x, y: config.fields.qrCode.y, width: size, height: size });
  }

  return await doc.save();
}
