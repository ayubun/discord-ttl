import { text, integer, sqliteTable } from 'drizzle-orm/sqlite-core';

// tables ૮ ˶ᵔ ᵕ ᵔ˶ ა
// source: https://orm.drizzle.team/docs/column-types/sqlite
//
// if you make changes to this file, you must run `bun drizzle-kit generate:sqlite`
// to generate the proper database migrations~

// user settings to be included in a future update !

// export const userSettings = sqliteTable('user_settings', {
//   userId: text('user_id').notNull(),
//   serverId: text('server_id'),
//   channelId: text('channel_id'),
//   messageTtl: integer('message_ttl'), // null represents no ttl
//   includePins: integer('include_pins', { mode: 'boolean' }),
// });

export const serverSettings = sqliteTable('server_settings', {
  serverId: text('server_id').notNull(),
  channelId: text('channel_id'),
  defaultMessageTtl: integer('default_message_ttl'), // null represents no ttl
  maxMessageTtl: integer('max_message_ttl'), // null represents no max ttl
  minMessageTtl: integer('min_message_ttl'), // null represents no min ttl (30 seconds is hardcoded)
  includePinsByDefault: integer('include_pins_by_default', { mode: 'boolean' }),
});
