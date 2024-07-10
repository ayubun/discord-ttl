import dotenv from 'dotenv';
import { ServerChannelSettings, ServerSettings } from '../common/types';
import {
  selectServerChannelSettings,
  selectServerSettings,
  upsertServerChannelSettings,
  upsertServerSettings,
} from './db';
dotenv.config();

export async function getServerSettings(serverId: string): Promise<ServerSettings> {
  const result = await selectServerSettings(serverId);
  if (result === undefined) {
    const settings = new ServerSettings(serverId);
    await upsertServerSettings(settings);
    return settings;
  }
  return result;
}

export async function getServerChannelSettings(serverId: string, channelId: string): Promise<ServerChannelSettings> {
  const result = await selectServerChannelSettings(serverId, channelId);
  if (result === undefined) {
    const settings = new ServerChannelSettings(serverId, channelId);
    await upsertServerChannelSettings(settings);
    return settings;
  }
  return result;
}

export async function setServerSettings(newServerSettings: ServerSettings): Promise<void> {
  await upsertServerSettings(newServerSettings);
}

export async function setServerChannelSettings(newServerChannelSettings: ServerChannelSettings): Promise<void> {
  await upsertServerChannelSettings(newServerChannelSettings);
}
