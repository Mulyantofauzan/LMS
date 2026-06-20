ALTER TABLE `users` ADD `is_active` integer DEFAULT true NOT NULL;
--> statement-breakpoint
ALTER TABLE `users` ADD `oauth_provider` text;
--> statement-breakpoint
ALTER TABLE `users` ADD `oauth_subject` text;
--> statement-breakpoint
CREATE UNIQUE INDEX `users_oauth_identity_unique` ON `users` (`oauth_provider`, `oauth_subject`);
--> statement-breakpoint
CREATE INDEX `users_active_jobsite_idx` ON `users` (`is_active`, `jobsite_id`);
