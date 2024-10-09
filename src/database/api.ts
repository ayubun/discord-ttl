import assert from 'node:assert';
import dotenv from 'dotenv';
import type { Message, MessageIdsMetadataData } from 'src/common/messageTypes';
import { ServerChannelSettings, ServerSettings } from '../common/settingsTypes';
import { Lock } from '../common/lock';
import {
  deleteAllServerSettings,
  insertMessages,
  selectMessageIdsMetadata,
  selectServerChannelSettings,
  selectServerSettings,
  upsertMessageIdsMetadatas,
  upsertServerChannelSettings,
  upsertServerSettings,
} from './db';
import {
  clearServerSettingsCache,
  getCachedMessageIdsMetadata,
  getCachedServerChannelSettings,
  getCachedServerSettings,
  setCachedMessageIdsMetadata,
  setCachedServerChannelSettings,
  setCachedServerSettings,
} from './cache';
dotenv.config();

// .｡.:☆ server settings apis ☆:.｡.

const SERVER_SETTINGS_DB_LOCK = new Lock();

export async function getServerSettings(serverId: string): Promise<ServerSettings> {
  return await SERVER_SETTINGS_DB_LOCK.acquireWhile(async () => {
    const cached = getCachedServerSettings(serverId);
    if (cached) {
      return cached;
    }
    let result = await selectServerSettings(serverId);
    if (result === undefined) {
      result = new ServerSettings(serverId);
      // no need to store default settings ╮ (. ❛ ᴗ ❛.) ╭
      // await upsertServerSettings(result);
    }
    setCachedServerSettings(result);
    return result;
  });
}

export async function getServerChannelSettings(serverId: string, channelId: string): Promise<ServerChannelSettings> {
  return await SERVER_SETTINGS_DB_LOCK.acquireWhile(async () => {
    const cached = getCachedServerChannelSettings(serverId, channelId);
    if (cached) {
      return cached;
    }
    let result = await selectServerChannelSettings(serverId, channelId);
    if (result === undefined) {
      result = new ServerChannelSettings(serverId, channelId);
      // no need to store default settings ╮ (. ❛ ᴗ ❛.) ╭
      // await upsertServerChannelSettings(result);
    }
    setCachedServerChannelSettings(result);
    return result;
  });
}

export async function setServerSettings(newServerSettings: ServerSettings): Promise<void> {
  await SERVER_SETTINGS_DB_LOCK.acquireWhile(async () => {
    await upsertServerSettings(newServerSettings);
    setCachedServerSettings(newServerSettings);
  });
}

export async function setServerChannelSettings(newServerChannelSettings: ServerChannelSettings): Promise<void> {
  await SERVER_SETTINGS_DB_LOCK.acquireWhile(async () => {
    await upsertServerChannelSettings(newServerChannelSettings);
    setCachedServerChannelSettings(newServerChannelSettings);
  });
}

export async function resetAllServerSettings(serverId: string): Promise<void> {
  await SERVER_SETTINGS_DB_LOCK.acquireWhile(async () => {
    await deleteAllServerSettings(serverId);
    clearServerSettingsCache(serverId);
  });
}

// .｡.:☆ message id apis ☆:.｡.

const MESSAGE_IDS_DB_LOCK = new Lock();

export async function backfillMessages(messages: Message[]): Promise<void> {
  await MESSAGE_IDS_DB_LOCK.acquireWhile(async () => {
    // Recompute new message ids metadatas
    const updatedServerChannels = new Set<{ serverId: string; channelId: string }>();
    for (const message of messages) {
      let messageIdsMetadata = getCachedMessageIdsMetadata(message.getServerId(), message.getChannelId());
      if (!messageIdsMetadata) {
        // Try to load from DB if not in cache
        messageIdsMetadata = await selectMessageIdsMetadata(message.getServerId(), message.getChannelId());
      }
      if (!messageIdsMetadata) {
        messageIdsMetadata = {
          serverId: message.getServerId(),
          channelId: message.getChannelId(),
          lastBackfilledMessageId: message.getMessageId(),
        };
        updatedServerChannels.add({ serverId: message.getServerId(), channelId: message.getChannelId() });
      } else if (messageIdsMetadata.lastBackfilledMessageId < message.getMessageId()) {
        messageIdsMetadata.lastBackfilledMessageId = message.getMessageId();
        updatedServerChannels.add({ serverId: message.getServerId(), channelId: message.getChannelId() });
      }
      setCachedMessageIdsMetadata(messageIdsMetadata);
    }
    // Insert the messages
    await insertMessages(messages);
    // Update the metadatas
    const updatedMetadatas: MessageIdsMetadataData[] = [];
    for (const { serverId, channelId } of updatedServerChannels) {
      const messageIdsMetadata = getCachedMessageIdsMetadata(serverId, channelId);
      assert(messageIdsMetadata !== undefined);
      updatedMetadatas.push(messageIdsMetadata);
    }
    await upsertMessageIdsMetadatas(updatedMetadatas);
  });
}

export async function frontfillMessages(messages: Message[]): Promise<void> {
  await MESSAGE_IDS_DB_LOCK.acquireWhile(async () => {
    await insertMessages(messages);
  });
}
