// the backfiller handles collection of message ids from discord and storing them in the database.
// this is important so that discord ttl can query for user-specific ttls. it also saves on api calls.

import { debug, error, info } from "src/logger";
import { PermissionFlagsBits, type GuildTextBasedChannel } from "discord.js";
import { backfillMessages, getMessageIdsMetadata } from "src/database/api";
import { Message } from "src/common/messageTypes";
import { bot, isAfterBotStartup } from "./api";

let numBackfilledMessages = 0;

export function continuallyBackfillMessageIds(): void {
  setTimeout(() => {
    backfillMessageIds()
      .then(() => continuallyBackfillMessageIds())
      .catch((err: any) => {
        error('[bot/backfiller] Encountered a fatal error in the message id backfiller:', err);
        process.exit(1);
      });
  }, 5000);
}

async function backfillMessageIds(): Promise<void> {
  debug('[bot/backfiller] Running backfillMessageIds()...');
  numBackfilledMessages = 0;
  const startTime = Date.now();
  await retrieveAndBackfillMessageIds();
  const durationInSec = Math.round((Date.now() - startTime + Number.EPSILON) * 100) / 100000;
  if (numBackfilledMessages === 0) {
    debug(`[bot/backfiller] No backfillable messages were found (duration: ${durationInSec}s)`);
  } else {
    info(
      `[bot/backfiller] Successfully backfilled ${numBackfilledMessages} message${
        numBackfilledMessages !== 1 ? 's' : ''
      }`,
      `(duration: ${durationInSec}s)`,
    );
  }
}

async function retrieveAndBackfillMessageIds(): Promise<void> {
  for (const channel of bot.channels.cache.values()) {
    if (channel.isDMBased() || !channel.isTextBased()) {
      continue;
    }
    if (!canGetMessages(channel)) {
      continue;
    }
    const serverId: string = channel.guildId;
    const channelId: string = channel.id;

    try {
      const messageIdsMetadata = await getMessageIdsMetadata(serverId, channelId);
      if (isAfterBotStartup(messageIdsMetadata.lastBackfilledMessageId)) {
        continue;
      }
      const messages: Message[] = (await channel.messages.fetch({
        after: messageIdsMetadata.lastBackfilledMessageId,
        cache: false,
        limit: 100,
      })).map(Message.fromDiscordJsMessage);
      await backfillMessages(messages);
      numBackfilledMessages += messages.length;
    } catch (err) {
      error('[bot/backfiller] in retrieveAndBackfillMessageIds():', err);
    }
  }
}

function canGetMessages(channel: GuildTextBasedChannel): boolean {
  const me = channel.guild.members.me;
  if (!me) {
    return false;
  }
  const currentPerms = me.permissionsIn(channel);
  if (
    !currentPerms.has(PermissionFlagsBits.ViewChannel) ||
    !currentPerms.has(PermissionFlagsBits.ReadMessageHistory)
  ) {
    return false;
  }
  // Text-in-voice channels require Connect permissions, too (apparently)
  if (channel.isVoiceBased() && !currentPerms.has(PermissionFlagsBits.Connect)) {
    return false;
  }
  return true;
}
