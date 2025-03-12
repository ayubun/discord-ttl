import { DiscordSnowflake } from '@sapphire/snowflake';
import { Partials } from 'discord.js';
import { frontfillMessages } from 'src/database/api';
import { Message } from 'src/common/messageTypes';
import { debug, error, info } from '../logger';
import { continuallyBackfillMessageIds } from './backfiller';
import { CookieClient } from './cookie';
import { continuallyDeleteReadyMessages } from './deleter';

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

// we track the bot startup time as a snowflake so that we can easily compare it to other snowflakes
let BOT_STARTUP_SNOWFLAKE: bigint = BigInt(-1);

/**
 * @param snowflake - a snowflake to compare to the bot startup time
 * @returns true if the snowflake is after the bot startup time, false otherwise
 */
export function isAfterBotStartup(snowflake: string | bigint): boolean {
  if (!isBotReady()) {
    debug('[bot] isAfterBotStartup(): Bot is not ready, returning false');
    return false;
  }
  if (typeof snowflake === 'string') {
    snowflake = BigInt(snowflake);
  }
  return snowflake >= BOT_STARTUP_SNOWFLAKE;
}

export function isBotReady(): boolean {
  return BOT_STARTUP_SNOWFLAKE !== BigInt(-1);
}

export const bot = new CookieClient({
  intents: ['Guilds', 'GuildMembers'],
  partials: [Partials.Channel, Partials.Message, Partials.GuildMember],
});

export function loginToDiscordAndStart() {
  bot.once('ready', () => {
    info('[bot] Logged in to Discord and now continually backfilling message ids');
    if (BOT_STARTUP_SNOWFLAKE === BigInt(-1)) {
      BOT_STARTUP_SNOWFLAKE = DiscordSnowflake.generate({ timestamp: Date.now() });
      info('[bot] Startup time set to now (snowflake: ' + BOT_STARTUP_SNOWFLAKE + ')');
    }
    // Initialize core loops
    continuallyBackfillMessageIds();
    continuallyDeleteReadyMessages();
  });

  bot.on('messageCreate', message => {
    if (message.guildId === null) {
      // discord ttl does not support DMs atm
      return;
    }
    debug(`[bot] Message create received for ${message.guildId}/${message.channelId}/${message.id}`);
    frontfillMessages([Message.fromDiscordJsMessage(message)]).catch((err: any) => {
      error('[bot] Encountered a fatal error in the message id frontfiller:', err);
      process.exit(1);
    });
  });

  bot.login(getToken()).catch((err: any) => {
    error('[bot] Encountered a fatal error while logging in:', err);
    process.exit(1);
  });
}
