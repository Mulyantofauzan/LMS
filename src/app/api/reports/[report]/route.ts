import { auth } from '@/auth';
import { db } from '@/db';
import {
  attendance,
  auditLogs,
  certificates,
  enrollments,
  exams,
  jobsites,
  trainingSessions,
  trainings,
  users,
} from '@/db/schema';
import { and, eq, sql } from 'drizzle-orm';
import { getSessionUser } from '@/lib/session-user';

function csv(rows: Record<string, unknown>[]) {
  if (rows.length === 0) return 'message\n"No data"\n';
  const headers = Object.keys(rows[0]);
  const body = rows.map((row) => headers.map((header) => {
    const value = row[header];
    const text = value instanceof Date ? value.toISOString() : String(value ?? '');
    return `"${text.replace(/"/g, '""')}"`;
  }).join(','));
  return `${headers.join(',')}\n${body.join('\n')}\n`;
}

function download(filename: string, rows: Record<string, unknown>[]) {
  return new Response(csv(rows), {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="${filename}"`,
    },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ report: string }> },
) {
  const session = await auth();
  const sessionUser = getSessionUser(session?.user);
  const role = sessionUser?.role;
  if (!session?.user || !role || !['super-admin', 'site-admin', 'admin'].includes(role)) {
    return new Response('Unauthorized', { status: 401 });
  }
  const currentUser = await db.select({ jobsiteId: users.jobsiteId })
    .from(users)
    .where(eq(users.id, Number(sessionUser?.id)))
    .get();
  const siteJobsiteId = role === 'site-admin' ? currentUser?.jobsiteId ?? null : null;

  const { report } = await params;

  if (report === 'audit.csv') {
    const rows = await db.select({
      id: auditLogs.id,
      user: users.name,
      action: auditLogs.action,
      target: auditLogs.target,
      timestamp: auditLogs.timestamp,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.userId, users.id))
    .orderBy(auditLogs.timestamp);
    return download(report, rows);
  }

  if (report === 'attendance.csv') {
    const rows = await db.select({
      sessionId: trainingSessions.id,
      training: trainings.title,
      trainee: users.name,
      status: attendance.status,
      checkIn: attendance.checkIn,
      location: trainingSessions.location,
    })
    .from(attendance)
    .innerJoin(trainingSessions, eq(attendance.sessionId, trainingSessions.id))
    .innerJoin(trainings, eq(trainingSessions.trainingId, trainings.id))
    .innerJoin(users, eq(attendance.traineeId, users.id))
    .where(siteJobsiteId
      ? and(eq(users.jobsiteId, siteJobsiteId), eq(users.isActive, true))
      : eq(users.isActive, true))
    .orderBy(trainingSessions.startTime);
    return download(report, rows);
  }

  if (report === 'certificate-expiry.csv') {
    const rows = await db.select({
      certNumber: certificates.certNumber,
      user: users.name,
      training: trainings.title,
      issueDate: certificates.issueDate,
      expiryDate: certificates.expiryDate,
    })
    .from(certificates)
    .innerJoin(users, eq(certificates.userId, users.id))
    .innerJoin(trainings, eq(certificates.trainingId, trainings.id))
    .where(siteJobsiteId
      ? and(eq(users.jobsiteId, siteJobsiteId), eq(users.isActive, true))
      : eq(users.isActive, true))
    .orderBy(certificates.expiryDate);
    return download(report, rows);
  }

  if (report === 'training-matrix.csv' || report === 'site-summary.csv') {
    const rows = await db.select({
      user: users.name,
      email: users.email,
      jobsite: jobsites.name,
      training: trainings.title,
      enrollmentStatus: enrollments.status,
    })
    .from(enrollments)
    .innerJoin(users, eq(enrollments.traineeId, users.id))
    .innerJoin(trainingSessions, eq(enrollments.sessionId, trainingSessions.id))
    .innerJoin(trainings, eq(trainingSessions.trainingId, trainings.id))
    .leftJoin(jobsites, eq(users.jobsiteId, jobsites.id))
    .where(siteJobsiteId
      ? and(eq(users.jobsiteId, siteJobsiteId), eq(users.isActive, true))
      : eq(users.isActive, true))
    .orderBy(users.name);
    return download(report, rows);
  }

  if (report === 'trainer-performance.csv') {
    const rows = await db.select({
      trainer: users.name,
      sessions: sql<number>`count(distinct ${trainingSessions.id})`,
      exams: sql<number>`count(${exams.id})`,
      averageScore: sql<number>`round(avg(${exams.score}), 2)`,
    })
    .from(trainingSessions)
    .innerJoin(users, eq(trainingSessions.trainerId, users.id))
    .innerJoin(trainings, eq(trainingSessions.trainingId, trainings.id))
    .leftJoin(exams, eq(exams.sessionId, trainingSessions.id))
    .where(siteJobsiteId ? eq(trainings.jobsiteId, siteJobsiteId) : undefined)
    .groupBy(users.id);
    return download(report, rows);
  }

  if (report === 'compliance.csv') {
    const rows = await db.select({
      jobsite: jobsites.name,
      mandatoryTrainings: sql<number>`count(distinct ${trainings.id})`,
      completedEnrollments: sql<number>`sum(case when ${enrollments.status} = 'completed' then 1 else 0 end)`,
      totalEnrollments: sql<number>`count(${enrollments.id})`,
    })
    .from(jobsites)
    .leftJoin(trainings, and(eq(trainings.jobsiteId, jobsites.id), eq(trainings.isMandatory, true)))
    .leftJoin(trainingSessions, eq(trainingSessions.trainingId, trainings.id))
    .leftJoin(enrollments, eq(enrollments.sessionId, trainingSessions.id))
    .where(siteJobsiteId ? eq(jobsites.id, siteJobsiteId) : undefined)
    .groupBy(jobsites.id);
    return download(report, rows);
  }

  return new Response('Report not found', { status: 404 });
}
