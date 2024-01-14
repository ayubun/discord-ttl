import dotenv from 'dotenv';
import { loginToDiscordAndBeginDeleting } from './bot/api';
import { applyDatabaseMigrations } from './database/api';
import { Logger } from './logger';
dotenv.config();

Logger.startup();

await applyDatabaseMigrations()
  .then(() => loginToDiscordAndBeginDeleting())
  .catch(e => Logger.error(e));
