import dotenv from 'dotenv';
import figlet from 'figlet';
import { loginToDiscordAndBeginDeleting } from './bot/api';
import { applyDatabaseMigrations } from './database/api';
import { Logger } from './logger';
dotenv.config();

console.log('\x1b[36m' + figlet.textSync('Discord TTL') + '\x1b[0m');
console.log('\x1b[90m        https://github.com/ayubun/discord-ttl\x1b[0m');
console.log('');
Logger.startup();
Logger.info('Starting up...');

await applyDatabaseMigrations()
  .then(() => loginToDiscordAndBeginDeleting())
  .catch(e => Logger.error(e));
