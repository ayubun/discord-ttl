import { ServerChannelSettings, ServerSettings } from '../common/types';
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

export function clearCache(serverId: string) {
  debug('[cache] clearCache', serverId);
  serverSettingsCache.delete(serverId);
  for (const key of serverChannelSettingsCache.keys()) {
    if (key.startsWith(serverId)) {
      serverChannelSettingsCache.delete(key);
    }
  }
}
