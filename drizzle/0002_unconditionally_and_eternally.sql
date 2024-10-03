CREATE TABLE `message_ids_metadata` (
	`server_id` text NOT NULL,
	`channel_id` text NOT NULL,
	`last_backfilled_message_id` text NOT NULL,
	`first_frontfilled_message_id` text,
	PRIMARY KEY(`channel_id`, `server_id`)
);
