export interface ServerSettingsData {
  serverId: string;
  channelId?: string;
  defaultMessageTtl?: number | null;
  maxMessageTtl?: number | null;
  minMessageTtl?: number | null;
  includePinsByDefault?: boolean;
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
    public includePinsByDefault?: boolean,
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
    if (this.defaultMessageTtl === null) {
      return undefined;
    }
    return this.defaultMessageTtl;
  }

  public getMaxMessageTtl(): number | undefined {
    if (this.maxMessageTtl === null) {
      return undefined;
    }
    return this.maxMessageTtl;
  }

  public getMinMessageTtl(): number | undefined {
    if (this.minMessageTtl === null) {
      return undefined;
    }
    return this.minMessageTtl;
  }

  public getIncludePinsByDefault(): boolean {
    return this.includePinsByDefault || false;
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
    public includePinsByDefault?: boolean,
  ) {
    super(serverId, defaultMessageTtl, maxMessageTtl, minMessageTtl, includePinsByDefault);
    this.data.channelId = channelId;
  }

  public getChannelId(): string {
    return this.channelId;
  }
}
