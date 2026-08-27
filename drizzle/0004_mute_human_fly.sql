CREATE TABLE `monitoring_targets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assetId` int NOT NULL,
	`type` enum('NODE_EXPORTER','WINDOWS_EXPORTER','SNMP','DOCKER','PROXMOX','CUSTOM') NOT NULL DEFAULT 'NODE_EXPORTER',
	`endpoint` varchar(255) NOT NULL,
	`port` int NOT NULL DEFAULT 9100,
	`enabled` int NOT NULL DEFAULT 0,
	`status` enum('NOT_CONFIGURED','CONFIGURED','UP','DOWN','UNKNOWN') NOT NULL DEFAULT 'NOT_CONFIGURED',
	`labels` text,
	`lastObservedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `monitoring_targets_id` PRIMARY KEY(`id`),
	CONSTRAINT `monitoring_targets_asset_type_endpoint_unique` UNIQUE(`assetId`,`type`,`endpoint`,`port`)
);
--> statement-breakpoint
ALTER TABLE `monitoring_targets` ADD CONSTRAINT `monitoring_targets_asset_fk` FOREIGN KEY (`assetId`) REFERENCES `assets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `monitoring_targets_asset_idx` ON `monitoring_targets` (`assetId`);--> statement-breakpoint
CREATE INDEX `monitoring_targets_status_idx` ON `monitoring_targets` (`status`);--> statement-breakpoint
CREATE INDEX `monitoring_targets_enabled_idx` ON `monitoring_targets` (`enabled`);