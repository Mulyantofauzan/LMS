CREATE TABLE `external_certificate_types` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` text NOT NULL,
  `issuer` text,
  `description` text,
  `default_validity_months` integer,
  `created_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE UNIQUE INDEX `external_certificate_types_name_unique` ON `external_certificate_types` (`name`);
--> statement-breakpoint
CREATE TABLE `external_certificates` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `user_id` integer NOT NULL,
  `type_id` integer NOT NULL,
  `cert_number` text NOT NULL,
  `issuer` text,
  `issue_date` integer DEFAULT (unixepoch()),
  `expiry_date` integer,
  `notes` text,
  `input_by` integer,
  `created_at` integer DEFAULT (unixepoch()),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`type_id`) REFERENCES `external_certificate_types`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`input_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `external_certificates_cert_number_unique` ON `external_certificates` (`cert_number`);
--> statement-breakpoint
CREATE INDEX `external_certificates_user_idx` ON `external_certificates` (`user_id`);
--> statement-breakpoint
CREATE INDEX `external_certificates_type_idx` ON `external_certificates` (`type_id`);
--> statement-breakpoint
CREATE TABLE `external_certificate_equivalencies` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `external_type_id` integer NOT NULL,
  `training_id` integer NOT NULL,
  `created_at` integer DEFAULT (unixepoch()),
  FOREIGN KEY (`external_type_id`) REFERENCES `external_certificate_types`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`training_id`) REFERENCES `trainings`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `external_certificate_equivalencies_unique` ON `external_certificate_equivalencies` (`external_type_id`, `training_id`);
--> statement-breakpoint
CREATE INDEX `external_certificate_equivalencies_training_idx` ON `external_certificate_equivalencies` (`training_id`);
--> statement-breakpoint
CREATE TABLE `training_requirements` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `training_id` integer NOT NULL,
  `scope` text DEFAULT 'global' NOT NULL,
  `jobsite_id` integer,
  `department` text,
  `position` text,
  `user_id` integer,
  `requirement_type` text DEFAULT 'mandatory' NOT NULL,
  `recurrence` text DEFAULT 'once' NOT NULL,
  `interval_months` integer,
  `effective_year` integer,
  `created_by` integer,
  `created_at` integer DEFAULT (unixepoch()),
  FOREIGN KEY (`training_id`) REFERENCES `trainings`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`jobsite_id`) REFERENCES `jobsites`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `training_requirements_training_idx` ON `training_requirements` (`training_id`);
--> statement-breakpoint
CREATE INDEX `training_requirements_scope_idx` ON `training_requirements` (`scope`, `jobsite_id`, `department`, `position`, `user_id`);
--> statement-breakpoint
CREATE TABLE `training_requirement_exclusions` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `requirement_id` integer NOT NULL,
  `user_id` integer NOT NULL,
  `reason` text,
  `created_by` integer,
  `created_at` integer DEFAULT (unixepoch()),
  FOREIGN KEY (`requirement_id`) REFERENCES `training_requirements`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `training_requirement_exclusions_unique` ON `training_requirement_exclusions` (`requirement_id`, `user_id`);
--> statement-breakpoint
CREATE INDEX `training_requirement_exclusions_user_idx` ON `training_requirement_exclusions` (`user_id`);
