import { db } from '@/db';
import { jobsites, users } from '@/db/schema';
import { getTnaRowsForUsers } from '@/lib/tna';
import { eq } from 'drizzle-orm';

export type ComplianceSummary = {
  fulfilled: number;
  missing: number;
  percentage: number;
  total: number;
};

export type SiteComplianceSummary = ComplianceSummary & {
  id: number;
  name: string;
  users: number;
};

export type TrainingComplianceSummary = ComplianceSummary & {
  id: number;
  title: string;
};

function summarize(total: number, fulfilled: number): ComplianceSummary {
  return {
    total,
    fulfilled,
    missing: Math.max(total - fulfilled, 0),
    percentage: total > 0 ? Math.round((fulfilled / total) * 100) : 0,
  };
}

export async function getComplianceStats() {
  const [activeUsers, siteRows] = await Promise.all([
    db.select({
      id: users.id,
      name: users.name,
      jobsiteId: users.jobsiteId,
      department: users.department,
      position: users.position,
    })
      .from(users)
      .where(eq(users.isActive, true))
      .orderBy(users.name),
    db.select({ id: jobsites.id, name: jobsites.name })
      .from(jobsites)
      .orderBy(jobsites.name),
  ]);

  const mandatoryRows = (await getTnaRowsForUsers(activeUsers))
    .filter((row) => row.requirementType === 'mandatory');
  const userSiteIds = new Map(activeUsers.map((user) => [user.id, user.jobsiteId]));

  const global = summarize(
    mandatoryRows.length,
    mandatoryRows.filter((row) => row.fulfilled).length,
  );

  const sites: SiteComplianceSummary[] = siteRows.map((site) => {
    const siteUserIds = new Set(
      activeUsers.filter((user) => user.jobsiteId === site.id).map((user) => user.id),
    );
    const siteRequirements = mandatoryRows.filter((row) => siteUserIds.has(row.userId));
    return {
      id: site.id,
      name: site.name,
      users: siteUserIds.size,
      ...summarize(
        siteRequirements.length,
        siteRequirements.filter((row) => row.fulfilled).length,
      ),
    };
  });

  const trainingMap = new Map<number, {
    id: number;
    title: string;
    total: number;
    fulfilled: number;
  }>();
  for (const row of mandatoryRows) {
    const current = trainingMap.get(row.trainingId) ?? {
      id: row.trainingId,
      title: row.trainingTitle,
      total: 0,
      fulfilled: 0,
    };
    current.total += 1;
    if (row.fulfilled) current.fulfilled += 1;
    trainingMap.set(row.trainingId, current);
  }

  const trainings: TrainingComplianceSummary[] = Array.from(trainingMap.values())
    .map((training) => ({
      id: training.id,
      title: training.title,
      ...summarize(training.total, training.fulfilled),
    }))
    .sort((a, b) => a.title.localeCompare(b.title, 'id'));

  return {
    global,
    sites,
    trainings,
    activeUsers: activeUsers.length,
    usersWithoutJobsite: activeUsers.filter((user) => !userSiteIds.get(user.id)).length,
  };
}
