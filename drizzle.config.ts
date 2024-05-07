import 'dotenv/config';
import type { Config } from 'drizzle-kit';
export default {
  schema: './src/database/tables.ts',
  out: './drizzle',
  driver: 'better-sqlite', // 'pg' | 'mysql2' | 'better-sqlite' | 'libsql' | 'turso'
  dbCredentials: {
    url: './data/discord-ttl.db',
  },
} satisfies Config;
