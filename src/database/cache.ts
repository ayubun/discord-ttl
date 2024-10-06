import type { MessageIdsMetadataData } from 'src/common/messageTypes';
import { ServerChannelSettings, ServerSettings } from '../common/settingsTypes';
import { debug } from '../logger';

// serverId -> ServerSettings
const serverSettingsCache = new Map<string, ServerSettings>();
// serverId/channelId -> ServerChannelSettings
const serverChannelSettingsCache = new Map<string, ServerChannelSettings>();

export function getCachedServerSettings(serverId: string): ServerSettings | undefined {
  return serverSettingsCache.get(serverId);
}

export function getCachedServerChannelSettings(serverId: string, channelId: string): ServerChannelSettings | undefined {
  return serverChannelSettingsCache.get(`${serverId}/${channelId}`);
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

export function clearServerSettingsCache(serverId: string) {
  debug('[cache] clearServerSettingsCache', serverId);
  serverSettingsCache.delete(serverId);
  for (const key of serverChannelSettingsCache.keys()) {
    if (key.startsWith(serverId)) {
      serverChannelSettingsCache.delete(key);
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
