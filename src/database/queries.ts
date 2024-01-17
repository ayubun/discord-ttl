import { drizzle } from 'drizzle-orm/bun-sqlite';
// eslint-disable-next-line import/no-unresolved
import Database from 'bun:sqlite';
import { Logger } from '../logger';
const db_path = 'data/discord-ttl.db';
const sqlite = new Database(db_path);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const db = drizzle(sqlite);

a().catch(err => Logger.error(err));

async function a() {
  //const result = await db.select().from('ttl_settings').execute();
}

// // todo: have the database store when guild leaves occur, so that guild
// // data can be cleaned up (without risk of unintentional deletion during
// // outages).
// const db_path = 'data/discord-ttl.db';
// if (!fs.existsSync('data')) {
//   fs.mkdirSync('data');
// }
// if (!fs.existsSync(db_path)) {
//   fs.closeSync(fs.openSync(db_path, 'wx'));
// }
// export const db = new Database('data/discord-ttl.db');
// db.on('error', err => {
//   console.error('Encountered database error:', err);
// });

export function executeQuery(sql: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // db.exec(sql, err => {
    //   if (err) {
    //     return reject(`[EXECUTE] Encountered database error: ${err.message}`);
    //   }
    //   resolve();
    // });
    // TODO
    resolve();
  });
}

// const selectMessageTtlQueryString = `
// SELECT message_ttl
//   FROM ttl_settings
//   WHERE server_id = ? AND channel_id = ? AND user_id = ?;
// `;

export function selectMessageTtlQuery(
  serverId: string,
  channelId: string | null,
  userId: string | null,
): Promise<number | undefined> {
  return new Promise((resolve, reject) => {
    // db.get(
    //   selectMessageTtlQueryString,
    //   [serverId, channelId, userId],
    //   (err, row: { message_ttl: number | undefined }) => {
    //     if (err) {
    //       return reject(`[SELECT][MESSAGE_TTL] Encountered database error: ${err.message}`);
    //     }
    //     // No row found. Return undefined
    //     if (row === undefined) {
    //       return resolve(undefined);
    //     }
    //     resolve(row.message_ttl);
    //   },
    // );
  });
}

// const updateMessageTtlQueryString = `
// UPDATE ttl_settings
//   SET message_ttl = ?
//   WHERE server_id = ? AND channel_id = ? AND user_id = ?;
// `;

export function updateMessageTtlQuery(
  serverId: string,
  channelId: string | null,
  userId: string | null,
  message_ttl: number,
): Promise<void> {
  return new Promise((resolve, reject) => {
    // db.run(updateMessageTtlQueryString, [message_ttl, serverId, channelId, userId], err => {
    //   if (err) {
    //     return reject(`[UPDATE][MESSAGE_TTL] Encountered database error: ${err.message}`);
    //   }
    //   resolve();
    // });
  });
}

// const deleteMessageTtlQueryString = `
// DELETE ttl_settings
//   WHERE server_id = ? AND channel_id = ? AND user_id = ?;
// `;

export function deleteMessageTtlQuery(
  serverId: string,
  channelId: string | null,
  userId: string | null,
): Promise<void> {
  return new Promise((resolve, reject) => {
    // db.run(deleteMessageTtlQueryString, [serverId, channelId, userId], err => {
    //   if (err) {
    //     return reject(`[DELETE][MESSAGE_TTL] Encountered database error: ${err.message}`);
    //   }
    //   resolve();
    // });
  });
}
