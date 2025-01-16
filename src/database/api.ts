import dotenv from 'dotenv';
import type { Message, MessageIdsMetadataData } from 'src/common/messageTypes';
import { ServerChannelSettings, ServerSettings, UserServerChannelSettings, UserServerSettings, UserSettings } from '../common/settingsTypes';
import { Lock } from '../common/lock';
import {
  deleteAllServerSettings,
  deleteAllUserServerSettings,
  insertMessages,
  selectAllUserServerChannelSettings,
  selectAllUserServerSettings,
  selectAllUserSettings,
  selectMessageIdsMetadata,
  selectOldestMessages,
  selectServerChannelSettings,
  selectServerSettings,
  upsertMessageIdsMetadatas,
  upsertServerSettings,
  upsertUserSettings,
} from './db';
import {
  clearServerSettingsCache,
  getAllCachedUserServerChannelSettings,
  getAllCachedUserServerSettings,
  getAllCachedUserSettings,
  getCachedMessageIdsMetadata,
  getCachedServerChannelSettings,
  getCachedServerSettings,
  getCachedUserServerChannelSettings,
  getCachedUserServerSettings,
  getCachedUserSettings,
  setCachedMessageIdsMetadata,
  setCachedServerChannelSettings,
  setCachedServerSettings,
  setCachedUserServerChannelSettings,
  setCachedUserServerSettings,
  setCachedUserSettings,
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
    await upsertServerSettings(newServerChannelSettings);
    setCachedServerChannelSettings(newServerChannelSettings);
  });
}

export async function resetAllServerSettings(serverId: string): Promise<void> {
  await SERVER_SETTINGS_DB_LOCK.acquireWhile(async () => {
    await deleteAllServerSettings(serverId);
    // await deleteAllUserServerSettingsByServerId(serverId);
    clearServerSettingsCache(serverId);
  });
}

// .｡.:☆ user settings apis ☆:.｡.

const USER_SETTINGS_DB_LOCK = new Lock();

export async function getAllUserSettings(): Promise<UserSettings[]> {
  return await USER_SETTINGS_DB_LOCK.acquireWhile(async () => {
    const cached = getAllCachedUserSettings();
    if (cached) {
      return cached;
    }
    let result = await selectAllUserSettings();
    if (result === undefined) {
      result = []
    }
    return result;
  });
}

export async function getAllUserServerSettings(serverId: string): Promise<UserServerSettings[]> {
  return await USER_SETTINGS_DB_LOCK.acquireWhile(async () => {
    const cached = getAllCachedUserServerSettings(serverId);
    if (cached) {
      return cached;
    }
    let result = await selectAllUserServerSettings(serverId);
    if (result === undefined) {
      result = []
    }
    return result;
  });
}

export async function getAllUserServerChannelSettings(serverId: string, channelId: string): Promise<UserServerChannelSettings[]> {
  return await USER_SETTINGS_DB_LOCK.acquireWhile(async () => {
    const cached = getAllCachedUserServerChannelSettings(serverId, channelId);
    if (cached) {
      return cached;
    }
    let result = await selectAllUserServerChannelSettings(serverId, channelId);
    if (result === undefined) {
      result = []
    }
    return result;
  });
}

/**
 * Note: this function will only get cached values, because it expects that the user
 * settings are already cached via the `getAllUserSettings` function.
 */
export async function getUserSettings(userId: string): Promise<UserSettings> {
  return await USER_SETTINGS_DB_LOCK.acquireWhile(async () => {
    const cached = getCachedUserSettings(userId);
    if (cached) {
      return cached;
    }
    return new UserSettings(userId);
  });
}

/**
 * Note: this function will only get cached values, because it expects that the user
 * settings are already cached via the `getAllUserServerSettings` function.
 */
export async function getUserServerSettings(userId: string, serverId: string): Promise<UserServerSettings> {
  return await USER_SETTINGS_DB_LOCK.acquireWhile(async () => {
    const cached = getCachedUserServerSettings(userId, serverId);
    if (cached) {
      return cached;
    }
    return new UserServerSettings(userId, serverId);
  });
}

/**
 * Note: this function will only get cached values, because it expects that the user
 * settings are already cached via the `getAllUserServerChannelSettings` function.
 */
export async function getUserServerChannelSettings(userId: string, serverId: string, channelId: string): Promise<UserServerChannelSettings> {
  return await USER_SETTINGS_DB_LOCK.acquireWhile(async () => {
    const cached = getCachedUserServerChannelSettings(userId, serverId, channelId);
    if (cached) {
      return cached;
    }
    return new UserServerChannelSettings(userId, serverId, channelId);
  });
}

export async function setUserSettings(newUserSettings: UserSettings): Promise<void> {
  await USER_SETTINGS_DB_LOCK.acquireWhile(async () => {
    await upsertUserSettings(newUserSettings);
    setCachedUserSettings(newUserSettings);
  });
}

export async function setUserServerSettings(newUserServerSettings: UserServerSettings): Promise<void> {
  await USER_SETTINGS_DB_LOCK.acquireWhile(async () => {
    await upsertUserSettings(newUserServerSettings);
    setCachedUserServerSettings(newUserServerSettings);
  });
}

export async function setUserServerChannelSettings(newUserServerChannelSettings: UserServerChannelSettings): Promise<void> {
  await USER_SETTINGS_DB_LOCK.acquireWhile(async () => {
    await upsertUserSettings(newUserServerChannelSettings);
    setCachedUserServerChannelSettings(newUserServerChannelSettings);
  });
}

// .｡.:☆ message id apis ☆:.｡.

const MESSAGE_IDS_DB_LOCK = new Lock();
const MESSAGE_IDS_METADATA_DB_LOCK = new Lock();

export async function getMessageIdsMetadata(serverId: string, channelId: string): Promise<MessageIdsMetadataData> {
  return await MESSAGE_IDS_METADATA_DB_LOCK.acquireWhile(async () => {
    let messageIdsMetadata = getCachedMessageIdsMetadata(serverId, channelId);
    if (!messageIdsMetadata) {
      // try to load from DB if not in cache
      messageIdsMetadata = await selectMessageIdsMetadata(serverId, channelId);
    }
    if (!messageIdsMetadata) {
      // if not found in db or cache, create a new one
      messageIdsMetadata = {
        serverId,
        channelId,
        lastBackfilledMessageId: serverId,
      };
    }
    setCachedMessageIdsMetadata(messageIdsMetadata);
    return messageIdsMetadata;
  });
}

export async function getOldestMessages(
  serverId: string,
  channelId: string,
  userId: string | undefined = undefined,
  amount: number = 100,
): Promise<Message[]> {
  return await MESSAGE_IDS_DB_LOCK.acquireWhile(async () => {
    return await selectOldestMessages(serverId, channelId, userId, amount);
  });
}

export async function backfillMessages(messages: Message[]): Promise<void> {
  await MESSAGE_IDS_DB_LOCK.acquireWhile(async () => {
    // recompute new message ids metadatas
    const updatedMetadatas: MessageIdsMetadataData[] = [];
    for (const message of messages) {
      const messageIdsMetadata = await getMessageIdsMetadata(message.getServerId(), message.getChannelId());
      if (messageIdsMetadata.lastBackfilledMessageId < message.getMessageId()) {
        messageIdsMetadata.lastBackfilledMessageId = message.getMessageId();
        updatedMetadatas.push(messageIdsMetadata);
        setCachedMessageIdsMetadata(messageIdsMetadata);
      }
    }
    // insert the messages
    await insertMessages(messages);
    // update the metadatas
    await upsertMessageIdsMetadatas(updatedMetadatas);
  });
}

export async function frontfillMessages(messages: Message[]): Promise<void> {
  await MESSAGE_IDS_DB_LOCK.acquireWhile(async () => {
    await insertMessages(messages);
  });
}
