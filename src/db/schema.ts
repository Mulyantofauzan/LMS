import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
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
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

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
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

export const trainingMaterials = sqliteTable('training_materials', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  trainingId: integer('training_id').notNull().references(() => trainings.id),
  title: text('title').notNull(),
  type: text('type').notNull(), // pdf, ppt, video
  fileUrl: text('file_url').notNull(),
  uploadedAt: integer('uploaded_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

export const questionSets = sqliteTable('question_sets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  trainingId: integer('training_id').notNull().references(() => trainings.id),
  trainerId: integer('trainer_id').notNull().references(() => users.id),
  title: text('title').notNull(),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

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
});

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
  certNumber: text('cert_number').unique().notNull(),
  url: text('url'),
  issueDate: integer('issue_date', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  expiryDate: integer('expiry_date', { mode: 'timestamp' }),
});

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
