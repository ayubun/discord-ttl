import { Client, Intents } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({
  intents: [Intents.FLAGS.GUILDS],
  partials: ['CHANNEL', 'MESSAGE'],
});

client.once('ready', () => {
  console.log('Ready!');
  retrieveMessages();
});

const lastDeletedMessages: Record<string, string> = {};
const deleteAfterMillis = Number(process.env.MESSAGE_TTL) * 1000;

function retrieveMessages(): void {
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  client.channels.cache.forEach(async channel => {
    if (channel.isText()) {
      if (!lastDeletedMessages[channel.id]) {
        lastDeletedMessages[channel.id] = channel.id;
      }
      try {
        const messages = await channel.messages.fetch({ after: lastDeletedMessages[channel.id], limit: 100 });
        await Promise.all(
          messages.map(async message => {
            if (message.createdAt.getTime() > Date.now() - deleteAfterMillis) {
              await message.delete();
              lastDeletedMessages[channel.id] = message.id;
            }
          }),
        );
      } catch (err) {
        console.error(err);
      }
    }
  });
  setTimeout(retrieveMessages, 30000);
}

client.login(process.env.DISCORD_BOT_TOKEN).catch(err => {
  console.error(err);
  process.exit();
});
