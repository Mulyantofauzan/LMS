ALTER TABLE `trainings` ADD COLUMN `approval_status` text DEFAULT 'approved' NOT NULL;
--> statement-breakpoint
ALTER TABLE `trainings` ADD COLUMN `proposed_by` integer REFERENCES `users`(`id`);
--> statement-breakpoint
ALTER TABLE `trainings` ADD COLUMN `approved_by` integer REFERENCES `users`(`id`);
--> statement-breakpoint
ALTER TABLE `trainings` ADD COLUMN `approved_at` integer;
--> statement-breakpoint
ALTER TABLE `trainings` ADD COLUMN `rejection_reason` text;
--> statement-breakpoint
UPDATE `trainings`
SET `approval_status` = 'approved'
WHERE `approval_status` IS NULL OR trim(`approval_status`) = '';
