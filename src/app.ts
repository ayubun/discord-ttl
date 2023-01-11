import { Client, Collection, GuildTextBasedChannel, Intents, Message } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({
  intents: [Intents.FLAGS.GUILDS],
  partials: ['CHANNEL', 'MESSAGE'],
});

client.once('ready', () => {
  console.log('Ready!');
  continuallyRetrieveMessages().catch(console.error);
});

const lastDeletedMessages: Record<string, string> = {};
const nonpermissibleChannels: Record<string, number> = {};
const deleteAfterMillis = Number(process.env.MESSAGE_TTL) * 1000;

async function handleDeletesForMessagesOlderThan14Days(
  channelId: string,
  messages: Collection<string, Message<boolean>>,
): Promise<void[]> {
  return Promise.all(
    messages
      .filter((message: { createdAt: { getTime: () => number } }) => {
        // Older than 14 days
        return (
          Date.now() - message.createdAt.getTime() >= 14 * 24 * 60 * 60 * 1000 &&
          message.createdAt.getTime() < Date.now() - deleteAfterMillis
        );
      })
      .map(async (message: { delete: () => any; id: string }) => {
        await message.delete();
        lastDeletedMessages[channelId] = message.id;
      }),
  );
}

async function handleDeletesForMessagesYoungerThan14Days(
  channel: GuildTextBasedChannel,
  messages: Collection<string, Message<boolean>>,
): Promise<void | Collection<string, Message<boolean>>> {
  const messagesToDelete = messages.filter((message: { createdAt: { getTime: () => number } }) => {
    return (
      message.createdAt.getTime() < Date.now() - deleteAfterMillis &&
      Date.now() - message.createdAt.getTime() < 14 * 24 * 60 * 60 * 1000
    );
  });
  if (messagesToDelete.size === 0) {
    return;
  }
  // https://discord.js.org/#/docs/main/stable/class/BaseGuildTextChannel?scrollTo=bulkDelete
  return channel.bulkDelete(messagesToDelete).then(deletedMessages => {
    let newestMessageId = '0';
    deletedMessages.forEach((_message: any, snowflake: string) => {
      if (BigInt(newestMessageId) < BigInt(snowflake)) {
        newestMessageId = snowflake;
      }
    });
    if (!lastDeletedMessages[channel.id] || BigInt(lastDeletedMessages[channel.id]) < BigInt(newestMessageId)) {
      lastDeletedMessages[channel.id] = newestMessageId;
    }
  });
}

function hasManageMessages(channel: GuildTextBasedChannel): boolean {
  const me = channel.guild.me;
  if (!me) {
    return false;
  }
  const perms = me.permissionsIn(channel);
  return perms.has('MANAGE_MESSAGES');
}

function canManageMessages(channel: GuildTextBasedChannel): boolean {
  /**
   * Helper function for checking manage message permissions non-excessively (every 10 minutes)
   */
  if (!nonpermissibleChannels[channel.id] && !hasManageMessages(channel)) {
    nonpermissibleChannels[channel.id] = Date.now();
    return false;
  }
  if (nonpermissibleChannels[channel.id]) {
    if (Date.now() - nonpermissibleChannels[channel.id] <= 1000 * 60 * 10 /* 10 min in ms */) {
      return false;
    }
    if (!hasManageMessages(channel)) {
      nonpermissibleChannels[channel.id] = Date.now();
      return false;
    }
    delete nonpermissibleChannels[channel.id];
  }
  return true;
}

async function continuallyRetrieveMessages(): Promise<void> {
  while (true) {
    await retrieveMessages();
  }
}

async function retrieveMessages(): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  for (const item of client.channels.cache) {
    const channel = item[1];
    if (!channel.isText() || channel.type === 'DM') {
      continue;
    }
    if (!canManageMessages(channel)) {
      continue;
    }
    if (!lastDeletedMessages[channel.id]) {
      lastDeletedMessages[channel.id] = channel.id;
    }
    try {
      const messages = await channel.messages.fetch({ after: lastDeletedMessages[channel.id], limit: 100 });
      const awaitedPromises = await handleDeletesForMessagesOlderThan14Days(channel.id, messages);
      if (awaitedPromises.length === 0) {
        await handleDeletesForMessagesYoungerThan14Days(channel, messages);
      }
    } catch (err) {
      console.error(err);
    }
  }
}

client.login(process.env.DISCORD_BOT_TOKEN).catch((err: any) => {
  console.error(err);
  process.exit();
});
