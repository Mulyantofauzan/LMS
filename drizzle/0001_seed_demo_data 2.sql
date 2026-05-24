INSERT OR IGNORE INTO `jobsites` (`id`, `name`, `location`, `settings`) VALUES
  (1, 'Tambang Alpha', 'Kalimantan Timur', '{"timezone":"WITA"}'),
  (2, 'Pabrik Beta', 'Jawa Barat', '{"timezone":"WIB"}');
--> statement-breakpoint
INSERT OR IGNORE INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `jobsite_id`, `department`, `position`) VALUES
  (1, 'Super Admin', 'superadmin@demo.com', '$2b$10$gM8aAgLPi31fSFj85hm8e.HX1I0jzxkx4ZLUdWW9huciOZD0hWpoi', 'super-admin', NULL, NULL, NULL),
  (2, 'Site Admin Alpha', 'siteadmin@demo.com', '$2b$10$gM8aAgLPi31fSFj85hm8e.HX1I0jzxkx4ZLUdWW9huciOZD0hWpoi', 'site-admin', 1, NULL, NULL),
  (3, 'Manager Operasional', 'manager@demo.com', '$2b$10$gM8aAgLPi31fSFj85hm8e.HX1I0jzxkx4ZLUdWW9huciOZD0hWpoi', 'manager', 1, 'Operations', NULL),
  (4, 'Trainer Ahli', 'trainer@demo.com', '$2b$10$gM8aAgLPi31fSFj85hm8e.HX1I0jzxkx4ZLUdWW9huciOZD0hWpoi', 'trainer', 1, 'HSE', NULL),
  (5, 'Trainee Junior', 'trainee@demo.com', '$2b$10$gM8aAgLPi31fSFj85hm8e.HX1I0jzxkx4ZLUdWW9huciOZD0hWpoi', 'trainee', 1, 'Operations', 'Operator');
--> statement-breakpoint
INSERT OR IGNORE INTO `trainings` (`id`, `title`, `description`, `category`, `type`, `is_mandatory`, `jobsite_id`) VALUES
  (1, 'Keselamatan Kerja Dasar (HSE Basic)', 'Pelatihan wajib untuk semua karyawan baru di area operasional.', 'HSE', 'offline', 1, 1),
  (2, 'Pengoperasian Alat Berat', 'Pelatihan khusus untuk operator alat berat (Excavator).', 'Teknis', 'offline', 0, 1);
--> statement-breakpoint
INSERT OR IGNORE INTO `training_materials` (`id`, `training_id`, `title`, `type`, `file_url`) VALUES
  (1, 1, 'Buku Panduan HSE', 'pdf', '/api/materials/demo/dummy-hse-guide.pdf'),
  (2, 1, 'Video Edukasi Safety', 'video', '/api/materials/demo/dummy-safety-video.mp4');
--> statement-breakpoint
INSERT OR IGNORE INTO `training_sessions` (`id`, `training_id`, `trainer_id`, `start_time`, `end_time`, `location`) VALUES
  (1, 1, 4, unixepoch() - 172800, unixepoch() - 86400, 'Ruang Training A'),
  (2, 2, 4, unixepoch() + 432000, unixepoch() + 518400, 'Area Lapangan');
--> statement-breakpoint
INSERT OR IGNORE INTO `enrollments` (`id`, `session_id`, `trainee_id`, `status`) VALUES
  (1, 1, 5, 'completed'),
  (2, 2, 5, 'enrolled');
--> statement-breakpoint
INSERT OR IGNORE INTO `attendance` (`id`, `session_id`, `trainee_id`, `check_in`, `check_out`, `method`, `status`) VALUES
  (1, 1, 5, unixepoch() - 172800, unixepoch() - 86400, 'qr', 'present');
--> statement-breakpoint
INSERT OR IGNORE INTO `certificates` (`id`, `user_id`, `training_id`, `cert_number`, `issue_date`, `expiry_date`) VALUES
  (1, 5, 1, 'CERT-HSE-2026-001', unixepoch(), unixepoch() + 31536000);
--> statement-breakpoint
INSERT OR IGNORE INTO `approvals` (`id`, `trainee_id`, `training_id`, `manager_id`, `status`) VALUES
  (1, 5, 2, 3, 'pending');
--> statement-breakpoint
INSERT OR IGNORE INTO `audit_logs` (`id`, `user_id`, `action`, `target`, `timestamp`) VALUES
  (1, 1, 'SYSTEM_SETUP', 'ALL', unixepoch());
--> statement-breakpoint
INSERT OR IGNORE INTO `settings` (`key`, `value`) VALUES
  ('brandName', 'PST Learning Management System'),
  ('brandShort', 'PST'),
  ('heroTitle', 'Berdayakan Tim Anda'),
  ('heroSubtitle', 'Sistem Manajemen Pembelajaran terdepan yang dirancang untuk industri modern.'),
  ('heroBadge', 'Dipercaya oleh 50+ Perusahaan Industri');
