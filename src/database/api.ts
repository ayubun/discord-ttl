import fs from 'fs';
import { Database } from 'sqlite3';
import dotenv from 'dotenv';
dotenv.config();

// todo: have the database store when guild leaves occur, so that guild
// data can be cleaned up (without risk of unintentional deletion during
// outages).
const db = new Database('data/discord-ttl.db');
db.on('error', function (error) {
  console.error('database error encountered: ', error);
});

// some config values
const deprecatedDefaultTtlString = process.env.DEFAULT_MESSAGE_TTL; // deprecated
const maxTtlString = process.env.MAXIMUM_MESSAGE_TTL_SECONDS;
const deprecatedDefaultTtl = deprecatedDefaultTtlString ? Number(deprecatedDefaultTtlString) : undefined; // deprecated
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

function executeMessageTtlSelectQuery(
  serverId: string,
  channelId: string | null,
  userId: string | null,
): number | undefined {
  let ttl: number | undefined;
  db.get(messageTtlSelectQuery, [serverId, channelId, userId], (err, row: { message_ttl: number | undefined }) => {
    if (err) {
      return;
    }
    if (row !== undefined) {
      ttl = row.message_ttl;
    }
  });
  return ttl;
}

export function getMessageTtl(serverId: string, channelId: string, userId: string): number | undefined {
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
  let ttl = executeMessageTtlSelectQuery(serverId, channelId, userId);
  if (ttl !== undefined) {
    return capMessageTtl(ttl);
  }
  // user server settings
  ttl = executeMessageTtlSelectQuery(serverId, null, userId);
  if (ttl !== undefined) {
    return capMessageTtl(ttl);
  }
  // server channel settings
  ttl = executeMessageTtlSelectQuery(serverId, channelId, null);
  if (ttl !== undefined) {
    return capMessageTtl(ttl);
  }
  // server settings
  ttl = executeMessageTtlSelectQuery(serverId, null, null);
  if (ttl !== undefined) {
    return capMessageTtl(ttl);
  }
  // global bot settings
  if (deprecatedDefaultTtl !== undefined) {
    return capMessageTtl(deprecatedDefaultTtl);
  }
  return undefined;
}
