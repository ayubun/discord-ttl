import { Collection, GuildTextBasedChannel, Message, PermissionFlagsBits } from 'discord.js';
import { client } from './app';
import { getServerMessageTtlMillis } from './sqlite';

const lastDeletedMessages: Record<string, string> = {};

export async function continuallyRetrieveMessages(): Promise<void> {
  while (true) {
    await retrieveMessages();
  }
}

async function retrieveMessages(): Promise<void> {
  for (const channel of client.channels.cache.values()) {
    if (channel.isDMBased() || !channel.isTextBased()) {
      continue;
    }
    if (!canGetAndDeleteMessages(channel)) {
      continue;
    }
    if (!lastDeletedMessages[channel.id]) {
      lastDeletedMessages[channel.id] = channel.id;
    }
    try {
      const guildId: string = channel.guildId;
      const messages: Collection<string, Message<boolean>> = await channel.messages.fetch({
        after: lastDeletedMessages[channel.id],
        limit: 100,
      });
      const awaitedPromises = await handleDeletesForNonBulkDeletableMessages(guildId, channel.id, messages);
      if (awaitedPromises.length === 0) {
        await handleDeletesForBulkDeletableMessages(guildId, channel, messages);
      }
    } catch (err) {
      console.error(err);
    }
  }
}

function canGetAndDeleteMessages(channel: GuildTextBasedChannel): boolean {
  const me = channel.guild.members.me;
  if (!me) {
    return false;
  }
  const currentPerms = me.permissionsIn(channel);
  if (
    !currentPerms.has(PermissionFlagsBits.ViewChannel) ||
    !currentPerms.has(PermissionFlagsBits.ReadMessageHistory) ||
    !currentPerms.has(PermissionFlagsBits.ManageMessages)
  ) {
    return false;
  }
  // Text-in-voice channels require Connect permissions, too (apparently)
  if (channel.isVoiceBased() && !currentPerms.has(PermissionFlagsBits.Connect)) {
    return false;
  }
  return true;
}

function isMessageOlderThanTtl(serverId: string, message: { createdAt: { getTime: () => number } }): boolean {
  return message.createdAt.getTime() < Date.now() - getServerMessageTtlMillis(serverId);
}

function canMessageBeBulkDeleted(message: { createdAt: { getTime: () => number } }): boolean {
  const bulkDeletionThresholdInMillis: number = 1000 * 60 * 60 * 24 * 14; // 14 days (Discord's bulk deletion threshold)
  return message.createdAt.getTime() > Date.now() - bulkDeletionThresholdInMillis;
}

/**
 * Messages older than Discord's bulk message deletion age limit cannot be
 * bulk deleted, so this method collects them and deletes them one-by-one.
 */
async function handleDeletesForNonBulkDeletableMessages(
  guildId: string,
  channelId: string,
  messages: Collection<string, Message<boolean>>,
): Promise<void[]> {
  return Promise.all(
    messages
      .filter(
        (message: { createdAt: { getTime: () => number } }) =>
          isMessageOlderThanTtl(guildId, message) && !canMessageBeBulkDeleted(message),
      )
      .map(async (message: { delete: () => any; id: string }) => {
        await message.delete();
        lastDeletedMessages[channelId] = message.id;
      }),
  );
}

/**
 * Messages younger than Discord's bulk message deletion age limit can be
 * bulk deleted, so this method utilizes that feature to send batched delete requests.
 */
async function handleDeletesForBulkDeletableMessages(
  guildId: string,
  channel: GuildTextBasedChannel,
  messages: Collection<string, Message<boolean>>,
): Promise<void | Collection<string, Message<boolean>>> {
  const messagesToDelete = messages.filter(
    (message: { createdAt: { getTime: () => number } }) =>
      isMessageOlderThanTtl(guildId, message) && canMessageBeBulkDeleted(message),
  );
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
