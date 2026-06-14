ALTER TABLE `training_materials` ADD COLUMN `approval_status` text DEFAULT 'draft' NOT NULL;
--> statement-breakpoint
ALTER TABLE `training_materials` ADD COLUMN `uploaded_by` integer REFERENCES `users`(`id`);
--> statement-breakpoint
ALTER TABLE `training_materials` ADD COLUMN `reviewed_by` integer REFERENCES `users`(`id`);
--> statement-breakpoint
ALTER TABLE `training_materials` ADD COLUMN `reviewed_at` integer;
--> statement-breakpoint
ALTER TABLE `training_materials` ADD COLUMN `rejection_reason` text;
--> statement-breakpoint
UPDATE `training_materials` SET `approval_status` = 'approved';
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `training_materials_training_status_idx` ON `training_materials` (`training_id`, `approval_status`);
--> statement-breakpoint
ALTER TABLE `question_sets` ADD COLUMN `status` text DEFAULT 'draft' NOT NULL;
--> statement-breakpoint
ALTER TABLE `question_sets` ADD COLUMN `is_locked` integer DEFAULT false NOT NULL;
--> statement-breakpoint
UPDATE `question_sets`
SET `status` = 'published',
    `is_locked` = CASE
      WHEN EXISTS (SELECT 1 FROM `training_sessions` WHERE `training_sessions`.`question_set_id` = `question_sets`.`id`) THEN 1
      ELSE 0
    END;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `question_sets_status_idx` ON `question_sets` (`status`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `question_sets_owner_idx` ON `question_sets` (`trainer_id`);
--> statement-breakpoint
CREATE TABLE `training_question_sets` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `training_id` integer NOT NULL,
  `question_set_id` integer NOT NULL,
  `approval_status` text DEFAULT 'draft' NOT NULL,
  `added_by` integer,
  `reviewed_by` integer,
  `reviewed_at` integer,
  `rejection_reason` text,
  `created_at` integer DEFAULT (unixepoch()),
  FOREIGN KEY (`training_id`) REFERENCES `trainings`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`question_set_id`) REFERENCES `question_sets`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`added_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `training_question_sets_training_set_unique` ON `training_question_sets` (`training_id`, `question_set_id`);
--> statement-breakpoint
CREATE INDEX `training_question_sets_training_status_idx` ON `training_question_sets` (`training_id`, `approval_status`);
--> statement-breakpoint
INSERT OR IGNORE INTO `training_question_sets` (`training_id`, `question_set_id`, `approval_status`)
SELECT `training_id`, `id`, 'approved' FROM `question_sets`;
--> statement-breakpoint
ALTER TABLE `question_bank` ADD COLUMN `media_url` text;
--> statement-breakpoint
ALTER TABLE `question_bank` ADD COLUMN `media_type` text;
--> statement-breakpoint
ALTER TABLE `question_bank` ADD COLUMN `media_name` text;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `question_bank_set_idx` ON `question_bank` (`question_set_id`);
--> statement-breakpoint
ALTER TABLE `certificates` ADD COLUMN `session_id` integer REFERENCES `training_sessions`(`id`);
--> statement-breakpoint
UPDATE `certificates`
SET `session_id` = (
  SELECT `training_sessions`.`id`
  FROM `training_sessions`
  INNER JOIN `enrollments` ON `enrollments`.`session_id` = `training_sessions`.`id`
  WHERE `training_sessions`.`training_id` = `certificates`.`training_id`
    AND `enrollments`.`trainee_id` = `certificates`.`user_id`
  ORDER BY COALESCE(`training_sessions`.`ended_at`, `training_sessions`.`end_time`) DESC
  LIMIT 1
)
WHERE `session_id` IS NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX `certificates_user_session_unique` ON `certificates` (`user_id`, `session_id`);
--> statement-breakpoint
CREATE INDEX `certificates_training_user_idx` ON `certificates` (`training_id`, `user_id`);
--> statement-breakpoint
CREATE TABLE `certificate_sequences` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `training_id` integer NOT NULL,
  `year` integer NOT NULL,
  `next_value` integer DEFAULT 1 NOT NULL,
  FOREIGN KEY (`training_id`) REFERENCES `trainings`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `certificate_sequences_training_year_unique` ON `certificate_sequences` (`training_id`, `year`);
--> statement-breakpoint
INSERT OR IGNORE INTO `certificate_sequences` (`training_id`, `year`, `next_value`)
SELECT `training_id`, CAST(strftime('%Y', `issue_date`, 'unixepoch') AS integer), COUNT(*) + 1
FROM `certificates`
WHERE `issue_date` IS NOT NULL
GROUP BY `training_id`, strftime('%Y', `issue_date`, 'unixepoch');
