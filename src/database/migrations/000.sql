--- v1 of discord-ttl only has server-specific TTLs (meaning that a user cannot set "user-wide" settings
-- beyond a single server). the focus here is to ensure that database data is only retained so long as the
-- bot is operating in a server.
CREATE TABLE IF NOT EXISTS ttl_settings (
  -- server owners are the core audience of discord-ttl; all configs reset upon discord-ttl leaving
  -- a server, so the server id is an essential part of the db in v1 (DELETE WHERE server_id = ?)
  server_id INTEGER NOT NULL,
  -- channel configs are controllable by anyone with delete message perms within said channel.
  -- they will be wiped upon a channel being deleted (DELETE WHERE server_id = ?, channel_id = ?).
  channel_id INTEGER,
  -- user configs are defined by each individual. they can be server-wide or channel-wide.
  -- they will reset upon the user leaving the server (DELETE WHERE server_id = ?, user_id = ?).
  user_id INTEGER,
  -- the actual ttl of messages. this must be non-null, but a value of -1 indicates an "infinite" ttl
  -- (so messages will never delete).
  message_ttl INTEGER NOT NULL,
  PRIMARY KEY(server_id, channel_id, user_id)
);
