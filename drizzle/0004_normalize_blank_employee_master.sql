UPDATE `users` SET `department` = 'OPD' WHERE `department` IS NULL OR trim(`department`) = '';
--> statement-breakpoint
UPDATE `users` SET `position` = 'Operator HD' WHERE `position` IS NULL OR trim(`position`) = '';
