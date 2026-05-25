ALTER TABLE `training_sessions` ADD COLUMN `started_at` integer;
--> statement-breakpoint
ALTER TABLE `training_sessions` ADD COLUMN `ended_at` integer;
--> statement-breakpoint
UPDATE `training_sessions`
SET `started_at` = `start_time`
WHERE `started_at` IS NULL AND `status` IN ('active', 'ended');
--> statement-breakpoint
UPDATE `training_sessions`
SET `ended_at` = `end_time`
WHERE `ended_at` IS NULL AND `status` = 'ended';
