export const FOREVER_TTL: number = -1;
// Friendly Defaults
export const DEFAULT_MIN_MESSAGE_TTL: number | undefined = 30;
export const DEFAULT_MAX_MESSAGE_TTL: number | undefined = undefined; // Forever
export const DEFAULT_MESSAGE_TTL: number | undefined = undefined; // Forever
export const DEFAULT_INCLUDE_PINS_BY_DEFAULT: boolean = false;

export interface ServerSettingsData {
  serverId: string;
  channelId?: string;
  defaultMessageTtl?: number | null;
  maxMessageTtl?: number | null;
  minMessageTtl?: number | null;
  includePinsByDefault?: boolean | null;
}

export class ServerSettings {
  public data: ServerSettingsData;

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
    public includePinsByDefault?: boolean | null,
  ) {
    this.data = {
      serverId,
      defaultMessageTtl,
      maxMessageTtl,
      minMessageTtl,
      includePinsByDefault,
    };
  }

  public getServerId(): string {
    return this.serverId;
  }

  public getDefaultMessageTtl(): number | undefined {
    if (this.defaultMessageTtl === FOREVER_TTL) {
      return undefined;
    } else if (this.defaultMessageTtl === null || this.defaultMessageTtl === undefined) {
      return DEFAULT_MESSAGE_TTL;
    }
    return this.defaultMessageTtl;
  }

  public getMaxMessageTtl(): number | undefined {
    if (this.maxMessageTtl === FOREVER_TTL) {
      return undefined;
    }
    if (this.maxMessageTtl === null || this.maxMessageTtl === undefined) {
      return DEFAULT_MAX_MESSAGE_TTL;
    }
    return this.maxMessageTtl;
  }

  public getMinMessageTtl(): number | undefined {
    if (this.minMessageTtl === FOREVER_TTL) {
      return undefined;
    } else if (this.minMessageTtl === null || this.minMessageTtl === undefined) {
      return DEFAULT_MIN_MESSAGE_TTL;
    }
    return this.minMessageTtl;
  }

  public getIncludePinsByDefault(): boolean {
    return this.includePinsByDefault ?? DEFAULT_INCLUDE_PINS_BY_DEFAULT;
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
    public includePinsByDefault?: boolean | null,
  ) {
    super(serverId, defaultMessageTtl, maxMessageTtl, minMessageTtl, includePinsByDefault);
    this.data.channelId = channelId;
  }

  public getChannelId(): string {
    return this.channelId;
  }

  public applyServerSettings(serverSettings: ServerSettings): ServerChannelSettings {
    new ServerChannelSettings(
      this.serverId,
      this.channelId,
      this.defaultMessageTtl !== undefined ? this.defaultMessageTtl : serverSettings.defaultMessageTtl,
      this.maxMessageTtl !== undefined ? this.maxMessageTtl : serverSettings.maxMessageTtl,
      this.minMessageTtl !== undefined ? this.minMessageTtl : serverSettings.minMessageTtl,
      this.includePinsByDefault !== undefined ? this.includePinsByDefault : serverSettings.includePinsByDefault,
    );
    return this;
  }
}
