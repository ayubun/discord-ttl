import { Events, Partials } from 'discord.js';
import { continuallyRetrieveMessages } from './core';
import { CommandClient } from './commandClient';

function getToken(): string {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) {
    console.error('Discord token was not provided in the .env (i.e. DISCORD_BOT_TOKEN=token)');
    console.error('To get a token, see: https://ayu.dev/r/discord-bot-token-guide');
    console.error('Then, paste it into the .env file in the discord-ttl directory and restart.');
    process.exit(1);
  }
  return token;
}

export const client = new CommandClient({
  intents: ['Guilds'],
  partials: [Partials.Channel, Partials.Message],
});

export function loginToDiscordAndBeginDeleting() {
  client.once('ready', () => {
    console.log('TTL has logged in to Discord');

    client.deployCommands().catch((err: any) => {
      console.error('TTL encountered a fatal error while deploying commands:', err);
      process.exit(1);
    });

    continuallyRetrieveMessages().catch((err: any) => {
      console.error('TTL encountered a fatal error in the core loop:', err);
      process.exit(1);
    });
  });

  client.on(Events.InteractionCreate, async interaction => client.handleInteraction(interaction));

  client.login(getToken()).catch((err: any) => {
    console.error('TTL encountered a fatal error while logging in:', err);
    process.exit(1);
  });
}
