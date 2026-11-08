ALTER TABLE `activities` ADD `status` text DEFAULT 'doing' NOT NULL;--> statement-breakpoint
ALTER TABLE `activities` ADD `in_the_way` text DEFAULT '' NOT NULL;