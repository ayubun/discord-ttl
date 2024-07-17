import dotenv from 'dotenv';
import { ServerChannelSettings, ServerSettings } from '../common/types';
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

export async function getServerSettings(serverId: string): Promise<ServerSettings> {
  const cached = getCachedServerSettings(serverId);
  if (cached) {
    return cached;
  }
  const result = await selectServerSettings(serverId);
  if (result === undefined) {
    const settings = new ServerSettings(serverId);
    await upsertServerSettings(settings);
    setCachedServerSettings(settings);
    return settings;
  }
  setCachedServerSettings(result);
  return result;
}

export async function getServerChannelSettings(serverId: string, channelId: string): Promise<ServerChannelSettings> {
  const cached = getCachedServerChannelSettings(serverId, channelId);
  if (cached) {
    return cached;
  }
  const result = await selectServerChannelSettings(serverId, channelId);
  if (result === undefined) {
    const settings = new ServerChannelSettings(serverId, channelId);
    await upsertServerChannelSettings(settings);
    setCachedServerChannelSettings(settings);
    return settings;
  }
  setCachedServerChannelSettings(result);
  return result;
}

export async function setServerSettings(newServerSettings: ServerSettings): Promise<void> {
  await upsertServerSettings(newServerSettings);
  setCachedServerSettings(newServerSettings);
}

export async function setServerChannelSettings(newServerChannelSettings: ServerChannelSettings): Promise<void> {
  await upsertServerChannelSettings(newServerChannelSettings);
  setCachedServerChannelSettings(newServerChannelSettings);
}

export async function resetAllServerSettings(serverId: string): Promise<void> {
  await deleteAllServerSettings(serverId);
  clearCache(serverId);
}
