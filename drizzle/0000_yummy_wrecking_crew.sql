CREATE TABLE `server_settings` (
	`server_id` text NOT NULL,
	`channel_id` text,
	`default_message_ttl` integer,
	`max_message_ttl` integer,
	`min_message_ttl` integer,
	`include_pins_by_default` integer
);
