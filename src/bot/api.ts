import { Partials } from 'discord.js';
import { error, info } from '../logger';
import { continuallyRetrieveAndDeleteMessages } from './core';
import { CookieClient } from './cookie';

function getToken(): string {
  const token = process.env['DISCORD_BOT_TOKEN'];
  if (!token) {
    error('Discord token was not provided in the .env (i.e. DISCORD_BOT_TOKEN=token)');
    error('To get a token, see: https://ayu.dev/r/discord-bot-token-guide');
    error('Then, paste it into the .env file in the discord-ttl directory and restart.');
    process.exit(1);
  }
  return token;
}

export const bot = new CookieClient({
  intents: ['Guilds'],
  partials: [Partials.Channel, Partials.Message],
});

export function loginToDiscordAndBeginDeleting() {
  bot.once('ready', () => {
    info('Logged in to Discord and now continually retrieving messages for deletion!');
    continuallyRetrieveAndDeleteMessages().catch((err: any) => {
      error('Encountered a fatal error in the core loop:', err);
      process.exit(1);
    });
  });

  bot.login(getToken()).catch((err: any) => {
    error('Encountered a fatal error while logging in:', err);
    process.exit(1);
  });
}
