import { db } from '@/db';
import {
  certificates,
  externalCertificateEquivalencies,
  externalCertificates,
  externalCertificateTypes,
  trainingRequirementExclusions,
  trainingRequirements,
  trainings,
  users,
} from '@/db/schema';
import { and, eq, inArray } from 'drizzle-orm';
import { isTnaRequirementFulfilled, type TnaCompletion } from '@/lib/tna-policy';

export type TnaUser = {
  id: number;
  name: string;
  jobsiteId: number | null;
  department: string | null;
  position: string | null;
};

export type TnaResultRow = {
  userId: number;
  userName: string;
  requirementId: number;
  trainingId: number;
  trainingTitle: string;
  requirementType: string;
  recurrence: string;
  intervalMonths: number | null;
  effectiveYear: number | null;
  scope: string;
  fulfilled: boolean;
  fulfilledBy: 'internal' | 'external' | null;
};

function normalize(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? '';
}

function matchesUser(requirement: {
  scope: string;
  jobsiteId: number | null;
  department: string | null;
  position: string | null;
  userId: number | null;
}, user: TnaUser) {
  if (requirement.jobsiteId && requirement.jobsiteId !== user.jobsiteId) return false;
  if (requirement.scope === 'global') return true;
  if (requirement.scope === 'jobsite') return !!requirement.jobsiteId && requirement.jobsiteId === user.jobsiteId;
  if (requirement.scope === 'department') return normalize(requirement.department) === normalize(user.department);
  if (requirement.scope === 'position') return normalize(requirement.position) === normalize(user.position);
  if (requirement.scope === 'user') return !!requirement.userId && requirement.userId === user.id;
  return false;
}

function completionsForTraining(
  completions: Array<TnaCompletion & { trainingId: number; source: 'internal' | 'external' }>,
  trainingId: number,
) {
  return completions.filter((completion) => completion.trainingId === trainingId);
}

export async function getTnaRowsForUsers(userRows: TnaUser[], asOf = new Date()) {
  const userIds = userRows.map((user) => user.id);
  if (userIds.length === 0) return [];

  const requirements = await db.select({
    id: trainingRequirements.id,
    trainingId: trainingRequirements.trainingId,
    trainingTitle: trainings.title,
    scope: trainingRequirements.scope,
    jobsiteId: trainingRequirements.jobsiteId,
    department: trainingRequirements.department,
    position: trainingRequirements.position,
    userId: trainingRequirements.userId,
    requirementType: trainingRequirements.requirementType,
    recurrence: trainingRequirements.recurrence,
    intervalMonths: trainingRequirements.intervalMonths,
    effectiveYear: trainingRequirements.effectiveYear,
  })
    .from(trainingRequirements)
    .innerJoin(trainings, eq(trainingRequirements.trainingId, trainings.id));
  if (requirements.length === 0) return [];

  const exclusions = await db.select({
    requirementId: trainingRequirementExclusions.requirementId,
    userId: trainingRequirementExclusions.userId,
  })
    .from(trainingRequirementExclusions)
    .where(inArray(trainingRequirementExclusions.userId, userIds));
  const excludedKeys = new Set(exclusions.map((item) => `${item.requirementId}:${item.userId}`));

  const internalCompletions = await db.select({
    userId: certificates.userId,
    trainingId: certificates.trainingId,
    issueDate: certificates.issueDate,
    expiryDate: certificates.expiryDate,
  })
    .from(certificates)
    .where(inArray(certificates.userId, userIds));

  const externalCompletions = await db.select({
    userId: externalCertificates.userId,
    trainingId: externalCertificateEquivalencies.trainingId,
    issueDate: externalCertificates.issueDate,
    expiryDate: externalCertificates.expiryDate,
  })
    .from(externalCertificates)
    .innerJoin(
      externalCertificateEquivalencies,
      eq(externalCertificates.typeId, externalCertificateEquivalencies.externalTypeId),
    )
    .where(inArray(externalCertificates.userId, userIds));

  const completionsByUser = new Map<number, Array<TnaCompletion & { trainingId: number; source: 'internal' | 'external' }>>();
  for (const completion of internalCompletions) {
    const list = completionsByUser.get(completion.userId) ?? [];
    list.push({
      trainingId: completion.trainingId,
      source: 'internal',
      issueDate: completion.issueDate,
      expiryDate: completion.expiryDate,
    });
    completionsByUser.set(completion.userId, list);
  }
  for (const completion of externalCompletions) {
    const list = completionsByUser.get(completion.userId) ?? [];
    list.push({
      trainingId: completion.trainingId,
      source: 'external',
      issueDate: completion.issueDate,
      expiryDate: completion.expiryDate,
    });
    completionsByUser.set(completion.userId, list);
  }

  const rows: TnaResultRow[] = [];
  for (const user of userRows) {
    const userCompletions = completionsByUser.get(user.id) ?? [];
    for (const requirement of requirements) {
      if (!matchesUser(requirement, user)) continue;
      if (excludedKeys.has(`${requirement.id}:${user.id}`)) continue;
      const trainingCompletions = completionsForTraining(userCompletions, requirement.trainingId);
      const fulfilled = isTnaRequirementFulfilled(requirement, trainingCompletions, asOf);
      const fulfilledBy = fulfilled
        ? trainingCompletions.some((completion) => (
          completion.source === 'internal'
          && isTnaRequirementFulfilled(requirement, [completion], asOf)
        ))
          ? 'internal'
          : 'external'
        : null;
      rows.push({
        userId: user.id,
        userName: user.name,
        requirementId: requirement.id,
        trainingId: requirement.trainingId,
        trainingTitle: requirement.trainingTitle,
        requirementType: requirement.requirementType,
        recurrence: requirement.recurrence,
        intervalMonths: requirement.intervalMonths,
        effectiveYear: requirement.effectiveYear,
        scope: requirement.scope,
        fulfilled,
        fulfilledBy,
      });
    }
  }

  return rows;
}

export async function getTnaRowsForUser(userId: number, asOf = new Date()) {
  const user = await db.select({
    id: users.id,
    name: users.name,
    jobsiteId: users.jobsiteId,
    department: users.department,
    position: users.position,
  }).from(users).where(eq(users.id, userId)).get();
  if (!user) return [];
  return getTnaRowsForUsers([user], asOf);
}

export async function getExternalCertificatesForUsers(userIds: number[]) {
  if (userIds.length === 0) return [];
  return db.select({
    id: externalCertificates.id,
    userId: externalCertificates.userId,
    userName: users.name,
    typeName: externalCertificateTypes.name,
    issuer: externalCertificates.issuer,
    typeIssuer: externalCertificateTypes.issuer,
    certNumber: externalCertificates.certNumber,
    issueDate: externalCertificates.issueDate,
    expiryDate: externalCertificates.expiryDate,
    notes: externalCertificates.notes,
  })
    .from(externalCertificates)
    .innerJoin(users, eq(externalCertificates.userId, users.id))
    .innerJoin(externalCertificateTypes, eq(externalCertificates.typeId, externalCertificateTypes.id))
    .where(inArray(externalCertificates.userId, userIds));
}

export async function getExternalCertificateByNumber(certNumber: string) {
  return db.select({
    certNumber: externalCertificates.certNumber,
    typeName: externalCertificateTypes.name,
    participantName: users.name,
  })
    .from(externalCertificates)
    .innerJoin(users, eq(externalCertificates.userId, users.id))
    .innerJoin(externalCertificateTypes, eq(externalCertificates.typeId, externalCertificateTypes.id))
    .where(eq(externalCertificates.certNumber, certNumber))
    .get();
}

export async function canSiteAdminAccessUser(adminId: number, targetUserId: number) {
  const rows = await db.select({
    adminSiteId: users.jobsiteId,
  }).from(users).where(eq(users.id, adminId));
  const target = await db.select({ jobsiteId: users.jobsiteId })
    .from(users)
    .where(eq(users.id, targetUserId))
    .get();
  return !!rows[0]?.adminSiteId && rows[0].adminSiteId === target?.jobsiteId;
}

export async function getManagedUsersForCertificateAdmin(role: string, userId: number) {
  if (role === 'site-admin') {
    const currentUser = await db.select({ jobsiteId: users.jobsiteId }).from(users).where(eq(users.id, userId)).get();
    if (!currentUser?.jobsiteId) return [];
    return db.select({
      id: users.id,
      name: users.name,
      nrp: users.nrp,
      jobsiteId: users.jobsiteId,
      department: users.department,
      position: users.position,
    }).from(users).where(and(eq(users.jobsiteId, currentUser.jobsiteId), eq(users.role, 'trainee'), eq(users.isActive, true))).orderBy(users.name);
  }
  return db.select({
    id: users.id,
    name: users.name,
    nrp: users.nrp,
    jobsiteId: users.jobsiteId,
    department: users.department,
    position: users.position,
  }).from(users).where(and(eq(users.role, 'trainee'), eq(users.isActive, true))).orderBy(users.name);
}
