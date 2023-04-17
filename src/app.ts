import { Client, Partials } from 'discord.js';
import dotenv from 'dotenv';
import { continuallyRetrieveMessages } from './ttl';
dotenv.config();

export const client = new Client({
  intents: ['Guilds'],
  partials: [Partials.Channel, Partials.Message],
});

client.once('ready', () => {
  console.log('Discord TTL is now running!');
  continuallyRetrieveMessages().catch(console.error);
});

client.login(process.env.DISCORD_BOT_TOKEN).catch((err: any) => {
  console.error(err);
  process.exit();
});
