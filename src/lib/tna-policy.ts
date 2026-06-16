export type TnaRecurrence = 'once' | 'annual' | 'interval_months';
export type TnaRequirementType = 'mandatory' | 'development';

export type TnaCompletion = {
  issueDate: Date | null;
  expiryDate: Date | null;
};

export type TnaRequirementPolicy = {
  recurrence: string;
  intervalMonths: number | null;
  effectiveYear: number | null;
};

export function isCertificateDateValid(expiryDate: Date | null, asOf = new Date()) {
  return !expiryDate || expiryDate.getTime() >= startOfDay(asOf).getTime();
}

function startOfDay(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addMonths(value: Date, months: number) {
  const date = new Date(value);
  date.setMonth(date.getMonth() + months);
  return date;
}

export function isTnaRequirementFulfilled(
  requirement: TnaRequirementPolicy,
  completions: TnaCompletion[],
  asOf = new Date(),
) {
  const validCompletions = completions.filter((completion) => (
    completion.issueDate && isCertificateDateValid(completion.expiryDate, asOf)
  ));
  if (validCompletions.length === 0) return false;

  if (requirement.recurrence === 'annual') {
    const targetYear = requirement.effectiveYear ?? asOf.getFullYear();
    return validCompletions.some((completion) => completion.issueDate?.getFullYear() === targetYear);
  }

  if (requirement.recurrence === 'interval_months') {
    const months = requirement.intervalMonths ?? 0;
    if (months <= 0) return validCompletions.length > 0;
    return validCompletions.some((completion) => {
      if (!completion.issueDate) return false;
      if (completion.expiryDate) return completion.expiryDate.getTime() >= startOfDay(asOf).getTime();
      return addMonths(completion.issueDate, months).getTime() >= startOfDay(asOf).getTime();
    });
  }

  return validCompletions.length > 0;
}

export function affectsCompliance(requirementType: string) {
  return requirementType === 'mandatory';
}
