import { db } from "@/db";
import { attendance, certificates, enrollments, exams, trainingSessions, trainings } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";

function addMonths(date: Date, months: number | null) {
  if (!months || months <= 0) return null;
  const expiry = new Date(date);
  expiry.setMonth(expiry.getMonth() + months);
  return expiry;
}

function formatCertificateNumber(format: string, trainingCode: string, issueDate: Date, sequence: number) {
  const year = String(issueDate.getFullYear());
  const seq = String(sequence).padStart(4, "0");

  return format
    .replaceAll("{TRAINING_CODE}", trainingCode)
    .replaceAll("{YEAR}", year)
    .replaceAll("{SEQ}", seq);
}

async function nextCertificateNumber(trainingId: number, trainingCode: string, issueDate: Date, format: string) {
  const existing = await db.select({ certNumber: certificates.certNumber })
    .from(certificates)
    .where(eq(certificates.trainingId, trainingId));

  return formatCertificateNumber(format, trainingCode, issueDate, existing.length + 1);
}

export async function issueCertificateIfEligible(sessionId: number, userId: number) {
  const session = await db.select({
    trainingId: trainingSessions.trainingId,
    endedAt: trainingSessions.endedAt,
    endTime: trainingSessions.endTime,
    trainingTitle: trainings.title,
    trainingCode: trainings.trainingCode,
    certificateEnabled: trainings.certificateEnabled,
    validityMonths: trainings.certificateValidityMonths,
    passingScore: trainings.certificatePassingScore,
    numberFormat: trainings.certificateNumberFormat,
  })
  .from(trainingSessions)
  .innerJoin(trainings, eq(trainingSessions.trainingId, trainings.id))
  .where(eq(trainingSessions.id, sessionId))
  .get();

  if (!session?.certificateEnabled) return null;

  const present = await db.select({ id: attendance.id })
    .from(attendance)
    .where(and(
      eq(attendance.sessionId, sessionId),
      eq(attendance.traineeId, userId),
      inArray(attendance.status, ["present", "late"]),
    ))
    .get();
  if (!present) return null;

  const posttest = await db.select({ score: exams.score })
    .from(exams)
    .where(and(eq(exams.sessionId, sessionId), eq(exams.traineeId, userId), eq(exams.type, "posttest")))
    .get();
  if ((posttest?.score ?? -1) < session.passingScore) return null;

  const existing = await db.select({ id: certificates.id })
    .from(certificates)
    .where(and(eq(certificates.userId, userId), eq(certificates.trainingId, session.trainingId)))
    .get();
  if (existing) return existing;

  const issueDate = session.endedAt ?? session.endTime ?? new Date();
  const trainingCode = (session.trainingCode || session.trainingTitle || `TRN-${session.trainingId}`)
    .trim()
    .replace(/\s+/g, "-")
    .toUpperCase();
  const certNumber = await nextCertificateNumber(session.trainingId, trainingCode, issueDate, session.numberFormat);

  const created = await db.insert(certificates).values({
    userId,
    trainingId: session.trainingId,
    certNumber,
    url: `/api/certificate/${encodeURIComponent(certNumber)}`,
    issueDate,
    expiryDate: addMonths(issueDate, session.validityMonths),
  }).returning({ id: certificates.id });

  return created[0] ?? null;
}

export async function issueCertificatesForSession(sessionId: number) {
  const participants = await db.select({ userId: enrollments.traineeId })
    .from(enrollments)
    .where(eq(enrollments.sessionId, sessionId));

  for (const participant of participants) {
    await issueCertificateIfEligible(sessionId, participant.userId);
  }
}
