import dotenv from 'dotenv';
import figlet from 'figlet';
import { loginToDiscordAndStart } from './bot/api';
import { info, printStartupMessage } from './logger';
dotenv.config();

console.log('\x1b[36m' + figlet.textSync('Discord TTL') + '\x1b[0m');
console.log('\x1b[90m        https://github.com/ayubun/discord-ttl\x1b[0m');
console.log('');

printStartupMessage();
info('Starting up...');

loginToDiscordAndStart();
