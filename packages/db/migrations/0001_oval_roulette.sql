CREATE TABLE `board` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`createdById` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`createdById`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `document` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`createdById` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`createdById`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
