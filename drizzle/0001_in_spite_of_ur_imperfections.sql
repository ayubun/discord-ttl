CREATE TABLE `message_ids` (
	`server_id` text NOT NULL,
	`channel_id` text NOT NULL,
	`message_id` text NOT NULL,
	`author_id` text NOT NULL,
	PRIMARY KEY(`channel_id`, `message_id`, `server_id`)
);
