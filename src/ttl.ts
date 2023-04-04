import { Collection, GuildTextBasedChannel, Message } from 'discord.js';
import { client } from './app';
import { getServerMessageTtlMillis } from './sqlite';

const lastDeletedMessages: Record<string, string> = {};
const nonpermissibleChannels: Record<string, number> = {};

export async function continuallyRetrieveMessages(): Promise<void> {
  while (true) {
    await retrieveMessages();
  }
}

async function handleDeletesForMessagesOlderThan14Days(
  serverId: string,
  channelId: string,
  messages: Collection<string, Message<boolean>>,
): Promise<void[]> {
  return Promise.all(
    messages
      .filter((message: { createdAt: { getTime: () => number } }) => {
        // Older than 14 days
        return (
          Date.now() - message.createdAt.getTime() >= 14 * 24 * 60 * 60 * 1000 &&
          message.createdAt.getTime() < Date.now() - getServerMessageTtlMillis(serverId)
        );
      })
      .map(async (message: { delete: () => any; id: string }) => {
        await message.delete();
        lastDeletedMessages[channelId] = message.id;
      }),
  );
}

async function handleDeletesForMessagesYoungerThan14Days(
  serverId: string,
  channel: GuildTextBasedChannel,
  messages: Collection<string, Message<boolean>>,
): Promise<void | Collection<string, Message<boolean>>> {
  const messagesToDelete = messages.filter((message: { createdAt: { getTime: () => number } }) => {
    return (
      message.createdAt.getTime() < Date.now() - getServerMessageTtlMillis(serverId) &&
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
    if (Date.now() - nonpermissibleChannels[channel.id] <= 1000 * 60 * 60 * 24 /* 24 hours in ms */) {
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
      const awaitedPromises = await handleDeletesForMessagesOlderThan14Days(channel.guildId, channel.id, messages);
      if (awaitedPromises.length === 0) {
        await handleDeletesForMessagesYoungerThan14Days(channel.guildId, channel, messages);
      }
    } catch (err) {
      console.error(err);
    }
  }
}
