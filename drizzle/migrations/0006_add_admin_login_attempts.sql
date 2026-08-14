CREATE TABLE `admin_login_attempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scope` varchar(16) NOT NULL,
	`attempt_key` varchar(320) NOT NULL,
	`failure_count` int NOT NULL DEFAULT 0,
	`window_started_at` timestamp NOT NULL DEFAULT (now()),
	`locked_until` timestamp,
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `admin_login_attempts_id` PRIMARY KEY(`id`),
	CONSTRAINT `admin_login_attempts_scope_key` UNIQUE(`scope`,`attempt_key`)
);
