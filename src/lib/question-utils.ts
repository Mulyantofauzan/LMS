export function normalizeQuestionType(type: string | null | undefined) {
  const normalized = String(type ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

  if (!normalized) return 'multiple_choice';
  if (normalized === 'multiplechoice' || normalized === 'multiple_choice' || normalized === 'pilihan_ganda') {
    return 'multiple_choice';
  }
  if (normalized === 'essay' || normalized === 'esai') return 'essay';
  return normalized;
}

export function isMultipleChoiceType(type: string | null | undefined) {
  return normalizeQuestionType(type) === 'multiple_choice';
}

export function hasMultipleChoiceOptions(options: unknown) {
  return Array.isArray(options) && options.filter((option) => String(option).trim()).length >= 2;
}
