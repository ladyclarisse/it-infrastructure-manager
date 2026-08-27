CREATE TABLE `asset_relationships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceAssetId` int NOT NULL,
	`destinationAssetId` int NOT NULL,
	`relationshipType` varchar(64) NOT NULL,
	`sourceInterfaceId` int,
	`destinationInterfaceId` int,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `asset_relationships_id` PRIMARY KEY(`id`),
	CONSTRAINT `asset_relationship_unique` UNIQUE(`sourceAssetId`,`destinationAssetId`,`relationshipType`)
);
--> statement-breakpoint
CREATE TABLE `assets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assetTag` varchar(128) NOT NULL,
	`hostname` varchar(255),
	`displayName` varchar(255) NOT NULL,
	`description` text,
	`serialNumber` varchar(255),
	`assetType` enum('server','workstation','network_device') NOT NULL,
	`primaryIp` varchar(64),
	`primaryMac` varchar(32),
	`domain` varchar(255),
	`fqdn` varchar(255),
	`os` varchar(128),
	`osDistribution` varchar(128),
	`osVersion` varchar(128),
	`architecture` varchar(64),
	`kernelVersion` varchar(128),
	`environment` enum('PRODUCTION','DEVELOPMENT','TEST','LAB','OTHER') NOT NULL DEFAULT 'OTHER',
	`role` varchar(128),
	`locationId` int,
	`status` enum('ACTIVE','INACTIVE','MAINTENANCE','RETIRED','UNKNOWN') NOT NULL DEFAULT 'UNKNOWN',
	`manufacturer` varchar(128),
	`model` varchar(128),
	`cpuCores` int,
	`memoryMb` int,
	`storageGb` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `assets_id` PRIMARY KEY(`id`),
	CONSTRAINT `assets_asset_tag_unique` UNIQUE(`assetTag`)
);
--> statement-breakpoint
CREATE TABLE `locations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`kind` varchar(64) NOT NULL DEFAULT 'site',
	`address` text,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `locations_id` PRIMARY KEY(`id`),
	CONSTRAINT `locations_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `network_devices` (
	`assetId` int NOT NULL,
	`deviceType` varchar(128) NOT NULL,
	`firmware` varchar(128),
	`notes` text,
	CONSTRAINT `network_devices_assetId` PRIMARY KEY(`assetId`)
);
--> statement-breakpoint
CREATE TABLE `network_interfaces` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assetId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`interfaceType` varchar(64),
	`macAddress` varchar(32),
	`ipAddress` varchar(64),
	`prefix` varchar(32),
	`vlan` int,
	`speedMbps` int,
	`administrativeState` varchar(32),
	`operationalState` varchar(32),
	`description` text,
	CONSTRAINT `network_interfaces_id` PRIMARY KEY(`id`),
	CONSTRAINT `network_interfaces_asset_name_unique` UNIQUE(`assetId`,`name`)
);
--> statement-breakpoint
CREATE TABLE `servers` (
	`assetId` int NOT NULL,
	`serverType` varchar(128),
	`notes` text,
	CONSTRAINT `servers_assetId` PRIMARY KEY(`assetId`)
);
--> statement-breakpoint
CREATE TABLE `software` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`vendor` varchar(160),
	`version` varchar(128),
	`category` varchar(128),
	`license` varchar(128),
	`status` varchar(64) NOT NULL DEFAULT 'ACTIVE',
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `software_id` PRIMARY KEY(`id`),
	CONSTRAINT `software_name_version_unique` UNIQUE(`name`,`version`)
);
--> statement-breakpoint
CREATE TABLE `software_installations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`assetId` int NOT NULL,
	`softwareId` int NOT NULL,
	`installedVersion` varchar(128),
	`installedAt` timestamp,
	`updatedAt` timestamp,
	`status` varchar(64) NOT NULL DEFAULT 'ACTIVE',
	CONSTRAINT `software_installations_id` PRIMARY KEY(`id`),
	CONSTRAINT `software_install_asset_unique` UNIQUE(`assetId`,`softwareId`)
);
--> statement-breakpoint
CREATE TABLE `workstations` (
	`assetId` int NOT NULL,
	`primaryUserId` int,
	`purchaseDate` timestamp,
	`warrantyUntil` timestamp,
	`notes` text,
	CONSTRAINT `workstations_assetId` PRIMARY KEY(`assetId`)
);
--> statement-breakpoint
ALTER TABLE `asset_relationships` ADD CONSTRAINT `asset_relationship_source_fk` FOREIGN KEY (`sourceAssetId`) REFERENCES `assets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asset_relationships` ADD CONSTRAINT `asset_relationship_destination_fk` FOREIGN KEY (`destinationAssetId`) REFERENCES `assets`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asset_relationships` ADD CONSTRAINT `asset_relationship_source_interface_fk` FOREIGN KEY (`sourceInterfaceId`) REFERENCES `network_interfaces`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `asset_relationships` ADD CONSTRAINT `asset_relationship_destination_interface_fk` FOREIGN KEY (`destinationInterfaceId`) REFERENCES `network_interfaces`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assets` ADD CONSTRAINT `assets_location_fk` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `network_devices` ADD CONSTRAINT `network_devices_asset_fk` FOREIGN KEY (`assetId`) REFERENCES `assets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `network_interfaces` ADD CONSTRAINT `network_interfaces_asset_fk` FOREIGN KEY (`assetId`) REFERENCES `assets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `servers` ADD CONSTRAINT `servers_asset_fk` FOREIGN KEY (`assetId`) REFERENCES `assets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `software_installations` ADD CONSTRAINT `software_install_asset_fk` FOREIGN KEY (`assetId`) REFERENCES `assets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `software_installations` ADD CONSTRAINT `software_install_software_fk` FOREIGN KEY (`softwareId`) REFERENCES `software`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workstations` ADD CONSTRAINT `workstations_asset_fk` FOREIGN KEY (`assetId`) REFERENCES `assets`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workstations` ADD CONSTRAINT `workstations_user_fk` FOREIGN KEY (`primaryUserId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `asset_relationship_source_idx` ON `asset_relationships` (`sourceAssetId`);--> statement-breakpoint
CREATE INDEX `asset_relationship_destination_idx` ON `asset_relationships` (`destinationAssetId`);--> statement-breakpoint
CREATE INDEX `assets_hostname_idx` ON `assets` (`hostname`);--> statement-breakpoint
CREATE INDEX `assets_serial_idx` ON `assets` (`serialNumber`);--> statement-breakpoint
CREATE INDEX `assets_type_idx` ON `assets` (`assetType`);--> statement-breakpoint
CREATE INDEX `assets_status_idx` ON `assets` (`status`);--> statement-breakpoint
CREATE INDEX `assets_environment_idx` ON `assets` (`environment`);--> statement-breakpoint
CREATE INDEX `assets_location_idx` ON `assets` (`locationId`);--> statement-breakpoint
CREATE INDEX `locations_kind_idx` ON `locations` (`kind`);--> statement-breakpoint
CREATE INDEX `network_interfaces_asset_idx` ON `network_interfaces` (`assetId`);--> statement-breakpoint
CREATE INDEX `network_interfaces_ip_idx` ON `network_interfaces` (`ipAddress`);--> statement-breakpoint
CREATE INDEX `software_name_idx` ON `software` (`name`);--> statement-breakpoint
CREATE INDEX `software_install_asset_idx` ON `software_installations` (`assetId`);--> statement-breakpoint
CREATE INDEX `software_install_software_idx` ON `software_installations` (`softwareId`);--> statement-breakpoint
CREATE INDEX `workstations_user_idx` ON `workstations` (`primaryUserId`);