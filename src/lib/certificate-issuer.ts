import { db } from "@/db";
import { attendance, certificateSequences, certificates, enrollments, exams, trainingSessions, trainings } from "@/db/schema";
import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { isCertificateEligible } from "@/lib/training-policy";

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
  const year = issueDate.getFullYear();
  const row = await db.insert(certificateSequences).values({
    trainingId,
    year,
    nextValue: 2,
  }).onConflictDoUpdate({
    target: [certificateSequences.trainingId, certificateSequences.year],
    set: {
      nextValue: sql`${certificateSequences.nextValue} + 1`,
    },
  }).returning({ nextValue: certificateSequences.nextValue });
  const sequence = Math.max(1, Number(row[0]?.nextValue ?? 2) - 1);
  return formatCertificateNumber(format, trainingCode, issueDate, sequence);
}

async function reserveCertificateNumbers(trainingId: number, year: number, count: number) {
  const row = await db.insert(certificateSequences).values({
    trainingId,
    year,
    nextValue: count + 1,
  }).onConflictDoUpdate({
    target: [certificateSequences.trainingId, certificateSequences.year],
    set: {
      nextValue: sql`${certificateSequences.nextValue} + ${count}`,
    },
  }).returning({ nextValue: certificateSequences.nextValue });
  const nextValue = Number(row[0]?.nextValue ?? count + 1);
  return Math.max(1, nextValue - count);
}

export async function issueCertificateIfEligible(sessionId: number, userId: number) {
  const session = await db.select({
    trainingId: trainingSessions.trainingId,
    status: trainingSessions.status,
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

  if (!session) return null;

  const present = await db.select({ id: attendance.id, status: attendance.status })
    .from(attendance)
    .where(and(
      eq(attendance.sessionId, sessionId),
      eq(attendance.traineeId, userId),
      inArray(attendance.status, ["present", "late"]),
    ))
    .get();
  const posttest = await db.select({ score: exams.score })
    .from(exams)
    .where(and(eq(exams.sessionId, sessionId), eq(exams.traineeId, userId), eq(exams.type, "posttest")))
    .get();
  if (!isCertificateEligible({
    sessionStatus: session.status,
    certificateEnabled: session.certificateEnabled,
    attendanceStatus: present?.status ?? null,
    posttestScore: posttest?.score ?? null,
    passingScore: session.passingScore,
  })) return null;

  const existing = await db.select({ id: certificates.id })
    .from(certificates)
    .where(and(eq(certificates.userId, userId), eq(certificates.sessionId, sessionId)))
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
    sessionId,
    certNumber,
    url: `/api/certificate/${encodeURIComponent(certNumber)}`,
    issueDate,
    expiryDate: addMonths(issueDate, session.validityMonths),
  }).returning({ id: certificates.id });

  return created[0] ?? null;
}

export async function issueCertificatesForSession(sessionId: number) {
  const session = await db.select({
    trainingId: trainingSessions.trainingId,
    status: trainingSessions.status,
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
  if (!session || session.status !== "ended" || !session.certificateEnabled) return [];

  const eligibleParticipants = await db.selectDistinct({ userId: enrollments.traineeId })
    .from(enrollments)
    .innerJoin(attendance, and(
      eq(attendance.sessionId, enrollments.sessionId),
      eq(attendance.traineeId, enrollments.traineeId),
    ))
    .innerJoin(exams, and(
      eq(exams.sessionId, enrollments.sessionId),
      eq(exams.traineeId, enrollments.traineeId),
      eq(exams.type, "posttest"),
    ))
    .where(and(
      eq(enrollments.sessionId, sessionId),
      inArray(attendance.status, ["present", "late"]),
      gte(exams.score, session.passingScore),
    ));
  if (eligibleParticipants.length === 0) return [];

  const existing = await db.select({ userId: certificates.userId })
    .from(certificates)
    .where(eq(certificates.sessionId, sessionId));
  const existingUserIds = new Set(existing.map((certificate) => certificate.userId));
  const pending = eligibleParticipants.filter((participant) => !existingUserIds.has(participant.userId));
  if (pending.length === 0) return [];

  const issueDate = session.endedAt ?? session.endTime ?? new Date();
  const trainingCode = (session.trainingCode || session.trainingTitle || `TRN-${session.trainingId}`)
    .trim()
    .replace(/\s+/g, "-")
    .toUpperCase();
  const firstSequence = await reserveCertificateNumbers(
    session.trainingId,
    issueDate.getFullYear(),
    pending.length,
  );
  const values = pending.map((participant, index) => {
    const certNumber = formatCertificateNumber(
      session.numberFormat,
      trainingCode,
      issueDate,
      firstSequence + index,
    );
    return {
      userId: participant.userId,
      trainingId: session.trainingId,
      sessionId,
      certNumber,
      url: `/api/certificate/${encodeURIComponent(certNumber)}`,
      issueDate,
      expiryDate: addMonths(issueDate, session.validityMonths),
    };
  });

  return db.insert(certificates).values(values)
    .onConflictDoNothing()
    .returning({ id: certificates.id });
}
