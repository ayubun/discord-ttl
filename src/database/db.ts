import { drizzle } from 'drizzle-orm/bun-sqlite';
import Database from 'bun:sqlite';
import { userTtlSettings, serverTtlSettings } from './tables';

const sqlite = new Database('data/discord-ttl.db');
// docs: https://orm.drizzle.team/docs/get-started-sqlite#bun-sqlite
// https://orm.drizzle.team/learn/guides/conditional-filters-in-query
export const db = drizzle(sqlite);

db.select().from(userTtlSettings).where();
