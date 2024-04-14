import dotenv from 'dotenv';
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { deleteMessageTtlQuery, selectMessageTtlQuery, updateMessageTtlQuery } from './queries';
import { db } from "./db";
dotenv.config();

// some config values
const maxTtlString = process.env['MAXIMUM_MESSAGE_TTL_IN_SECONDS'];
const minTtlString = process.env['MINIMUM_MESSAGE_TTL_IN_SECONDS'];
const maxTtl = maxTtlString ? Number(maxTtlString) : undefined;
const minTtl = minTtlString ? Number(minTtlString) : undefined;

export async function applyDatabaseMigrations() {
  migrate(db, { migrationsFolder: "drizzle" });
}

export async function getMessageTtl(
  serverId: string,
  channelId: string | null,
  userId: string | null,
): Promise<number | undefined> {
  function castMessageTtl(ttl: number): number | undefined {
    if (maxTtl !== undefined && ttl > maxTtl) {
      return maxTtl;
    }
    // -1 in the database represents a user-set infinite TTL
    if (ttl < 0) {
      return undefined;
    }
    return ttl;
  }

  // user channel settings
  let ttl = await selectMessageTtlQuery(serverId, channelId, userId);
  if (ttl !== undefined) {
    return castMessageTtl(ttl);
  }
  // user server settings
  ttl = await selectMessageTtlQuery(serverId, null, userId);
  if (ttl !== undefined) {
    return castMessageTtl(ttl);
  }
  // server channel settings
  ttl = await selectMessageTtlQuery(serverId, channelId, null);
  if (ttl !== undefined) {
    return castMessageTtl(ttl);
  }
  // server settings
  ttl = await selectMessageTtlQuery(serverId, null, null);
  if (ttl !== undefined) {
    return castMessageTtl(ttl);
  }
  return undefined;
}

export async function updateMessageTtl(
  serverId: string,
  channelId: string | null,
  userId: string | null,
  message_ttl: number | undefined,
): Promise<void> {
  function castMessageTtl(ttl: number | undefined): number {
    // -1 in the database represents a user-set infinite TTL
    if (ttl === undefined || ttl < 0) {
      return -1;
    }
    if (maxTtl !== undefined && ttl > maxTtl) {
      return maxTtl;
    }
    return ttl;
  }

  return updateMessageTtlQuery(serverId, channelId, userId, castMessageTtl(message_ttl));
}

export async function deleteMessageTtl(
  serverId: string,
  channelId: string | null,
  userId: string | null,
): Promise<void> {
  return deleteMessageTtlQuery(serverId, channelId, userId);
}
