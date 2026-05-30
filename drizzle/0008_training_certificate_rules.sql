ALTER TABLE `trainings` ADD COLUMN `training_code` text;
--> statement-breakpoint
ALTER TABLE `trainings` ADD COLUMN `certificate_enabled` integer DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE `trainings` ADD COLUMN `certificate_validity_months` integer;
--> statement-breakpoint
ALTER TABLE `trainings` ADD COLUMN `certificate_passing_score` integer DEFAULT 70 NOT NULL;
--> statement-breakpoint
ALTER TABLE `trainings` ADD COLUMN `certificate_number_format` text DEFAULT 'PST/{TRAINING_CODE}/{YEAR}/{SEQ}' NOT NULL;
--> statement-breakpoint
ALTER TABLE `trainings` ADD COLUMN `certificate_template_url` text;
--> statement-breakpoint
ALTER TABLE `trainings` ADD COLUMN `certificate_template_config` text;
