import { and, asc, eq, isNull, sql } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import Database from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { Message, type MessageIdsData, type MessageIdsMetadataData } from 'src/common/messageTypes';
import { debug } from '../logger';
import { ServerSettings, ServerChannelSettings, type ServerSettingsData, UserSettings } from '../common/settingsTypes';
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
  return ServerSettings.from(result[0] as ServerSettingsData);
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
  return ServerChannelSettings.from(result[0] as ServerSettingsData);
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

// =-=-=---------------------=-=-=
// .｡.:☆ user settings apis ☆:.｡.
// =-=-=---------------------=-=-=

export async function selectUserSettings(userId: string): Promise<UserSettings | undefined> {
  debug('[database] selectUserSettings', userId);
  const result = await db
    .select()
    .from(userSettings)
    .where(and(eq(userSettings.userId, userId), isNull(userSettings.serverId), isNull(userSettings.channelId)))
    .execute();
  if (result.length === 0) {
    return undefined;
  }
  return ServerSettings.from(result[0] as ServerSettingsData);
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
  return ServerChannelSettings.from(result[0] as ServerSettingsData);
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
    .values(messages.map(m => m.getData()))
    .onConflictDoNothing()
    .execute();
}

export async function selectOldestMessages(
  serverId: string,
  channelId: string,
  userId: string | undefined,
  amount: number,
): Promise<Message[]> {
  debug('[database] selectMessages', serverId, channelId, userId);
  let whereClause = and(eq(messageIds.serverId, serverId), eq(messageIds.channelId, channelId));
  if (userId) {
    whereClause = and(whereClause, eq(messageIds.authorId, userId));
  }
  return (
    await db.select().from(messageIds).where(whereClause).orderBy(asc(messageIds.messageId)).limit(amount).execute()
  ).map(row => Message.fromMessageData(row as MessageIdsData));
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
