import { text, integer, sqliteTable, primaryKey } from 'drizzle-orm/sqlite-core';

// tables ૮ ˶ᵔ ᵕ ᵔ˶ ა
// source: https://orm.drizzle.team/docs/column-types/sqlite
//
// if you make changes to this file, you must run `bun drizzle-kit generate:sqlite`
// to generate the proper database migrations~

// server & server channel settings (´｡• ᵕ •｡`)
export const serverSettings = sqliteTable(
  'server_settings',
  {
    serverId: text('server_id').notNull(),
    channelId: text('channel_id'),
    defaultMessageTtl: integer('default_message_ttl'), // null represents no ttl
    maxMessageTtl: integer('max_message_ttl'), // null represents no max ttl
    minMessageTtl: integer('min_message_ttl'), // null represents no min ttl (30 seconds is hardcoded)
    includePinsByDefault: integer('include_pins_by_default', { mode: 'boolean' }),
  },
  table => {
    return {
      pk: primaryKey({ columns: [table.serverId, table.channelId] }),
    };
  },
);

// user & user server & user server channel settings ^^
export const userSettings = sqliteTable(
  'user_settings',
  {
    userId: text('user_id').notNull(),
    serverId: text('server_id'),
    channelId: text('channel_id'),
    defaultMessageTtl: integer('message_ttl'), // null represents no ttl
    includePins: integer('include_pins', { mode: 'boolean' }),
  },
  table => {
    return {
      pk: primaryKey({ columns: [table.userId, table.serverId, table.channelId] }),
    };
  },
);

// message ids cache ☆:.｡.o(≧▽≦)o.｡.:☆
// **NOTE:** this table does NOT store message content
export const messageIds = sqliteTable(
  'message_ids',
  {
    serverId: text('server_id').notNull(),
    channelId: text('channel_id').notNull(),
    messageId: text('message_id').notNull(),
    authorId: text('author_id').notNull(),
  },
  table => {
    return {
      pk: primaryKey({ columns: [table.serverId, table.channelId, table.messageId] }),
    };
  },
);

// message ids metadata (helps track when the database is fully backfilled)
export const messageIdsMetadata = sqliteTable(
  'message_ids_metadata',
  {
    serverId: text('server_id').notNull(),
    channelId: text('channel_id').notNull(),
    // This is the most recent message ID that was "backfilled"
    // i.e. added via the message retrieval loop
    lastBackfilledMessageId: text('last_backfilled_message_id').notNull(),
  },
  table => {
    return {
      pk: primaryKey({ columns: [table.serverId, table.channelId] }),
    };
  },
);
