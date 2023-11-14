import fs from 'fs';
import { Database } from 'sqlite3';
import dotenv from 'dotenv';
dotenv.config();

// todo: have the database store when guild leaves occur, so that guild
// data can be cleaned up (without risk of unintentional deletion during
// outages).
const db = new Database('data/discord-ttl.db');
db.on('error', err => {
  console.error('Database error encountered:', err);
});

// some config values
const maxTtlString = process.env.MAXIMUM_MESSAGE_TTL_SECONDS;
const maxTtl = maxTtlString ? Number(maxTtlString) : undefined;

export function applyDatabaseMigrations() {
  const migrations_directory = './migrations';
  const sql_file_paths: string[] = [];

  fs.readdirSync(migrations_directory).forEach(file => {
    sql_file_paths.push(migrations_directory + '/' + file);
  });

  sql_file_paths.sort().forEach(path => {
    const sql = fs.readFileSync(path, { encoding: 'utf8' });
    db.exec(sql);
  });
}

const messageTtlSelectQuery = `
SELECT message_ttl
FROM ttl_settings
WHERE server_id = ?, channel_id = ?, user_id = ?;
`;

function getMessageTtlQuery(
  serverId: string,
  channelId: string | null,
  userId: string | null,
): Promise<number | undefined> {
  return new Promise((resolve, reject) => {
    db.get(messageTtlSelectQuery, [serverId, channelId, userId], (err, row: { message_ttl: number | undefined }) => {
      if (err) {
        reject(`Encountered database error: ${err.message}`);
      }
      if (row !== undefined) {
        resolve(row.message_ttl);
      }
      reject(`No row found for (${serverId}, ${channelId}, ${userId})`);
    });
  });
}

export async function getMessageTtl(serverId: string, channelId: string, userId: string): Promise<number | undefined> {
  function capMessageTtl(ttl: number): number | undefined {
    if (maxTtl !== undefined && ttl > maxTtl) {
      return maxTtl;
    }
    // -1 in the database represents a user-set infinite TTL
    if (ttl === -1) {
      return undefined;
    }
    return ttl;
  }

  // user channel settings
  let ttl = await getMessageTtlQuery(serverId, channelId, userId);
  if (ttl !== undefined) {
    return capMessageTtl(ttl);
  }
  // user server settings
  ttl = await getMessageTtlQuery(serverId, null, userId);
  if (ttl !== undefined) {
    return capMessageTtl(ttl);
  }
  // server channel settings
  ttl = await getMessageTtlQuery(serverId, channelId, null);
  if (ttl !== undefined) {
    return capMessageTtl(ttl);
  }
  // server settings
  ttl = await getMessageTtlQuery(serverId, null, null);
  if (ttl !== undefined) {
    return capMessageTtl(ttl);
  }
  return undefined;
}
