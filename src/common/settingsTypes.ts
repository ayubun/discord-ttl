export const FOREVER_TTL: number = -1;
// Friendly Defaults
export const DEFAULT_MESSAGE_TTL: number | undefined = undefined; // Forever
export const DEFAULT_MIN_MESSAGE_TTL: number | undefined = 30;
export const DEFAULT_MAX_MESSAGE_TTL: number | undefined = undefined; // Forever
export const DEFAULT_INCLUDE_PINS: boolean = false;

// =-=-=------------------------=-=-=
// .｡.:☆ server settings types ☆:.｡.
// =-=-=------------------------=-=-=

/**
 * Data that is compatible with the `server_settings` database table
 */
export interface ServerSettingsData {
  serverId: string;
  channelId?: string | null;
  defaultMessageTtl?: number | null;
  maxMessageTtl?: number | null;
  minMessageTtl?: number | null;
  includePinsByDefault?: boolean | null;
}

export class ServerSettings {
  public static fromServerSettingsData(data: ServerSettingsData): ServerSettings {
    return new ServerSettings(
      data.serverId,
      data.defaultMessageTtl,
      data.maxMessageTtl,
      data.minMessageTtl,
      data.includePinsByDefault,
    );
  }

  public constructor(
    public serverId: string,
    public defaultMessageTtl?: number | null,
    public maxMessageTtl?: number | null,
    public minMessageTtl?: number | null,
    public includePins?: boolean | null,
  ) {}

  public getServerId(): string {
    return this.serverId;
  }

  /**
   * @returns the message time-to-live, in seconds. `undefined` if messages should live forever.
   * Defaults to {@link DEFAULT_MESSAGE_TTL}
   */
  public getMessageTtl(): number | undefined {
    if (this.defaultMessageTtl === FOREVER_TTL) {
      return undefined;
    } else if (this.defaultMessageTtl === null || this.defaultMessageTtl === undefined) {
      return DEFAULT_MESSAGE_TTL;
    }
    return this.defaultMessageTtl;
  }

  /**
   * @returns the max message time-to-live, in seconds. `undefined` if messages can live forever.
   * Defaults to {@link DEFAULT_MAX_MESSAGE_TTL}
   */
  public getMaxMessageTtl(): number | undefined {
    if (this.maxMessageTtl === FOREVER_TTL) {
      return undefined;
    }
    if (this.maxMessageTtl === null || this.maxMessageTtl === undefined) {
      return DEFAULT_MAX_MESSAGE_TTL;
    }
    return this.maxMessageTtl;
  }

  /**
   * @returns the min message time-to-live, in seconds. `undefined` if messages should live forever.
   * Defaults to {@link DEFAULT_MIN_MESSAGE_TTL}
   */
  public getMinMessageTtl(): number | undefined {
    if (this.minMessageTtl === FOREVER_TTL) {
      return undefined;
    } else if (this.minMessageTtl === null || this.minMessageTtl === undefined) {
      return DEFAULT_MIN_MESSAGE_TTL;
    }
    return this.minMessageTtl;
  }

  /**
   * @returns `true` if pins should be included. `false` if they should be excluded.
   * Defaults to {@link DEFAULT_INCLUDE_PINS}
   */
  public getIncludePins(): boolean {
    return this.includePins ?? DEFAULT_INCLUDE_PINS;
  }

  /**
   * @returns a {@link ServerSettingsData} that can be stored in the `server_settings` db table
   */
  public getData(): ServerSettingsData {
    return {
      serverId: this.serverId,
      channelId: null,
      defaultMessageTtl: this.defaultMessageTtl,
      maxMessageTtl: this.maxMessageTtl,
      minMessageTtl: this.minMessageTtl,
      includePinsByDefault: this.includePins,
    };
  }

  public clone(): ServerSettings {
    return new ServerSettings(
      this.serverId,
      this.defaultMessageTtl,
      this.maxMessageTtl,
      this.minMessageTtl,
      this.includePins,
    );
  }
}

export class ServerChannelSettings extends ServerSettings {
  public static fromServerSettingsData(data: ServerSettingsData): ServerChannelSettings {
    return new ServerChannelSettings(
      data.serverId,
      data.channelId!,
      data.defaultMessageTtl,
      data.maxMessageTtl,
      data.minMessageTtl,
      data.includePinsByDefault,
    );
  }

  public constructor(
    public serverId: string,
    public channelId: string,
    public defaultMessageTtl?: number | null,
    public maxMessageTtl?: number | null,
    public minMessageTtl?: number | null,
    public includePins?: boolean | null,
  ) {
    super(serverId, defaultMessageTtl, maxMessageTtl, minMessageTtl, includePins);
  }

  public getChannelId(): string {
    return this.channelId;
  }

  /**
   * @returns a {@link ServerSettingsData} that can be stored in the `server_settings` db table
   */
  public getData(): ServerSettingsData {
    return {
      serverId: this.serverId,
      channelId: this.channelId,
      defaultMessageTtl: this.defaultMessageTtl,
      maxMessageTtl: this.maxMessageTtl,
      minMessageTtl: this.minMessageTtl,
      includePinsByDefault: this.includePins,
    };
  }

  public clone(): ServerChannelSettings {
    return new ServerChannelSettings(
      this.serverId,
      this.channelId,
      this.defaultMessageTtl,
      this.maxMessageTtl,
      this.minMessageTtl,
      this.includePins,
    );
  }

  public applyServerSettings(serverSettings: ServerSettings): ServerChannelSettings {
    return new ServerChannelSettings(
      this.serverId,
      this.channelId,
      this.defaultMessageTtl !== undefined ? this.defaultMessageTtl : serverSettings.defaultMessageTtl,
      this.maxMessageTtl !== undefined ? this.maxMessageTtl : serverSettings.maxMessageTtl,
      this.minMessageTtl !== undefined ? this.minMessageTtl : serverSettings.minMessageTtl,
      this.includePins !== undefined ? this.includePins : serverSettings.includePins,
    );
  }
}
