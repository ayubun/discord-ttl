CREATE TABLE `user_settings` (
	`user_id` text NOT NULL,
	`server_id` text,
	`channel_id` text,
	`message_ttl` integer,
	`include_pins` integer,
	PRIMARY KEY(`user_id`, `server_id`, `channel_id`)
);
--> statement-breakpoint
/*
SQLite does not support altering primary key
You can do it in 3 steps with drizzle orm:
 - create new mirror table with needed pk, rename current table to old_table, generate SQL
 - migrate old data from one table to another
 - delete old_table in schema, generate sql

or create manual migration like below:

ALTER TABLE table_name RENAME TO old_table;
CREATE TABLE table_name (
	column1 datatype [ NULL | NOT NULL ],
	column2 datatype [ NULL | NOT NULL ],
	...
	PRIMARY KEY (pk_col1, pk_col2, ... pk_col_n)
 );
INSERT INTO table_name SELECT * FROM old_table;

Due to that we don't generate migration automatically and it has to be done manually
*/
