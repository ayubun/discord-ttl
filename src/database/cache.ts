import type { MessageIdsMetadataData } from 'src/common/messageTypes';
import {
  ServerChannelSettings,
  ServerSettings,
  UserServerChannelSettings,
  UserServerSettings,
  UserSettings,
} from '../common/settingsTypes';
import { debug } from '../logger';

// serverId -> ServerSettings
const serverSettingsCache = new Map<string, ServerSettings>();
// serverId/channelId -> ServerChannelSettings
const serverChannelSettingsCache = new Map<string, ServerChannelSettings>();
// userId -> UserSettings
const userSettingsCache = new Map<string, UserSettings>();
// userId/serverId -> UserServerSettings
const userServerSettingsCache = new Map<string, UserServerSettings>();
// userId/serverId/channelId -> UserServerChannelSettings
const userServerChannelSettingsCache = new Map<string, UserServerChannelSettings>();

export function getAllCachedUserSettings(): UserSettings[] {
  return Array.from(userSettingsCache.values());
}

export function getAllCachedUserServerSettings(serverId: string): UserServerSettings[] {
  return Array.from(
    userServerSettingsCache
      .entries()
      .filter(([k, _]) => k.endsWith(`/${serverId}`))
      .map(([_, v]) => v),
  );
}

export function getAllCachedUserServerChannelSettings(serverId: string, channelId: string): UserServerSettings[] {
  return Array.from(
    userServerChannelSettingsCache
      .entries()
      .filter(([k, _]) => k.endsWith(`/${serverId}/${channelId}`))
      .map(([_, v]) => v),
  );
}

export function getCachedServerSettings(serverId: string): ServerSettings | undefined {
  return serverSettingsCache.get(serverId);
}

export function getCachedServerChannelSettings(serverId: string, channelId: string): ServerChannelSettings | undefined {
  return serverChannelSettingsCache.get(`${serverId}/${channelId}`);
}

export function getCachedUserSettings(userId: string): UserSettings | undefined {
  return userSettingsCache.get(userId);
}

export function getCachedUserServerSettings(userId: string, serverId: string): UserServerSettings | undefined {
  return userServerSettingsCache.get(`${userId}/${serverId}`);
}

export function getCachedUserServerChannelSettings(
  userId: string,
  serverId: string,
  channelId: string,
): UserServerChannelSettings | undefined {
  return userServerChannelSettingsCache.get(`${userId}/${serverId}/${channelId}`);
}

export function setCachedServerSettings(newServerSettings: ServerSettings) {
  debug('[cache] setCachedServerSettings', JSON.stringify(newServerSettings, null, 2));
  serverSettingsCache.set(newServerSettings.getServerId(), newServerSettings);
}

export function setCachedServerChannelSettings(newServerChannelSettings: ServerChannelSettings) {
  debug('[cache] setCachedServerChannelSettings', JSON.stringify(newServerChannelSettings, null, 2));
  serverChannelSettingsCache.set(
    `${newServerChannelSettings.getServerId()}/${newServerChannelSettings.getChannelId()}`,
    newServerChannelSettings,
  );
}

export function setCachedUserSettings(newUserSettings: UserSettings) {
  debug('[cache] setCachedUserSettings', JSON.stringify(newUserSettings, null, 2));
  userSettingsCache.set(newUserSettings.getUserId(), newUserSettings);
}

export function setCachedUserServerSettings(newUserServerSettings: UserServerSettings) {
  debug('[cache] setCachedUserServerSettings', JSON.stringify(newUserServerSettings, null, 2));
  userServerSettingsCache.set(
    `${newUserServerSettings.getUserId()}/${newUserServerSettings.getServerId()}`,
    newUserServerSettings,
  );
}

export function setCachedUserServerChannelSettings(newUserServerChannelSettings: UserServerChannelSettings) {
  debug('[cache] setCachedUserServerChannelSettings', JSON.stringify(newUserServerChannelSettings, null, 2));
  userServerChannelSettingsCache.set(
    `${newUserServerChannelSettings.getUserId()}/${newUserServerChannelSettings.getServerId()}/${newUserServerChannelSettings.getChannelId()}`,
    newUserServerChannelSettings,
  );
}

export function clearServerSettingsCache(serverId: string) {
  debug('[cache] clearServerSettingsCache', serverId);
  serverSettingsCache.delete(serverId);
  for (const key of serverChannelSettingsCache.keys()) {
    if (key.startsWith(serverId)) {
      serverChannelSettingsCache.delete(key);
    }
  }
}

export function clearUserSettingsCache(userId: string) {
  debug('[cache] clearUserSettingsCache', userId);
  userSettingsCache.delete(userId);
  for (const key of userServerSettingsCache.keys()) {
    if (key.startsWith(userId)) {
      userServerSettingsCache.delete(key);
    }
  }
  for (const key of userServerChannelSettingsCache.keys()) {
    if (key.startsWith(userId)) {
      userServerChannelSettingsCache.delete(key);
    }
  }
}

// serverId/channelId -> MessageIdsMetadataData
const messageIdsMetadataCache = new Map<string, MessageIdsMetadataData>();

export function getCachedMessageIdsMetadata(serverId: string, channelId: string): MessageIdsMetadataData | undefined {
  return messageIdsMetadataCache.get(`${serverId}/${channelId}`);
}

export function setCachedMessageIdsMetadata(newMessageIdsMetadata: MessageIdsMetadataData) {
  debug('[cache] setCachedMessageIdsMetadata', JSON.stringify(newMessageIdsMetadata, null, 2));
  messageIdsMetadataCache.set(
    `${newMessageIdsMetadata.serverId}/${newMessageIdsMetadata.channelId}`,
    newMessageIdsMetadata,
  );
}
