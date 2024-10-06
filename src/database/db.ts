import { and, eq, isNull, sql } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import Database from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import type { Message, MessageIdsMetadataData } from 'src/common/messageTypes';
import { debug } from '../logger';
import { ServerSettings, ServerChannelSettings, type ServerSettingsData } from '../common/settingsTypes';
import { messageIds, messageIdsMetadata, serverSettings } from './tables';

const sqlite = new Database('data/discord-ttl.db');
// docs: https://orm.drizzle.team/docs/get-started-sqlite#bun-sqlite
// https://orm.drizzle.team/learn/guides/conditional-filters-in-query
const db = drizzle(sqlite);
migrate(db, { migrationsFolder: 'drizzle' });

// =-=-=-----------------------=-=-=
// .｡.:☆ server settings apis ☆:.｡.
// =-=-=-----------------------=-=-=

export async function selectServerSettings(serverId: string): Promise<ServerSettings | undefined> {
  debug('[database] selectServerSettings', serverId);
  const result = await db
    .select()
    .from(serverSettings)
    .where(and(eq(serverSettings.serverId, serverId), isNull(serverSettings.channelId)))
    .execute();
  if (result.length === 0) {
    return undefined;
  }
  return ServerSettings.fromServerSettingsData(result[0] as ServerSettingsData);
}

export async function selectServerChannelSettings(
  serverId: string,
  channelId: string,
): Promise<ServerChannelSettings | undefined> {
  debug('[database] selectServerChannelSettings', serverId, channelId);
  const result = await db
    .select()
    .from(serverSettings)
    .where(and(eq(serverSettings.serverId, serverId), eq(serverSettings.channelId, channelId)))
    .execute();
  if (result.length === 0) {
    return undefined;
  }
  return ServerChannelSettings.fromServerSettingsData(result[0] as ServerSettingsData);
}

export async function upsertServerSettings(newServerSettings: ServerSettings): Promise<void> {
  debug('[database] upsertServerSettings', JSON.stringify(newServerSettings, null, 2));
  await db
    .insert(serverSettings)
    .values(newServerSettings.getData())
    .onConflictDoUpdate({
      target: [serverSettings.serverId, serverSettings.channelId],
      set: newServerSettings.getData(),
    })
    .execute();
}

export async function upsertServerChannelSettings(newServerChannelSettings: ServerChannelSettings): Promise<void> {
  debug('[database] upsertServerChannelSettings', JSON.stringify(newServerChannelSettings, null, 2));
  await db
    .insert(serverSettings)
    .values(newServerChannelSettings.getData())
    .onConflictDoUpdate({
      target: [serverSettings.serverId, serverSettings.channelId],
      set: newServerChannelSettings.getData(),
    })
    .execute();
}

export async function deleteAllServerSettings(serverId: string): Promise<void> {
  debug('[database] deleteAllServerSettings', serverId);
  await db.delete(serverSettings).where(eq(serverSettings.serverId, serverId)).execute();
}

// =-=-=---------------=-=-=
// .｡.:☆ message apis ☆:.｡.
// =-=-=---------------=-=-=

export async function insertMessages(messages: Message[]): Promise<void> {
  debug('[database] insertMessages', JSON.stringify(messages, null, 2));
  await db
    .insert(messageIds)
    // TODO: properly handle when we try to insert a message that already exists
    // this can happen if the bot restarts and tries to backfill messages that were frontfilled
    .values(messages.map(m => m.getData()))
    .execute();
}

export async function selectMessageIdsMetadata(
  serverId: string,
  channelId: string,
): Promise<MessageIdsMetadataData | undefined> {
  debug('[database] selectMessageIdsMetadata', serverId, channelId);
  const result = await db
    .select()
    .from(messageIdsMetadata)
    .where(and(eq(messageIdsMetadata.serverId, serverId), eq(messageIdsMetadata.channelId, channelId)))
    .execute();
  if (result.length === 0) {
    return undefined;
  }
  return result[0] as MessageIdsMetadataData;
}

export async function upsertMessageIdsMetadatas(newMessageIdsMetadatas: MessageIdsMetadataData[]): Promise<void> {
  debug('[database] upsertMessageIdsMetadatas', JSON.stringify(newMessageIdsMetadatas, null, 2));
  await db
    .insert(messageIdsMetadata)
    .values(newMessageIdsMetadatas)
    .onConflictDoUpdate({
      target: [messageIdsMetadata.serverId, messageIdsMetadata.channelId],
      // https://orm.drizzle.team/learn/guides/upsert#postgresql-and-sqlite
      set: {
        lastBackfilledMessageId: sql.raw(`excluded.${messageIdsMetadata.lastBackfilledMessageId.name}`),
      },
    })
    .execute();
}
