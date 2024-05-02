import { text, integer, sqliteTable } from "drizzle-orm/sqlite-core";

// tables ૮ ˶ᵔ ᵕ ᵔ˶ ა
// source: https://orm.drizzle.team/docs/column-types/sqlite
//
// if you make changes to this file, you must run `bun drizzle-kit generate:sqlite`
// to generate the proper database migrations~

export const userTtlSettings = sqliteTable('user_ttl_settings', {
  userId: text('user_id').notNull(),
  serverId: text('server_id'),
  channelId: text('channel_id'),
  ttl: integer('ttl'), // null represents no ttl
  includePins: integer('include_pins', { mode: 'boolean' }),
});

const FIVE_MINUTES_IN_SECONDS: number = 300;

export const serverTtlSettings = sqliteTable('server_ttl_settings', {
  serverId: text('server_id').notNull(),
  channelId: text('channel_id'),
  defaultTtl: integer('default_ttl'), // null represents no ttl
  maxTtl: integer('max_ttl'), // null represents no max ttl
  minTtl: integer('min_ttl').default(FIVE_MINUTES_IN_SECONDS), // null represents no min ttl (30 seconds is hardcoded)
  includePinsByDefault: integer('include_pins_by_default', { mode: 'boolean' }).notNull().default(true),
});

/*
Set your own channel-level ttl:
/my-ttl set current-channel `time:none (or time)` `include-pins:true (defaults false)`
Set your own server-level ttl:
/my-ttl set server-wide `time:none (or time)` `include-pins:true (defaults false)`
Reset your server or channel ttls to defaults:
/my-ttl reset current-channel
/my-ttl reset server-wide `reset-all-channels:true (defaults false)`

Set channel-level configs:
/settings configure current-channel `max-time:none` `min-time:1h` `default-time:none` `include-pins-by-default:true`
Set server-level configs:
/settings configure server-wide `max-time:12h` `min-time:1h` `default-time:6h` `include-pins-by-default:true`
Reset server-level ttl settings to defaults:
/settings clear current-channel
/settings clear server-wide `clear-all-channels:true (defaults false)`
*/


// server + channel; pins + ttl + disableUserTtls here
// if ttl is missing, default to server setting
// if disableUserTtls is missing, default to false
// server;

// some ttl and some pins setting

// user + server + channel WHERE message_ttl < server_ttl
// user + server WHERE message_ttl < server_ttl


/*

/server-ttl set ttl:1h delete-pins:false
/channel-ttl set ttl:1h delete-pins:true
/my-ttl set ttl:1h

my ttl > channel ttl > server ttl
channel disables > server disables
*/
