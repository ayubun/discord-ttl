import 'dotenv/config';
import type { Config } from 'drizzle-kit';
export default {
  schema: './src/database/tables.ts',
  out: './drizzle',
  dialect: 'sqlite',
  // driver: 'expo',
  dbCredentials: {
    url: './data/discord-ttl.db',
  },
} satisfies Config;
