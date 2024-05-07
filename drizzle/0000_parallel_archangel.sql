CREATE TABLE `server_ttl_settings` (
	`server_id` text NOT NULL,
	`channel_id` text,
	`message_ttl` integer,
	`include_pins` integer DEFAULT false
);
--> statement-breakpoint
CREATE TABLE `user_ttl_settings` (
	`user_id` text NOT NULL,
	`server_id` text,
	`channel_id` text,
	`message_ttl` integer,
	`include_pins` integer DEFAULT false
);
