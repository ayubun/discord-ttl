import { ServerChannelSettings, ServerSettings } from 'src/common/types';

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
  serverSettingsCache.set(newServerSettings.getServerId(), newServerSettings);
}

export function setCachedServerChannelSettings(newServerChannelSettings: ServerChannelSettings) {
  serverChannelSettingsCache.set(
    `${newServerChannelSettings.getServerId()}/${newServerChannelSettings.getChannelId()}`,
    newServerChannelSettings,
  );
}

export function clearCache(serverId: string) {
  serverSettingsCache.delete(serverId);
  for (const key of serverChannelSettingsCache.keys()) {
    if (key.startsWith(serverId)) {
      serverChannelSettingsCache.delete(key);
    }
  }
}
