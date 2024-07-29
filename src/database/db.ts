import { and, eq, isNull } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import Database from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { debug } from '../logger';
import { ServerSettings, ServerChannelSettings, type ServerSettingsData } from '../common/types';
import { serverSettings } from './tables';

const sqlite = new Database('data/discord-ttl.db');
// docs: https://orm.drizzle.team/docs/get-started-sqlite#bun-sqlite
// https://orm.drizzle.team/learn/guides/conditional-filters-in-query
const db = drizzle(sqlite);
migrate(db, { migrationsFolder: 'drizzle' });

export async function selectServerSettings(serverId: string): Promise<ServerSettings | undefined> {
  debug('[database] selectServerSettings', serverId);
  const result = await db
    .select()
    .from(serverSettings)
    .where(and(eq(serverSettings.serverId, serverId), isNull(serverSettings.channelId)))
    .execute();
  if (result.length === 0) {
    return undefined;
  }
  return ServerSettings.fromServerSettingsData(result[0] as ServerSettingsData);
}

export async function selectServerChannelSettings(
  serverId: string,
  channelId: string,
): Promise<ServerChannelSettings | undefined> {
  debug('[database] selectServerChannelSettings', serverId, channelId);
  const result = await db
    .select()
    .from(serverSettings)
    .where(and(eq(serverSettings.serverId, serverId), eq(serverSettings.channelId, channelId)))
    .execute();
  if (result.length === 0) {
    return undefined;
  }
  return ServerChannelSettings.fromServerSettingsData(result[0] as ServerSettingsData);
}

export async function upsertServerSettings(newServerSettings: ServerSettings): Promise<void> {
  debug('[database] upsertServerSettings', JSON.stringify(newServerSettings, null, 2));
  await db
    .insert(serverSettings)
    .values(newServerSettings.getData())
    .onConflictDoUpdate({
      target: [serverSettings.serverId, serverSettings.channelId],
      set: newServerSettings.getData(),
    })
    .execute();
}

export async function upsertServerChannelSettings(newServerChannelSettings: ServerChannelSettings): Promise<void> {
  debug('[database] upsertServerChannelSettings', JSON.stringify(newServerChannelSettings, null, 2));
  await db
    .insert(serverSettings)
    .values(newServerChannelSettings.getData())
    .onConflictDoUpdate({
      target: [serverSettings.serverId, serverSettings.channelId],
      set: newServerChannelSettings.getData(),
    })
    .execute();
}

export async function deleteAllServerSettings(serverId: string): Promise<void> {
  debug('[database] deleteAllServerSettings', serverId);
  await db.delete(serverSettings).where(eq(serverSettings.serverId, serverId)).execute();
}

/*
Set your own channel-level ttl:
/my-ttl set current-channel `time:none (or time)` `include-pins:true (defaults false)`
Set your own server-level ttl:
/my-ttl set server-wide `time:none (or time)` `include-pins:true (defaults false)`
Reset your server or channel ttls to defaults:
/my-ttl reset current-channel
/my-ttl reset server-wide `reset-all-channels:true (defaults false)`

Set channel-level configs:
/server-ttl configure current-channel `max-time:none` `min-time:1h` `default-time:none` `include-pins-by-default:true`
Set server-level configs:
/server-ttl configure server-wide `max-time:12h` `min-time:1h` `default-time:6h` `include-pins-by-default:true`
Reset server-level ttl settings to defaults:
/server-ttl clear current-channel
/server-ttl clear server-wide `clear-all-channels:true (defaults false)`
*/

// server + channel; pins + ttl + disableUserTtls here
// if ttl is missing, default to server setting
// if disableUserTtls is missing, default to false
// server;

// some ttl and some pins setting

// user + server + channel WHERE message_ttl < server_ttl
// user + server WHERE message_ttl < server_ttl

/*

/server-ttl set ttl:1h delete-pins:false
/channel-ttl set ttl:1h delete-pins:true
/my-ttl set ttl:1h

my ttl > channel ttl > server ttl
channel disables > server disables
*/
