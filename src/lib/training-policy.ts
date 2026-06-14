export type ProposalReadiness = {
  materialCount: number;
  validQuestionSetCount: number;
  certificateEnabled: boolean;
  certificateTemplateUrl: string | null;
};

export function getProposalReadinessError(input: ProposalReadiness) {
  if (input.materialCount < 1) return 'Upload minimal satu materi sebelum mengajukan training.';
  if (input.validQuestionSetCount < 1) return 'Pilih minimal satu paket soal yang valid sebelum mengajukan training.';
  if (input.certificateEnabled && !input.certificateTemplateUrl) {
    return 'Template sertifikat wajib diupload sebelum pengajuan.';
  }
  return null;
}

export type CertificateEligibility = {
  sessionStatus: string;
  certificateEnabled: boolean;
  attendanceStatus: string | null;
  posttestScore: number | null;
  passingScore: number;
};

export function isCertificateEligible(input: CertificateEligibility) {
  return input.sessionStatus === 'ended'
    && input.certificateEnabled
    && (input.attendanceStatus === 'present' || input.attendanceStatus === 'late')
    && input.posttestScore !== null
    && input.posttestScore >= input.passingScore;
}

export function canReviewTrainingGlobally(role: string | null | undefined) {
  return role === 'manager' || role === 'admin' || role === 'super-admin';
}

export function canManageQuestionSet(
  role: string | null | undefined,
  userId: number,
  ownerId: number,
) {
  return role === 'admin' || role === 'super-admin' || userId === ownerId;
}
