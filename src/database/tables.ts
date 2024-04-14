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
  messageTtl: integer('message_ttl'), // null represents no ttl
  includePins: integer('include_pins', { mode: 'boolean' }).default(false),
});

export const serverTtlSettings = sqliteTable('server_ttl_settings', {
  serverId: text('server_id').notNull(),
  channelId: text('channel_id'),
  messageTtl: integer('message_ttl'), // null represents no ttl
  includePins: integer('include_pins', { mode: 'boolean' }).default(false),
});
