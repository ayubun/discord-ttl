import dotenv from 'dotenv';
import { ServerChannelSettings, ServerSettings } from '../common/settingsTypes';
import { Lock } from '../common/lock';
import {
  deleteAllServerSettings,
  selectServerChannelSettings,
  selectServerSettings,
  upsertServerChannelSettings,
  upsertServerSettings,
} from './db';
import {
  clearCache,
  getCachedServerChannelSettings,
  getCachedServerSettings,
  setCachedServerChannelSettings,
  setCachedServerSettings,
} from './cache';
dotenv.config();

const SERVER_SETTINGS_DB_LOCK = new Lock();

export async function getServerSettings(serverId: string): Promise<ServerSettings> {
  await SERVER_SETTINGS_DB_LOCK.acquire();
  try {
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
  } finally {
    await SERVER_SETTINGS_DB_LOCK.release();
  }
}

export async function getServerChannelSettings(serverId: string, channelId: string): Promise<ServerChannelSettings> {
  await SERVER_SETTINGS_DB_LOCK.acquire();
  try {
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
  } finally {
    await SERVER_SETTINGS_DB_LOCK.release();
  }
}

export async function setServerSettings(newServerSettings: ServerSettings): Promise<void> {
  await SERVER_SETTINGS_DB_LOCK.acquire();
  try {
    await upsertServerSettings(newServerSettings);
    setCachedServerSettings(newServerSettings);
  } finally {
    await SERVER_SETTINGS_DB_LOCK.release();
  }
}

export async function setServerChannelSettings(newServerChannelSettings: ServerChannelSettings): Promise<void> {
  await SERVER_SETTINGS_DB_LOCK.acquire();
  try {
    await upsertServerChannelSettings(newServerChannelSettings);
    setCachedServerChannelSettings(newServerChannelSettings);
  } finally {
    await SERVER_SETTINGS_DB_LOCK.release();
  }
}

export async function resetAllServerSettings(serverId: string): Promise<void> {
  await SERVER_SETTINGS_DB_LOCK.acquire();
  try {
    await deleteAllServerSettings(serverId);
    clearCache(serverId);
  } finally {
    await SERVER_SETTINGS_DB_LOCK.release();
  }
}
