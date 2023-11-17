import fs from 'fs';
import dotenv from 'dotenv';
import { deleteMessageTtlQuery, selectMessageTtlQuery, updateMessageTtlQuery, executeQuery } from './queries';
dotenv.config();

// some config values
const maxTtlString = process.env.MAXIMUM_MESSAGE_TTL_SECONDS;
const maxTtl = maxTtlString ? Number(maxTtlString) : undefined;

export async function applyDatabaseMigrations() {
  const migrations_directory = './migrations';
  const sql_file_paths: string[] = [];

  fs.readdirSync(migrations_directory).forEach(file => {
    sql_file_paths.push(migrations_directory + '/' + file);
  });

  for await (const path of sql_file_paths.sort().values()) {
    const sql = fs.readFileSync(path, { encoding: 'utf8' });
    await executeQuery(sql);
  }
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
