CREATE TABLE `targets` (
	`id` char(36) NOT NULL DEFAULT (UUID()),
	`type` enum('visit','sales') DEFAULT 'visit',
	`name` varchar(255) NOT NULL,
	`number` double NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `targets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `visitStatus` (
	`id` char(36) NOT NULL DEFAULT (UUID()),
	`name` varchar(100) NOT NULL,
	`status` boolean NOT NULL DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `visitStatus_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` char(36) NOT NULL DEFAULT (UUID()),
	`name` varchar(200) NOT NULL,
	`email` varchar(100) NOT NULL,
	`phone` varchar(20) NOT NULL,
	`image` varchar(200),
	`password` varchar(255) NOT NULL,
	`status` enum('active','inactive') DEFAULT 'active',
	`role` enum('admin','leader','sales') NOT NULL DEFAULT 'sales',
	`leader_id` char(36),
	`target_id` char(36),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`),
	CONSTRAINT `users_phone_unique` UNIQUE(`phone`)
);
--> statement-breakpoint
CREATE TABLE `visits` (
	`id` char(36) NOT NULL DEFAULT (UUID()),
	`lat` double NOT NULL,
	`lng` double NOT NULL,
	`name` varchar(255) NOT NULL,
	`address` varchar(500) NOT NULL,
	`notes` varchar(1000),
	`phone` varchar(20) NOT NULL,
	`status` enum('visit','sales','delivered') DEFAULT 'visit',
	`status_id` char(36),
	`sales_id` char(36),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `visits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `wishList` (
	`id` char(36) NOT NULL DEFAULT (UUID()),
	`name` varchar(100) NOT NULL,
	`description` varchar(1000),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `wishList_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_leader_id_users_id_fk` FOREIGN KEY (`leader_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_target_id_targets_id_fk` FOREIGN KEY (`target_id`) REFERENCES `targets`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `visits` ADD CONSTRAINT `visits_status_id_visitStatus_id_fk` FOREIGN KEY (`status_id`) REFERENCES `visitStatus`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `visits` ADD CONSTRAINT `visits_sales_id_users_id_fk` FOREIGN KEY (`sales_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;