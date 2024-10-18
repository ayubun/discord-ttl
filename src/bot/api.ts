import { Partials } from 'discord.js';
import { debug, error, info } from '../logger';
import { continuallyRetrieveAndDeleteMessages as continuallyRetrieveMessages } from './core';
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
  intents: ['Guilds', 'GuildMembers'],
  partials: [Partials.Channel, Partials.Message, Partials.GuildMember],
});

export function loginToDiscordAndStart() {
  bot.once('ready', () => {
    info('[bot] Logged in to Discord and now continually retrieving messages for deletion');
    continuallyRetrieveMessages().catch((err: any) => {
      error('[bot] Encountered a fatal error in the message retrieval loop:', err);
      process.exit(1);
    });
  });

  bot.on('messageCreate', message => {
    if (message.guildId === null) {
      // discord ttl does not support DMs atm
      return;
    }
    debug(`[bot] Message create received for ${message.guildId}/${message.channelId}/${message.id}`);
  });

  bot.login(getToken()).catch((err: any) => {
    error('Encountered a fatal error while logging in:', err);
    process.exit(1);
  });
}
