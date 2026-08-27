CREATE TABLE `alert_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`description` text,
	`expression` text NOT NULL,
	`severity` enum('INFO','WARNING','CRITICAL') NOT NULL DEFAULT 'WARNING',
	`forDurationSeconds` int NOT NULL DEFAULT 300,
	`enabled` int NOT NULL DEFAULT 1,
	`labels` text,
	`annotations` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `alert_rules_id` PRIMARY KEY(`id`),
	CONSTRAINT `alert_rules_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ruleId` int NOT NULL,
	`monitoringTargetId` int,
	`fingerprint` varchar(128) NOT NULL,
	`severity` enum('INFO','WARNING','CRITICAL') NOT NULL,
	`status` enum('PENDING','FIRING','RESOLVED','UNKNOWN') NOT NULL DEFAULT 'PENDING',
	`summary` varchar(255) NOT NULL,
	`description` text,
	`startedAt` timestamp,
	`resolvedAt` timestamp,
	`lastSeenAt` timestamp NOT NULL DEFAULT (now()),
	`labels` text,
	`annotations` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `alerts_id` PRIMARY KEY(`id`),
	CONSTRAINT `alerts_fingerprint_unique` UNIQUE(`fingerprint`)
);
--> statement-breakpoint
CREATE TABLE `incident_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`incidentId` int NOT NULL,
	`actorUserId` int,
	`action` varchar(64) NOT NULL,
	`fromStatus` enum('OPEN','ACKNOWLEDGED','IN_PROGRESS','RESOLVED','CLOSED'),
	`toStatus` enum('OPEN','ACKNOWLEDGED','IN_PROGRESS','RESOLVED','CLOSED'),
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `incident_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `incidents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`severity` enum('INFO','WARNING','CRITICAL') NOT NULL DEFAULT 'WARNING',
	`status` enum('OPEN','ACKNOWLEDGED','IN_PROGRESS','RESOLVED','CLOSED') NOT NULL DEFAULT 'OPEN',
	`source` varchar(64) NOT NULL DEFAULT 'ALERT',
	`monitoringTargetId` int,
	`alertId` int,
	`assignedToUserId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`acknowledgedAt` timestamp,
	`resolvedAt` timestamp,
	`resolutionNotes` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `incidents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `alerts` ADD CONSTRAINT `alerts_rule_fk` FOREIGN KEY (`ruleId`) REFERENCES `alert_rules`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `alerts` ADD CONSTRAINT `alerts_target_fk` FOREIGN KEY (`monitoringTargetId`) REFERENCES `monitoring_targets`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `incident_history` ADD CONSTRAINT `incident_history_incident_fk` FOREIGN KEY (`incidentId`) REFERENCES `incidents`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `incident_history` ADD CONSTRAINT `incident_history_actor_fk` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `incidents` ADD CONSTRAINT `incidents_target_fk` FOREIGN KEY (`monitoringTargetId`) REFERENCES `monitoring_targets`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `incidents` ADD CONSTRAINT `incidents_alert_fk` FOREIGN KEY (`alertId`) REFERENCES `alerts`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `incidents` ADD CONSTRAINT `incidents_assignee_fk` FOREIGN KEY (`assignedToUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `alert_rules_enabled_idx` ON `alert_rules` (`enabled`);--> statement-breakpoint
CREATE INDEX `alert_rules_severity_idx` ON `alert_rules` (`severity`);--> statement-breakpoint
CREATE INDEX `alerts_rule_idx` ON `alerts` (`ruleId`);--> statement-breakpoint
CREATE INDEX `alerts_target_idx` ON `alerts` (`monitoringTargetId`);--> statement-breakpoint
CREATE INDEX `alerts_status_idx` ON `alerts` (`status`);--> statement-breakpoint
CREATE INDEX `incident_history_incident_idx` ON `incident_history` (`incidentId`);--> statement-breakpoint
CREATE INDEX `incident_history_created_idx` ON `incident_history` (`createdAt`);--> statement-breakpoint
CREATE INDEX `incidents_status_idx` ON `incidents` (`status`);--> statement-breakpoint
CREATE INDEX `incidents_severity_idx` ON `incidents` (`severity`);--> statement-breakpoint
CREATE INDEX `incidents_target_idx` ON `incidents` (`monitoringTargetId`);--> statement-breakpoint
CREATE INDEX `incidents_assignee_idx` ON `incidents` (`assignedToUserId`);--> statement-breakpoint
CREATE INDEX `incidents_alert_idx` ON `incidents` (`alertId`);