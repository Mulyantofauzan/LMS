'use server';

import { auth } from '@/auth';
import { db } from '@/db';
import { attendance, enrollments, exams, jobsites, masterDepartments, masterPositions, questionBank, questionSets, trainingQuestionSets, trainingSessions, users } from '@/db/schema';
import bcrypt from 'bcryptjs';
import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { issueCertificatesForSession } from '@/lib/certificate-issuer';
import { hasMultipleChoiceOptions, isMultipleChoiceType } from '@/lib/question-utils';

type SessionUser = {
  id?: string | number | null;
  role?: string | null;
};

async function requireTrainer() {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  const role = user?.role;
  if (role !== 'trainer' && role !== 'admin' && role !== 'super-admin') {
    return { error: 'Anda tidak memiliki akses untuk mengelola kelas.' };
  }
  return { trainerId: Number(user?.id) };
}

async function getSessionForTrainer(sessionId: number, trainerId: number) {
  return db.select().from(trainingSessions)
    .where(and(eq(trainingSessions.id, sessionId), eq(trainingSessions.trainerId, trainerId)))
    .get();
}

export async function assignSessionQuestionSet(formData: FormData) {
  const access = await requireTrainer();
  if ('error' in access) return access;

  const sessionId = Number(formData.get('sessionId'));
  const questionSetId = Number(formData.get('questionSetId')) || null;
  const trainingSession = await getSessionForTrainer(sessionId, access.trainerId);
  if (!trainingSession) return { error: 'Sesi tidak ditemukan.' };
  if (questionSetId) {
    const approvedLink = await db.select({ id: trainingQuestionSets.id })
      .from(trainingQuestionSets)
      .innerJoin(questionSets, eq(trainingQuestionSets.questionSetId, questionSets.id))
      .where(and(
        eq(trainingQuestionSets.trainingId, trainingSession.trainingId),
        eq(trainingQuestionSets.questionSetId, questionSetId),
        eq(trainingQuestionSets.approvalStatus, 'approved'),
        eq(questionSets.status, 'published'),
      ))
      .get();
    if (!approvedLink) return { error: 'Paket soal belum disetujui untuk training ini.' };
  }

  await db.update(trainingSessions).set({ questionSetId }).where(eq(trainingSessions.id, sessionId));
  revalidatePath('/dashboard/trainer/classes');
  return { success: true };
}

export async function startTrainingSession(formData: FormData) {
  const access = await requireTrainer();
  if ('error' in access) return access;

  const sessionId = Number(formData.get('sessionId'));
  const selectedQuestionSetId = Number(formData.get('questionSetId')) || null;
  const trainingSession = await getSessionForTrainer(sessionId, access.trainerId);
  if (!trainingSession) return { error: 'Sesi tidak ditemukan.' };
  const questionSetId = selectedQuestionSetId ?? trainingSession.questionSetId;
  if (!questionSetId) return { error: 'Pilih paket bank soal sebelum kelas dimulai.' };
  const approvedLink = await db.select({ id: trainingQuestionSets.id })
    .from(trainingQuestionSets)
    .innerJoin(questionSets, eq(trainingQuestionSets.questionSetId, questionSets.id))
    .where(and(
      eq(trainingQuestionSets.trainingId, trainingSession.trainingId),
      eq(trainingQuestionSets.questionSetId, questionSetId),
      eq(trainingQuestionSets.approvalStatus, 'approved'),
      eq(questionSets.status, 'published'),
    ))
    .get();
  if (!approvedLink) return { error: 'Paket soal belum disetujui untuk training ini.' };

  const questions = await db.select({ type: questionBank.type, options: questionBank.options })
    .from(questionBank)
    .where(eq(questionBank.questionSetId, questionSetId));
  const hasValidQuestions = questions.some((question) => isMultipleChoiceType(question.type) && hasMultipleChoiceOptions(question.options));

  if (!hasValidQuestions) {
    return { error: 'Paket bank soal belum memiliki soal pilihan ganda yang valid.' };
  }

  await db.update(trainingSessions).set({
    questionSetId,
    status: 'active',
    startedAt: new Date(),
    endedAt: null,
  }).where(eq(trainingSessions.id, sessionId));
  await db.update(questionSets).set({ isLocked: true }).where(eq(questionSets.id, questionSetId));
  revalidatePath('/dashboard/trainer');
  revalidatePath('/dashboard/trainer/classes');
  revalidatePath('/dashboard/trainer/attendance');
  return { success: true };
}

export async function endTrainingSession(formData: FormData) {
  const access = await requireTrainer();
  if ('error' in access) return access;

  const sessionId = Number(formData.get('sessionId'));
  const trainingSession = await getSessionForTrainer(sessionId, access.trainerId);
  if (!trainingSession) return { error: 'Sesi tidak ditemukan.' };

  await db.update(trainingSessions).set({ status: 'ended', endedAt: new Date() }).where(eq(trainingSessions.id, sessionId));
  await db.update(enrollments).set({ status: 'completed' }).where(eq(enrollments.sessionId, sessionId));
  await issueCertificatesForSession(sessionId);
  revalidatePath('/dashboard/trainer');
  revalidatePath('/dashboard/trainer/classes');
  revalidatePath('/dashboard/trainer/attendance');
  revalidatePath('/dashboard/trainer/history');
  revalidatePath('/dashboard/trainee/passport');
  revalidatePath('/dashboard/passport');
  revalidatePath('/dashboard/trainee/certificates');
  revalidatePath('/dashboard/certificates');
  return { success: true };
}

async function findUserByNrp(nrp: string) {
  return db.select().from(users).where(eq(users.nrp, nrp)).get();
}

async function enrollAndAttend(sessionId: number, traineeId: number, method: 'qr' | 'manual' = 'qr') {
  const existingEnrollment = await db.select().from(enrollments)
    .where(and(eq(enrollments.sessionId, sessionId), eq(enrollments.traineeId, traineeId)))
    .get();

  if (!existingEnrollment) {
    await db.insert(enrollments).values({ sessionId, traineeId, status: 'enrolled' });
  }

  const existingAttendance = await db.select().from(attendance)
    .where(and(eq(attendance.sessionId, sessionId), eq(attendance.traineeId, traineeId)))
    .get();

  if (existingAttendance) {
    await db.update(attendance).set({ checkIn: new Date(), method, status: 'present' }).where(eq(attendance.id, existingAttendance.id));
  } else {
    await db.insert(attendance).values({
      sessionId,
      traineeId,
      checkIn: new Date(),
      method,
      status: 'present',
    });
  }
}

export async function enrollByNrp(formData: FormData) {
  const sessionId = Number(formData.get('sessionId'));
  const nrp = String(formData.get('nrp') ?? '').trim();
  const user = nrp ? await findUserByNrp(nrp) : null;
  if (!sessionId || !nrp) return { error: 'NRP wajib diisi.' };
  if (!user) redirect(`/class/${sessionId}/attendance?register=1&nrp=${encodeURIComponent(nrp)}`);

  await enrollAndAttend(sessionId, user.id);
  revalidatePath('/dashboard/trainer/attendance');
  redirect(`/class/${sessionId}/attendance?checked=1&name=${encodeURIComponent(user.name)}&nrp=${encodeURIComponent(nrp)}`);
}

export async function registerAndEnroll(formData: FormData) {
  const sessionId = Number(formData.get('sessionId'));
  const nrp = String(formData.get('nrp') ?? '').trim();
  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '').trim();
  const department = String(formData.get('department') ?? '').trim();
  const position = String(formData.get('position') ?? '').trim();
  const jobsiteId = Number(formData.get('jobsiteId'));
  const returnTo = String(formData.get('returnTo') ?? 'attendance');
  const targetMode = ['attendance', 'pretest', 'posttest'].includes(returnTo) ? returnTo : 'attendance';
  if (!sessionId || !nrp || !name || !email || !jobsiteId || password.length < 6) {
    return { error: 'Lengkapi NRP, nama, email, lokasi kerja, dan password minimal 6 karakter.' };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const created = await db.insert(users).values({
    nrp,
    name,
    email,
    passwordHash,
    role: 'trainee',
    jobsiteId,
    department,
    position,
  }).returning({ id: users.id });

  await enrollAndAttend(sessionId, created[0].id);
  revalidatePath('/dashboard/trainer/attendance');
  revalidatePath('/dashboard/site-admin/users');
  revalidatePath('/dashboard/super-admin/users');

  if (targetMode === 'attendance') {
    redirect(`/class/${sessionId}/attendance?registered=1`);
  }

  redirect(`/class/${sessionId}/${targetMode}?registered=1&nrp=${encodeURIComponent(nrp)}`);
}

export async function submitExam(formData: FormData) {
  const sessionId = Number(formData.get('sessionId'));
  const type = String(formData.get('type') ?? 'posttest');
  const nrp = String(formData.get('nrp') ?? '').trim();
  const total = Number(formData.get('totalQuestions'));
  if (!sessionId || !nrp || !total) return { error: 'Data ujian tidak lengkap.' };

  const user = await findUserByNrp(nrp);
  if (!user) redirect(`/class/${sessionId}/attendance?register=1&nrp=${encodeURIComponent(nrp)}&returnTo=${encodeURIComponent(type)}`);

  await enrollAndAttend(sessionId, user.id);
  const trainingSession = await db.select({ questionSetId: trainingSessions.questionSetId })
    .from(trainingSessions)
    .where(eq(trainingSessions.id, sessionId))
    .get();
  if (!trainingSession?.questionSetId) return { error: 'Paket soal belum dipilih.' };
  const questionRows = await db.select({
    type: questionBank.type,
    options: questionBank.options,
    correctAnswer: questionBank.correctAnswer,
  })
    .from(questionBank)
    .where(eq(questionBank.questionSetId, trainingSession.questionSetId))
    .orderBy(questionBank.id);
  const questions = questionRows.filter((question) => (
    isMultipleChoiceType(question.type) && hasMultipleChoiceOptions(question.options)
  ));
  if (questions.length !== total) return { error: 'Data soal berubah. Muat ulang halaman ujian.' };

  let correct = 0;
  for (let index = 0; index < questions.length; index += 1) {
    const answer = String(formData.get(`answer-${index}`) ?? '').trim();
    const expected = String(questions[index].correctAnswer ?? '').trim();
    if (answer && expected && answer.toLowerCase() === expected.toLowerCase()) correct += 1;
  }
  const score = Math.round((correct / total) * 100);
  const existing = await db.select().from(exams)
    .where(and(eq(exams.sessionId, sessionId), eq(exams.traineeId, user.id), eq(exams.type, type)))
    .get();

  if (existing) {
    await db.update(exams).set({ score, passed: score >= 70, takenAt: new Date() }).where(eq(exams.id, existing.id));
  } else {
    await db.insert(exams).values({ sessionId, traineeId: user.id, type, score, passed: score >= 70 });
  }

  revalidatePath('/dashboard/trainee/passport');
  revalidatePath('/dashboard/passport');
  revalidatePath('/dashboard/trainee/certificates');
  revalidatePath('/dashboard/certificates');
  redirect(`/class/${sessionId}/${type}?nrp=${encodeURIComponent(nrp)}&score=${score}`);
}

export async function getActiveMasters() {
  const jobsiteRows = await db.select({ id: jobsites.id, name: jobsites.name })
    .from(jobsites)
    .orderBy(jobsites.name);
  const departments = await db.select({ id: masterDepartments.id, name: masterDepartments.name })
    .from(masterDepartments)
    .where(eq(masterDepartments.isActive, true))
    .orderBy(masterDepartments.name);
  const positions = await db.select({ id: masterPositions.id, name: masterPositions.name })
    .from(masterPositions)
    .where(eq(masterPositions.isActive, true))
    .orderBy(masterPositions.name);
  return { jobsites: jobsiteRows, departments, positions };
}

export async function assignSessionQuestionSetForm(formData: FormData): Promise<void> {
  await assignSessionQuestionSet(formData);
}

export async function startTrainingSessionForm(formData: FormData): Promise<void> {
  await startTrainingSession(formData);
}

export async function endTrainingSessionForm(formData: FormData): Promise<void> {
  await endTrainingSession(formData);
}

export async function enrollByNrpForm(formData: FormData): Promise<void> {
  await enrollByNrp(formData);
}

export async function registerAndEnrollForm(formData: FormData): Promise<void> {
  await registerAndEnroll(formData);
}

export async function submitExamForm(formData: FormData): Promise<void> {
  await submitExam(formData);
}
