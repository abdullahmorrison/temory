CREATE TABLE `relationship_types` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
	`name` text NOT NULL,
	`emoji` text NOT NULL,
	`preset` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE `people` ADD `type_id` integer REFERENCES relationship_types(id) ON DELETE set null;
--> statement-breakpoint
INSERT INTO `relationship_types` (`name`, `emoji`, `preset`) VALUES
	('Coworker', '💼', 1),
	('Classmate', '🎓', 1),
	('Mutual', '🤝', 1),
	('Neighbor', '🏡', 1),
	('Romantic', '❤️', 1),
	('Online', '💻', 1),
	('Childhood', '🧸', 1),
	('Family', '🫂', 1);
