UPDATE `training_sessions`
SET `ended_at` = `end_time`
WHERE `ended_at` IS NULL AND `status` = 'ended';
