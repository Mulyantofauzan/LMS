import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const jobsites = sqliteTable('jobsites', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  location: text('location'),
  settings: text('settings', { mode: 'json' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nrp: text('nrp').unique(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull(), // super-admin, site-admin, manager, trainer, trainee
  jobsiteId: integer('jobsite_id').references(() => jobsites.id),
  department: text('department'),
  position: text('position'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
  oauthProvider: text('oauth_provider'),
  oauthSubject: text('oauth_subject'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
}, (table) => [
  uniqueIndex('users_oauth_identity_unique').on(table.oauthProvider, table.oauthSubject),
  index('users_active_jobsite_idx').on(table.isActive, table.jobsiteId),
]);

export const masterDepartments = sqliteTable('master_departments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

export const masterPositions = sqliteTable('master_positions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

export const trainings = sqliteTable('trainings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description'),
  category: text('category'),
  type: text('type'), // online, offline
  isMandatory: integer('is_mandatory', { mode: 'boolean' }).default(false).notNull(),
  jobsiteId: integer('jobsite_id').references(() => jobsites.id),
  approvalStatus: text('approval_status').default('approved').notNull(), // draft, pending_manager, approved, rejected
  proposedBy: integer('proposed_by').references(() => users.id),
  approvedBy: integer('approved_by').references(() => users.id),
  approvedAt: integer('approved_at', { mode: 'timestamp' }),
  rejectionReason: text('rejection_reason'),
  trainingCode: text('training_code'),
  certificateEnabled: integer('certificate_enabled', { mode: 'boolean' }).default(false).notNull(),
  certificateValidityMonths: integer('certificate_validity_months'),
  certificatePassingScore: integer('certificate_passing_score').default(70).notNull(),
  certificateNumberFormat: text('certificate_number_format').default('PST/{TRAINING_CODE}/{YEAR}/{SEQ}').notNull(),
  certificateTemplateUrl: text('certificate_template_url'),
  certificateTemplateConfig: text('certificate_template_config', { mode: 'json' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

export const trainingMaterials = sqliteTable('training_materials', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  trainingId: integer('training_id').notNull().references(() => trainings.id),
  title: text('title').notNull(),
  type: text('type').notNull(), // pdf, ppt, video
  fileUrl: text('file_url').notNull(),
  approvalStatus: text('approval_status').default('draft').notNull(), // draft, pending_manager, approved, rejected
  uploadedBy: integer('uploaded_by').references(() => users.id),
  reviewedBy: integer('reviewed_by').references(() => users.id),
  reviewedAt: integer('reviewed_at', { mode: 'timestamp' }),
  rejectionReason: text('rejection_reason'),
  uploadedAt: integer('uploaded_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
}, (table) => [
  index('training_materials_training_status_idx').on(table.trainingId, table.approvalStatus),
]);

export const questionSets = sqliteTable('question_sets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  trainingId: integer('training_id').notNull().references(() => trainings.id),
  trainerId: integer('trainer_id').notNull().references(() => users.id),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').default('draft').notNull(), // draft, published
  isLocked: integer('is_locked', { mode: 'boolean' }).default(false).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
}, (table) => [
  index('question_sets_status_idx').on(table.status),
  index('question_sets_owner_idx').on(table.trainerId),
]);

export const trainingQuestionSets = sqliteTable('training_question_sets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  trainingId: integer('training_id').notNull().references(() => trainings.id),
  questionSetId: integer('question_set_id').notNull().references(() => questionSets.id),
  approvalStatus: text('approval_status').default('draft').notNull(),
  addedBy: integer('added_by').references(() => users.id),
  reviewedBy: integer('reviewed_by').references(() => users.id),
  reviewedAt: integer('reviewed_at', { mode: 'timestamp' }),
  rejectionReason: text('rejection_reason'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
}, (table) => [
  uniqueIndex('training_question_sets_training_set_unique').on(table.trainingId, table.questionSetId),
  index('training_question_sets_training_status_idx').on(table.trainingId, table.approvalStatus),
]);

export const trainingSessions = sqliteTable('training_sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  trainingId: integer('training_id').notNull().references(() => trainings.id),
  trainerId: integer('trainer_id').notNull().references(() => users.id),
  startTime: integer('start_time', { mode: 'timestamp' }).notNull(),
  endTime: integer('end_time', { mode: 'timestamp' }).notNull(),
  location: text('location'),
  status: text('status').default('scheduled').notNull(), // scheduled, active, ended
  questionSetId: integer('question_set_id').references(() => questionSets.id),
  startedAt: integer('started_at', { mode: 'timestamp' }),
  endedAt: integer('ended_at', { mode: 'timestamp' }),
});

export const enrollments = sqliteTable('enrollments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sessionId: integer('session_id').notNull().references(() => trainingSessions.id),
  traineeId: integer('trainee_id').notNull().references(() => users.id),
  status: text('status').default('enrolled'), // enrolled, completed, dropped
  enrolledAt: integer('enrolled_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

export const attendance = sqliteTable('attendance', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sessionId: integer('session_id').notNull().references(() => trainingSessions.id),
  traineeId: integer('trainee_id').notNull().references(() => users.id),
  checkIn: integer('check_in', { mode: 'timestamp' }),
  checkOut: integer('check_out', { mode: 'timestamp' }),
  method: text('method'), // manual, qr
  status: text('status').notNull(), // present, absent, late
});

export const questionBank = sqliteTable('question_bank', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  trainingId: integer('training_id').notNull().references(() => trainings.id),
  questionSetId: integer('question_set_id').references(() => questionSets.id),
  type: text('type').notNull(), // multiple_choice, essay
  question: text('question').notNull(),
  options: text('options', { mode: 'json' }), 
  correctAnswer: text('correct_answer'),
  mediaUrl: text('media_url'),
  mediaType: text('media_type'), // image, video
  mediaName: text('media_name'),
}, (table) => [
  index('question_bank_set_idx').on(table.questionSetId),
]);

export const exams = sqliteTable('exams', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sessionId: integer('session_id').notNull().references(() => trainingSessions.id),
  traineeId: integer('trainee_id').notNull().references(() => users.id),
  type: text('type').default('posttest').notNull(), // pretest, posttest
  score: integer('score'),
  passed: integer('passed', { mode: 'boolean' }),
  takenAt: integer('taken_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

export const certificates = sqliteTable('certificates', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  trainingId: integer('training_id').notNull().references(() => trainings.id),
  sessionId: integer('session_id').references(() => trainingSessions.id),
  certNumber: text('cert_number').unique().notNull(),
  url: text('url'),
  issueDate: integer('issue_date', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  expiryDate: integer('expiry_date', { mode: 'timestamp' }),
}, (table) => [
  uniqueIndex('certificates_user_session_unique').on(table.userId, table.sessionId),
  index('certificates_training_user_idx').on(table.trainingId, table.userId),
]);

export const certificateSequences = sqliteTable('certificate_sequences', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  trainingId: integer('training_id').notNull().references(() => trainings.id),
  year: integer('year').notNull(),
  nextValue: integer('next_value').default(1).notNull(),
}, (table) => [
  uniqueIndex('certificate_sequences_training_year_unique').on(table.trainingId, table.year),
]);

export const externalCertificateTypes = sqliteTable('external_certificate_types', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  issuer: text('issuer'),
  description: text('description'),
  defaultValidityMonths: integer('default_validity_months'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

export const externalCertificates = sqliteTable('external_certificates', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  typeId: integer('type_id').notNull().references(() => externalCertificateTypes.id),
  certNumber: text('cert_number').notNull().unique(),
  issuer: text('issuer'),
  issueDate: integer('issue_date', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  expiryDate: integer('expiry_date', { mode: 'timestamp' }),
  notes: text('notes'),
  inputBy: integer('input_by').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
}, (table) => [
  index('external_certificates_user_idx').on(table.userId),
  index('external_certificates_type_idx').on(table.typeId),
]);

export const externalCertificateEquivalencies = sqliteTable('external_certificate_equivalencies', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  externalTypeId: integer('external_type_id').notNull().references(() => externalCertificateTypes.id),
  trainingId: integer('training_id').notNull().references(() => trainings.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
}, (table) => [
  uniqueIndex('external_certificate_equivalencies_unique').on(table.externalTypeId, table.trainingId),
  index('external_certificate_equivalencies_training_idx').on(table.trainingId),
]);

export const trainingRequirements = sqliteTable('training_requirements', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  trainingId: integer('training_id').notNull().references(() => trainings.id),
  scope: text('scope').default('global').notNull(), // global, jobsite, department, position, user
  jobsiteId: integer('jobsite_id').references(() => jobsites.id),
  department: text('department'),
  position: text('position'),
  userId: integer('user_id').references(() => users.id),
  requirementType: text('requirement_type').default('mandatory').notNull(), // mandatory, development
  recurrence: text('recurrence').default('once').notNull(), // once, annual, interval_months
  intervalMonths: integer('interval_months'),
  effectiveYear: integer('effective_year'),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
}, (table) => [
  index('training_requirements_training_idx').on(table.trainingId),
  index('training_requirements_scope_idx').on(table.scope, table.jobsiteId, table.department, table.position, table.userId),
]);

export const trainingRequirementExclusions = sqliteTable('training_requirement_exclusions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  requirementId: integer('requirement_id').notNull().references(() => trainingRequirements.id),
  userId: integer('user_id').notNull().references(() => users.id),
  reason: text('reason'),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
}, (table) => [
  uniqueIndex('training_requirement_exclusions_unique').on(table.requirementId, table.userId),
  index('training_requirement_exclusions_user_idx').on(table.userId),
]);

export const approvals = sqliteTable('approvals', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  traineeId: integer('trainee_id').notNull().references(() => users.id),
  trainingId: integer('training_id').notNull().references(() => trainings.id),
  managerId: integer('manager_id').notNull().references(() => users.id),
  status: text('status').default('pending'), // pending, approved, rejected
  requestedAt: integer('requested_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

export const evaluations = sqliteTable('evaluations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sessionId: integer('session_id').notNull().references(() => trainingSessions.id),
  traineeId: integer('trainee_id').notNull().references(() => users.id),
  rating: integer('rating').notNull(),
  feedback: text('feedback'),
});

export const auditLogs = sqliteTable('audit_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  jobsiteId: integer('jobsite_id').references(() => jobsites.id),
  action: text('action').notNull(),
  target: text('target'),
  timestamp: integer('timestamp', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});
