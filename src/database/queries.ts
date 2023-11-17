import { Database } from 'sqlite3';

// todo: have the database store when guild leaves occur, so that guild
// data can be cleaned up (without risk of unintentional deletion during
// outages).
export const db = new Database('data/discord-ttl.db');
db.on('error', err => {
  console.error('Encountered database error:', err);
});

export function executeQuery(sql: string): Promise<void> {
  return new Promise((resolve, reject) => {
    db.exec(sql, err => {
      if (err) {
        return reject(`[EXECUTE] Encountered database error: ${err.message}`);
      }
      resolve();
    });
  });
}

const selectMessageTtlQueryString = `
SELECT message_ttl
  FROM ttl_settings
  WHERE server_id = ?, channel_id = ?, user_id = ?;
`;

export function selectMessageTtlQuery(
  serverId: string,
  channelId: string | null,
  userId: string | null,
): Promise<number | undefined> {
  return new Promise((resolve, reject) => {
    db.get(
      selectMessageTtlQueryString,
      [serverId, channelId, userId],
      (err, row: { message_ttl: number | undefined }) => {
        if (err) {
          return reject(`[SELECT][MESSAGE_TTL] Encountered database error: ${err.message}`);
        }
        // No row found. Return undefined
        if (row === undefined) {
          return resolve(undefined);
        }
        resolve(row.message_ttl);
      },
    );
  });
}

const updateMessageTtlQueryString = `
UPDATE ttl_settings
  SET message_ttl = ?
  WHERE server_id = ?, channel_id = ?, user_id = ?;
`;

export function updateMessageTtlQuery(
  serverId: string,
  channelId: string | null,
  userId: string | null,
  message_ttl: number,
): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(updateMessageTtlQueryString, [message_ttl, serverId, channelId, userId], err => {
      if (err) {
        return reject(`[UPDATE][MESSAGE_TTL] Encountered database error: ${err.message}`);
      }
      resolve();
    });
  });
}

const deleteMessageTtlQueryString = `
DELETE ttl_settings
  WHERE server_id = ?, channel_id = ?, user_id = ?;
`;

export function deleteMessageTtlQuery(
  serverId: string,
  channelId: string | null,
  userId: string | null,
): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(deleteMessageTtlQueryString, [serverId, channelId, userId], err => {
      if (err) {
        return reject(`[DELETE][MESSAGE_TTL] Encountered database error: ${err.message}`);
      }
      resolve();
    });
  });
}
