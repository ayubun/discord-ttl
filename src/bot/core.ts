/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Collection, type GuildTextBasedChannel, Message, PermissionFlagsBits, User } from 'discord.js';
import { getServerChannelSettings, getServerSettings } from '../database/api';
import { debug, info } from '../logger';
import { bot } from './api';

const lastDeletedMessages: Record<string, string> = {};
let numSingularDeletedMessages: number = 0;
let numBulkDeletedMessages: number = 0;
let numTotalDeletedMessages: number = 0;

export async function continuallyRetrieveAndDeleteMessages(): Promise<void> {
  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
  while (true) {
    debug('[bot/core] Running retrieveAndDeleteMessages()...');
    numSingularDeletedMessages = 0;
    numBulkDeletedMessages = 0;
    numTotalDeletedMessages = 0;
    const startTime = Date.now();
    await retrieveAndDeleteMessages();
    const durationInSec = Math.round((Date.now() - startTime + Number.EPSILON) * 100) / 100000;
    if (numTotalDeletedMessages === 0) {
      debug(`[bot/core] No deletable messages were found (duration: ${durationInSec}s)`);
    } else {
      info(
        `[bot/core] Successfully deleted ${numTotalDeletedMessages} message${numTotalDeletedMessages !== 1 ? 's' : ''}`,
        `(bulk: ${numBulkDeletedMessages}, singular: ${numSingularDeletedMessages}) (duration: ${durationInSec}s)`,
      );
    }
    if (durationInSec < 30) {
      await sleep(1000 * durationInSec); // Wait at least 30 seconds per retrieval loop
    }
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
        cache: false,
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
  message: { createdAt: { getTime: () => number }; author: User; pinned: boolean },
): Promise<boolean> {
  const channelSettings = await getServerChannelSettings(serverId, channelId);
  const serverSettings = await getServerSettings(serverId);
  const effectiveSettings = channelSettings.applyServerSettings(serverSettings);
  const ttl = effectiveSettings.getDefaultMessageTtl();
  if (ttl === undefined) {
    return false;
  }
  if (message.pinned && !effectiveSettings.getIncludePinsByDefault()) {
    return false;
  }
  return message.createdAt.getTime() < Date.now() - ttl * 1000;
}

function canMessageBeBulkDeleted(message: { createdAt: { getTime: () => number } }): boolean {
  const bulkDeletionThresholdInMillis: number = 1000 * 60 * 60 * 24 * 14; // 14 days (Discord's bulk deletion threshold)
  return message.createdAt.getTime() > Date.now() - bulkDeletionThresholdInMillis;
}

async function collectDeletableMessages(
  guildId: string,
  channelId: string,
  messages: Collection<string, Message<boolean>>,
): Promise<Message<boolean>[]> {
  // this sinful mess is why you don't use js/ts ( •̀ - •́ )
  return (
    await Promise.all(
      messages
        .sort((a: { id: string }, b: { id: string }) => {
          return a.id.localeCompare(b.id);
        })
        .map(async message => ({
          value: message,
          include: await isMessageOlderThanTtl(guildId, channelId, message),
        })),
    )
  )
    .filter(v => v.include)
    .map(data => data.value);
  // source: https://stackoverflow.com/questions/71600782/async-inside-filter-function-in-javascript
}

/**
 * Messages older than Discord's bulk message deletion age limit cannot be
 * bulk deleted, so this method collects them and deletes them one-by-one.
 */
async function handleDeletesForNonBulkDeletableMessages(
  guildId: string,
  channelId: string,
  messages: Message<boolean>[],
): Promise<void[]> {
  return Promise.all(
    messages
      .filter((message: { createdAt: { getTime: () => number } }) => !canMessageBeBulkDeleted(message))
      .map(async (message: { delete: () => any; id: string }) => {
        await message.delete();
        debug(`[bot/core] Deleted message ${guildId}/${channelId}/${message.id}`);
        numTotalDeletedMessages++;
        numSingularDeletedMessages++;
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
  messages: Message<boolean>[],
): Promise<void | Collection<string, Message<boolean>>> {
  const messagesToDelete = messages.filter((message: { createdAt: { getTime: () => number } }) =>
    canMessageBeBulkDeleted(message),
  );
  if (messagesToDelete.length === 0) {
    return;
  }
  // https://discord.js.org/#/docs/main/stable/class/BaseGuildTextChannel?scrollTo=bulkDelete
  return channel.bulkDelete(messagesToDelete).then(deletedMessages => {
    let newestMessageId = '0';
    numTotalDeletedMessages += deletedMessages.size;
    numBulkDeletedMessages += deletedMessages.size;
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
