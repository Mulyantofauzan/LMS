ALTER TABLE `users` ADD COLUMN `nrp` text;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `users_nrp_unique` ON `users` (`nrp`);
--> statement-breakpoint
UPDATE `users` SET `nrp` = 'SA-0001' WHERE `id` = 1 AND `nrp` IS NULL;
--> statement-breakpoint
UPDATE `users` SET `nrp` = 'SA-0002' WHERE `id` = 2 AND `nrp` IS NULL;
--> statement-breakpoint
UPDATE `users` SET `nrp` = 'MGR-0001' WHERE `id` = 3 AND `nrp` IS NULL;
--> statement-breakpoint
UPDATE `users` SET `nrp` = 'TRN-0001' WHERE `id` = 4 AND `nrp` IS NULL;
--> statement-breakpoint
UPDATE `users` SET `nrp` = '10000001' WHERE `id` = 5 AND `nrp` IS NULL;
--> statement-breakpoint
UPDATE `users` SET `department` = 'OPD' WHERE `department` IN ('Operations', 'HSE') OR `department` IS NULL;
--> statement-breakpoint
UPDATE `users` SET `position` = 'Operator HD' WHERE `position` IS NULL OR `position` = 'Operator';
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `master_departments` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` text NOT NULL,
  `is_active` integer DEFAULT true NOT NULL,
  `created_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `master_departments_name_unique` ON `master_departments` (`name`);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `master_positions` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `name` text NOT NULL,
  `is_active` integer DEFAULT true NOT NULL,
  `created_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `master_positions_name_unique` ON `master_positions` (`name`);
--> statement-breakpoint
INSERT OR IGNORE INTO `master_departments` (`name`, `is_active`) VALUES
  ('Produksi', 1),
  ('SHE', 1),
  ('OPD', 1),
  ('Plant', 1),
  ('Logistik', 1),
  ('HCGS', 1),
  ('Engineering', 1);
--> statement-breakpoint
INSERT OR IGNORE INTO `master_positions` (`name`, `is_active`) VALUES
  ('Operator HD', 1),
  ('Driver DT', 1),
  ('Driver LV', 1),
  ('Driver FT', 1),
  ('Driver WT', 1);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `question_sets` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `training_id` integer NOT NULL,
  `trainer_id` integer NOT NULL,
  `title` text NOT NULL,
  `description` text,
  `created_at` integer DEFAULT (unixepoch()),
  FOREIGN KEY (`training_id`) REFERENCES `trainings`(`id`) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (`trainer_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `question_bank` ADD COLUMN `question_set_id` integer REFERENCES `question_sets`(`id`);
--> statement-breakpoint
ALTER TABLE `training_sessions` ADD COLUMN `status` text DEFAULT 'scheduled' NOT NULL;
--> statement-breakpoint
ALTER TABLE `training_sessions` ADD COLUMN `question_set_id` integer REFERENCES `question_sets`(`id`);
--> statement-breakpoint
ALTER TABLE `exams` ADD COLUMN `type` text DEFAULT 'posttest' NOT NULL;
--> statement-breakpoint
INSERT OR IGNORE INTO `question_sets` (`id`, `training_id`, `trainer_id`, `title`, `description`)
SELECT `id`, `training_id`, 4, 'Paket Soal Demo', 'Paket soal bawaan hasil migrasi.'
FROM `question_bank`
GROUP BY `training_id`;
--> statement-breakpoint
UPDATE `question_bank`
SET `question_set_id` = (
  SELECT `question_sets`.`id`
  FROM `question_sets`
  WHERE `question_sets`.`training_id` = `question_bank`.`training_id`
  ORDER BY `question_sets`.`id`
  LIMIT 1
)
WHERE `question_set_id` IS NULL;
