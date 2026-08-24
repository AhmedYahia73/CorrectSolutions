CREATE TABLE `target_items` (
	`id` char(36) NOT NULL DEFAULT (UUID()),
	`year` int NOT NULL,
	`month` int NOT NULL,
	`number` double NOT NULL,
	`target_id` char(36),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `target_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `target_sales` (
	`id` char(36) NOT NULL DEFAULT (UUID()),
	`target_id` char(36),
	`user_id` char(36),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `target_sales_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `status_requests` (
	`id` char(36) NOT NULL DEFAULT (UUID()),
	`visit_id` char(36) NOT NULL,
	`user_id` char(36) NOT NULL,
	`from` enum('visit','sales','delivered') NOT NULL,
	`to` enum('visit','sales','delivered') NOT NULL,
	`status` enum('pending','approve','reject') NOT NULL DEFAULT 'pending',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `status_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `target_items` ADD CONSTRAINT `target_items_target_id_targets_id_fk` FOREIGN KEY (`target_id`) REFERENCES `targets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `target_sales` ADD CONSTRAINT `target_sales_target_id_targets_id_fk` FOREIGN KEY (`target_id`) REFERENCES `targets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `target_sales` ADD CONSTRAINT `target_sales_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `status_requests` ADD CONSTRAINT `status_requests_visit_id_visits_id_fk` FOREIGN KEY (`visit_id`) REFERENCES `visits`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `status_requests` ADD CONSTRAINT `status_requests_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `targets` DROP COLUMN `number`;