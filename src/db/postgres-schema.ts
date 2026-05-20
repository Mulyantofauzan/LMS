import { pgTable, serial, varchar, text, timestamp, boolean, integer, jsonb } from 'drizzle-orm/pg-core';

export const jobsites = pgTable('jobsites', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  location: text('location'),
  settings: jsonb('settings'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 50 }).notNull(), // super-admin, site-admin, manager, trainer, trainee
  jobsiteId: integer('jobsite_id').references(() => jobsites.id),
  department: varchar('department', { length: 255 }),
  position: varchar('position', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const trainings = pgTable('trainings', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }),
  type: varchar('type', { length: 50 }), // online, offline
  isMandatory: boolean('is_mandatory').default(false).notNull(),
  jobsiteId: integer('jobsite_id').references(() => jobsites.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const trainingSessions = pgTable('training_sessions', {
  id: serial('id').primaryKey(),
  trainingId: integer('training_id').notNull().references(() => trainings.id),
  trainerId: integer('trainer_id').notNull().references(() => users.id),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  location: text('location'),
});

export const enrollments = pgTable('enrollments', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id').notNull().references(() => trainingSessions.id),
  traineeId: integer('trainee_id').notNull().references(() => users.id),
  status: varchar('status', { length: 50 }).default('enrolled'), // enrolled, completed, dropped
  enrolledAt: timestamp('enrolled_at').defaultNow().notNull(),
});

export const attendance = pgTable('attendance', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id').notNull().references(() => trainingSessions.id),
  traineeId: integer('trainee_id').notNull().references(() => users.id),
  checkIn: timestamp('check_in'),
  checkOut: timestamp('check_out'),
  method: varchar('method', { length: 50 }), // manual, qr
  status: varchar('status', { length: 50 }).notNull(), // present, absent, late
});

export const questionBank = pgTable('question_bank', {
  id: serial('id').primaryKey(),
  trainingId: integer('training_id').notNull().references(() => trainings.id),
  type: varchar('type', { length: 50 }).notNull(), // multiple_choice, essay
  question: text('question').notNull(),
  options: jsonb('options'), 
  correctAnswer: text('correct_answer'),
});

export const exams = pgTable('exams', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id').notNull().references(() => trainingSessions.id),
  traineeId: integer('trainee_id').notNull().references(() => users.id),
  score: integer('score'),
  passed: boolean('passed'),
  takenAt: timestamp('taken_at').defaultNow().notNull(),
});

export const certificates = pgTable('certificates', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  trainingId: integer('training_id').notNull().references(() => trainings.id),
  certNumber: varchar('cert_number', { length: 100 }).unique().notNull(),
  url: text('url'),
  issueDate: timestamp('issue_date').defaultNow().notNull(),
  expiryDate: timestamp('expiry_date'),
});

export const approvals = pgTable('approvals', {
  id: serial('id').primaryKey(),
  traineeId: integer('trainee_id').notNull().references(() => users.id),
  trainingId: integer('training_id').notNull().references(() => trainings.id),
  managerId: integer('manager_id').notNull().references(() => users.id),
  status: varchar('status', { length: 50 }).default('pending'), // pending, approved, rejected
  requestedAt: timestamp('requested_at').defaultNow().notNull(),
});

export const evaluations = pgTable('evaluations', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id').notNull().references(() => trainingSessions.id),
  traineeId: integer('trainee_id').notNull().references(() => users.id),
  rating: integer('rating').notNull(),
  feedback: text('feedback'),
});

export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  jobsiteId: integer('jobsite_id').references(() => jobsites.id),
  action: varchar('action', { length: 255 }).notNull(),
  target: varchar('target', { length: 255 }),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});
