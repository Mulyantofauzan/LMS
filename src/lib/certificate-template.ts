export const CERTIFICATE_TEMPLATE_WIDTH = 842;
export const CERTIFICATE_TEMPLATE_HEIGHT = 595;

export const certificateTemplateFieldLabels = {
  participantName: 'Nama peserta',
  trainingTitle: 'Nama training',
  certificateNumber: 'Nomor sertifikat',
  issueDate: 'Tanggal terbit',
  expiryDate: 'Tanggal kedaluwarsa',
  qrCode: 'QR verifikasi',
} as const;

export type CertificateTemplateFieldKey = keyof typeof certificateTemplateFieldLabels;
export type CertificateTextAlign = 'left' | 'center' | 'right';

export type CertificateTemplateField = {
  x: number;
  y: number;
  fontSize?: number;
  size?: number;
  align?: CertificateTextAlign;
  visible?: boolean;
};

export type CertificateTemplateConfig = {
  fields: Record<CertificateTemplateFieldKey, CertificateTemplateField>;
};

export const defaultCertificateTemplateConfig: CertificateTemplateConfig = {
  fields: {
    participantName: { x: 421, y: 330, fontSize: 32, align: 'center', visible: true },
    trainingTitle: { x: 421, y: 230, fontSize: 24, align: 'center', visible: true },
    certificateNumber: { x: 150, y: 130, fontSize: 12, align: 'left', visible: true },
    issueDate: { x: 150, y: 150, fontSize: 14, align: 'left', visible: true },
    expiryDate: { x: 150, y: 110, fontSize: 12, align: 'left', visible: true },
    qrCode: { x: 600, y: 100, size: 100, visible: true },
  },
};

const fieldKeys = Object.keys(certificateTemplateFieldLabels) as CertificateTemplateFieldKey[];

function clampNumber(value: unknown, fallback: number, min: number, max: number) {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function normalizeAlign(value: unknown, fallback: CertificateTextAlign = 'left') {
  return value === 'center' || value === 'right' || value === 'left' ? value : fallback;
}

export function normalizeCertificateTemplateConfig(input: unknown): CertificateTemplateConfig {
  const source = input && typeof input === 'object'
    ? input as { fields?: Record<string, CertificateTemplateField> }
    : {};

  const fields = fieldKeys.reduce((acc, key) => {
    const fallback = defaultCertificateTemplateConfig.fields[key];
    const current = (source.fields?.[key] ?? {}) as Partial<CertificateTemplateField>;

    acc[key] = {
      x: clampNumber(current.x, fallback.x, 0, CERTIFICATE_TEMPLATE_WIDTH),
      y: clampNumber(current.y, fallback.y, 0, CERTIFICATE_TEMPLATE_HEIGHT),
      visible: typeof current.visible === 'boolean' ? current.visible : fallback.visible ?? true,
    };

    if (key === 'qrCode') {
      acc[key].size = clampNumber(current.size, fallback.size ?? 100, 32, 240);
    } else {
      acc[key].fontSize = clampNumber(current.fontSize, fallback.fontSize ?? 14, 8, 72);
      acc[key].align = normalizeAlign(current.align, fallback.align);
    }

    return acc;
  }, {} as CertificateTemplateConfig['fields']);

  return { fields };
}
