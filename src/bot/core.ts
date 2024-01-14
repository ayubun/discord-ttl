/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Collection, type GuildTextBasedChannel, Message, PermissionFlagsBits, User } from 'discord.js';
import { getMessageTtl } from '../database/api';
import { Logger } from '../logger';
import { bot } from './api';

const lastDeletedMessages: Record<string, string> = {};

export async function continuallyRetrieveAndDeleteMessages(): Promise<void> {
  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
  while (true) {
    Logger.debug('Running retrieveAndDeleteMessages()...');
    await retrieveAndDeleteMessages();
    Logger.debug('Successfully ran retrieveAndDeleteMessages(). Waiting 30 seconds');
    await sleep(1000 * 30); // Wait 30 seconds per retrieval loop
  }
}

async function retrieveAndDeleteMessages(): Promise<void> {
  for (const channel of bot.channels.cache.values()) {
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
      const deletableMessages = await collectDeletableMessages(guildId, channel.id, messages);
      const awaitedPromises = await handleDeletesForNonBulkDeletableMessages(guildId, channel.id, deletableMessages);
      if (awaitedPromises.length === 0) {
        await handleDeletesForBulkDeletableMessages(guildId, channel, deletableMessages);
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

async function isMessageOlderThanTtl(
  serverId: string,
  channelId: string,
  message: { createdAt: { getTime: () => number }; author: User },
): Promise<boolean> {
  const messageTtl = await getMessageTtl(serverId, channelId, message.author.id);
  if (!messageTtl) {
    return false;
  }
  return message.createdAt.getTime() < Date.now() - messageTtl * 1000;
}

function canMessageBeBulkDeleted(message: { createdAt: { getTime: () => number } }): boolean {
  const bulkDeletionThresholdInMillis: number = 1000 * 60 * 60 * 24 * 14; // 14 days (Discord's bulk deletion threshold)
  return message.createdAt.getTime() > Date.now() - bulkDeletionThresholdInMillis;
}

async function collectDeletableMessages(
  guildId: string,
  channelId: string,
  messages: Collection<string, Message<boolean>>,
): Promise<Collection<string, Message<boolean>>> {
  return Promise.resolve(
    messages.filter(
      async (message: { createdAt: { getTime: () => number }; author: User }) =>
        await isMessageOlderThanTtl(guildId, channelId, message),
    ),
  );
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
      .filter((message: { createdAt: { getTime: () => number } }) => !canMessageBeBulkDeleted(message))
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
  const messagesToDelete = messages.filter((message: { createdAt: { getTime: () => number } }) =>
    canMessageBeBulkDeleted(message),
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
