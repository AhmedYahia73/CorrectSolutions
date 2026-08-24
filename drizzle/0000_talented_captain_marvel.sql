CREATE TABLE `users` (
	`id` char(36) NOT NULL DEFAULT (UUID()),
	`name` varchar(200) NOT NULL,
	`email` varchar(100) NOT NULL,
	`phone` varchar(20) NOT NULL,
	`password` varchar(255) NOT NULL,
	`role` enum('admin','user','leader','sales') NOT NULL DEFAULT 'admin',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`),
	CONSTRAINT `users_phone_unique` UNIQUE(`phone`)
);
--> statement-breakpoint
CREATE TABLE `certificate` (
	`id` char(36) NOT NULL DEFAULT (UUID()),
	`company_name` varchar(255) NOT NULL,
	`certificate_name` varchar(255) NOT NULL,
	`qr` varchar(255) NOT NULL,
	`date` datetime NOT NULL,
	`images` json NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `certificate_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` char(36) NOT NULL DEFAULT (UUID()),
	`logo` varchar(255),
	`brand_name` varchar(255),
	`qr` varchar(255) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `settings_id` PRIMARY KEY(`id`)
);
