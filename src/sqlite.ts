// import { Database } from 'sqlite3';
import dotenv from 'dotenv';
dotenv.config();

// const db = new Database('data/discord-ttl.db');

// Setup server_message_ttls table
// db.exec(
//   "CREATE TABLE IF NOT EXISTS server_message_ttls (" +
//   "  server_id INTEGER PRIMARY KEY," +
//   "  message_ttl INTEGER NOT NULL" +
//   ");"
// );

/**
 * Checks the database for any server-configured message TTL.
 * This function defaults to DEFAULT_MESSAGE_TTL in the .env
 * if no database entry is present.
 *
 * @param server_id The server id to get the message TTL for
 */
export function getServerMessageTtlMillis(serverId: string): number {
  // TODO: Actually use the database, duh!
  return Number(process.env.DEFAULT_MESSAGE_TTL) * 1000;
}
