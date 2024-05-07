import { Partials } from 'discord.js';
import { Logger } from '../logger';
import { continuallyRetrieveAndDeleteMessages } from './core';
import { BunnyClient } from './bunny';

function getToken(): string {
  const token = process.env['DISCORD_BOT_TOKEN'];
  if (!token) {
    Logger.error('Discord token was not provided in the .env (i.e. DISCORD_BOT_TOKEN=token)');
    Logger.error('To get a token, see: https://ayu.dev/r/discord-bot-token-guide');
    Logger.error('Then, paste it into the .env file in the discord-ttl directory and restart.');
    process.exit(1);
  }
  return token;
}

export const bot = new BunnyClient({
  intents: ['Guilds'],
  partials: [Partials.Channel, Partials.Message],
});

export function loginToDiscordAndBeginDeleting() {
  bot.once('ready', () => {
    Logger.info('Logged in to Discord and now continually retrieving messages for deletion!');
    continuallyRetrieveAndDeleteMessages().catch((err: any) => {
      Logger.error('Encountered a fatal error in the core loop:', err);
      process.exit(1);
    });
  });

  bot.login(getToken()).catch((err: any) => {
    Logger.error('Encountered a fatal error while logging in:', err);
    process.exit(1);
  });
}
