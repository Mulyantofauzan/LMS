import { db } from '@/db';
import { certificates, trainings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getExternalCertificatesForUsers } from '@/lib/tna';

export type CertificateCardData = {
  source: 'internal' | 'external';
  title: string;
  certNo: string;
  issued: Date | null;
  expiry: Date | null;
  issuer: string | null;
};

export async function getPersonalCertificateCards(userId: number) {
  const internalCerts = await db.select({
    title: trainings.title,
    certNo: certificates.certNumber,
    issued: certificates.issueDate,
    expiry: certificates.expiryDate,
  })
    .from(certificates)
    .innerJoin(trainings, eq(certificates.trainingId, trainings.id))
    .where(eq(certificates.userId, userId));

  const externalCerts = await getExternalCertificatesForUsers([userId]);

  return [
    ...internalCerts.map((cert) => ({
      source: 'internal' as const,
      title: cert.title,
      certNo: cert.certNo,
      issued: cert.issued,
      expiry: cert.expiry,
      issuer: null,
    })),
    ...externalCerts.map((cert) => ({
      source: 'external' as const,
      title: cert.typeName,
      certNo: cert.certNumber,
      issued: cert.issueDate,
      expiry: cert.expiryDate,
      issuer: cert.issuer ?? cert.typeIssuer,
    })),
  ].sort((a, b) => (b.issued?.getTime() ?? 0) - (a.issued?.getTime() ?? 0));
}
