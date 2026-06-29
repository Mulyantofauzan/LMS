'use server';

import { auth } from '@/auth';
import { db } from '@/db';
import {
  questionBank,
  questionSets,
  trainingMaterials,
  trainingQuestionSets,
  trainingSessions,
  trainings,
  users,
} from '@/db/schema';
import { and, eq, inArray, ne } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { hasMultipleChoiceOptions, isMultipleChoiceType } from '@/lib/question-utils';
import { getProposalReadinessError } from '@/lib/training-policy';

type SessionUser = {
  id?: string | number | null;
  role?: string | null;
};

async function getProposalAccess(trainingId: number) {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  const userId = Number(user?.id);
  const role = user?.role;
  if (!userId || !['trainer', 'site-admin', 'super-admin', 'admin'].includes(role ?? '')) {
    return { error: 'Anda tidak memiliki akses untuk mengajukan training.' } as const;
  }

  const training = await db.select({
    id: trainings.id,
    proposedBy: trainings.proposedBy,
    jobsiteId: trainings.jobsiteId,
    certificateEnabled: trainings.certificateEnabled,
    certificateTemplateUrl: trainings.certificateTemplateUrl,
    approvalStatus: trainings.approvalStatus,
  }).from(trainings).where(eq(trainings.id, trainingId)).get();
  if (!training) return { error: 'Training tidak ditemukan.' } as const;

  if (role === 'trainer' && training.proposedBy !== userId) {
    const assigned = await db.select({ id: trainingSessions.id })
      .from(trainingSessions)
      .where(and(
        eq(trainingSessions.trainingId, trainingId),
        eq(trainingSessions.trainerId, userId),
        ne(trainingSessions.status, 'ended'),
      ))
      .get();
    if (!assigned) return { error: 'Training ini bukan pengajuan atau kelas Anda.' } as const;
  }
  if (role === 'site-admin') {
    const currentUser = await db.select({ jobsiteId: users.jobsiteId })
      .from(users)
      .where(eq(users.id, userId))
      .get();
    if (!currentUser?.jobsiteId || currentUser.jobsiteId !== training.jobsiteId) {
      return { error: 'Training ini bukan milik site Anda.' } as const;
    }
  }

  return { training, userId } as const;
}

function revalidateProposalPages() {
  revalidatePath('/dashboard/trainer');
  revalidatePath('/dashboard/trainer/classes');
  revalidatePath('/dashboard/site-admin/trainings');
  revalidatePath('/dashboard/manager');
  revalidatePath('/dashboard/manager/approvals');
}

export async function addQuestionSetToTraining(trainingId: number, questionSetId: number) {
  const access = await getProposalAccess(trainingId);
  if ('error' in access) return access;
  if (!questionSetId) return { error: 'Paket soal wajib dipilih.' };
  if (access.training.approvalStatus === 'pending_manager') {
    return { error: 'Pengajuan sedang ditinjau manager.' };
  }

  const set = await db.select({ id: questionSets.id, status: questionSets.status })
    .from(questionSets)
    .where(eq(questionSets.id, questionSetId))
    .get();
  if (!set || set.status !== 'published') {
    return { error: 'Paket soal tidak tersedia untuk digunakan.' };
  }

  const existingLink = await db.select({
    id: trainingQuestionSets.id,
    approvalStatus: trainingQuestionSets.approvalStatus,
  }).from(trainingQuestionSets).where(and(
    eq(trainingQuestionSets.trainingId, trainingId),
    eq(trainingQuestionSets.questionSetId, questionSetId),
  )).get();
  if (existingLink?.approvalStatus === 'approved') {
    return { success: true };
  }
  if (existingLink?.approvalStatus === 'pending_manager') {
    return { error: 'Paket soal ini sedang ditinjau manager.' };
  }

  if (existingLink) {
    await db.update(trainingQuestionSets).set({
      approvalStatus: 'draft',
      addedBy: access.userId,
      reviewedBy: null,
      reviewedAt: null,
      rejectionReason: null,
    }).where(eq(trainingQuestionSets.id, existingLink.id));
  } else {
    await db.insert(trainingQuestionSets).values({
      trainingId,
      questionSetId,
      approvalStatus: 'draft',
      addedBy: access.userId,
    });
  }
  await db.update(trainings).set({
    approvalStatus: 'draft',
    approvedBy: null,
    approvedAt: null,
    rejectionReason: null,
  }).where(eq(trainings.id, trainingId));
  revalidateProposalPages();
  return { success: true };
}

export async function removeQuestionSetFromTraining(trainingId: number, questionSetId: number) {
  const access = await getProposalAccess(trainingId);
  if ('error' in access) return access;
  if (access.training.approvalStatus === 'pending_manager') {
    return { error: 'Pengajuan sedang ditinjau manager.' };
  }

  await db.delete(trainingQuestionSets).where(and(
    eq(trainingQuestionSets.trainingId, trainingId),
    eq(trainingQuestionSets.questionSetId, questionSetId),
    inArray(trainingQuestionSets.approvalStatus, ['draft', 'rejected']),
  ));
  revalidateProposalPages();
  return { success: true };
}

export async function submitTrainingProposal(trainingId: number) {
  const access = await getProposalAccess(trainingId);
  if ('error' in access) return access;
  if (!['draft', 'rejected', 'approved'].includes(access.training.approvalStatus)) {
    return { error: 'Pengajuan sedang diproses.' };
  }

  const materials = await db.select({ id: trainingMaterials.id })
    .from(trainingMaterials)
    .where(and(
      eq(trainingMaterials.trainingId, trainingId),
      inArray(trainingMaterials.approvalStatus, ['draft', 'approved', 'rejected']),
    ));
  const linkedSets = await db.select({
    linkId: trainingQuestionSets.id,
    setId: questionSets.id,
  })
    .from(trainingQuestionSets)
    .innerJoin(questionSets, eq(trainingQuestionSets.questionSetId, questionSets.id))
    .where(and(
      eq(trainingQuestionSets.trainingId, trainingId),
      inArray(trainingQuestionSets.approvalStatus, ['draft', 'approved', 'rejected']),
      eq(questionSets.status, 'published'),
    ));
  const setIds = linkedSets.map((item) => item.setId);
  const questions = setIds.length > 0 ? await db.select({
    questionSetId: questionBank.questionSetId,
    type: questionBank.type,
    options: questionBank.options,
  }).from(questionBank).where(inArray(questionBank.questionSetId, setIds)) : [];
  const validQuestionSetCount = setIds.filter((setId) => questions.some((question) => (
    question.questionSetId === setId
    && isMultipleChoiceType(question.type)
    && hasMultipleChoiceOptions(question.options)
  ))).length;
  const readinessError = getProposalReadinessError({
    materialCount: materials.length,
    validQuestionSetCount,
    certificateEnabled: access.training.certificateEnabled,
    certificateTemplateUrl: access.training.certificateTemplateUrl,
  });
  if (readinessError) return { error: readinessError };

  await db.batch([
    db.update(trainings).set({
      approvalStatus: 'pending_manager',
      rejectionReason: null,
      approvedBy: null,
      approvedAt: null,
    }).where(eq(trainings.id, trainingId)),
    db.update(trainingMaterials).set({
      approvalStatus: 'pending_manager',
      reviewedBy: null,
      reviewedAt: null,
      rejectionReason: null,
    }).where(and(
      eq(trainingMaterials.trainingId, trainingId),
      inArray(trainingMaterials.approvalStatus, ['draft', 'rejected']),
    )),
    db.update(trainingQuestionSets).set({
      approvalStatus: 'pending_manager',
      reviewedBy: null,
      reviewedAt: null,
      rejectionReason: null,
    }).where(and(
      eq(trainingQuestionSets.trainingId, trainingId),
      inArray(trainingQuestionSets.approvalStatus, ['draft', 'rejected']),
    )),
  ]);

  revalidateProposalPages();
  return { success: true };
}
