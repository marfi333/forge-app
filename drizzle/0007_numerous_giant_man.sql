CREATE TABLE `exercise_muscle_groups` (
	`template_exercise_id` text NOT NULL,
	`muscle_group_id` text NOT NULL,
	PRIMARY KEY(`template_exercise_id`, `muscle_group_id`),
	FOREIGN KEY (`template_exercise_id`) REFERENCES `template_exercises`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`muscle_group_id`) REFERENCES `muscle_groups`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `muscle_groups` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`name` text NOT NULL,
	`is_system` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `muscle_groups` (`id`, `user_id`, `name`, `is_system`, `created_at`) VALUES
('mg_chest', NULL, 'chest', 1, 1715400000),
('mg_back', NULL, 'back', 1, 1715400000),
('mg_shoulders', NULL, 'shoulders', 1, 1715400000),
('mg_biceps', NULL, 'biceps', 1, 1715400000),
('mg_triceps', NULL, 'triceps', 1, 1715400000),
('mg_quads', NULL, 'quads', 1, 1715400000),
('mg_hamstrings', NULL, 'hamstrings', 1, 1715400000),
('mg_glutes', NULL, 'glutes', 1, 1715400000),
('mg_core', NULL, 'core', 1, 1715400000),
('mg_calves', NULL, 'calves', 1, 1715400000),
('mg_forearms', NULL, 'forearms', 1, 1715400000);
