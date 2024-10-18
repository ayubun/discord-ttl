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
 * Data that is compatible with the `server_settings` database table.
 *
 * The reason that we allow both `undefined` and `null` is because `null` is used
 * to represent expliticly setting a value to `null` (e.g. removing a set value),
 * while `undefined` is used to do nothing and inheret the value from the parent.
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
  public static from(data: ServerSettingsData): ServerSettings {
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
  public static from(data: ServerSettingsData): ServerChannelSettings {
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

  public _applyServerSettings(serverSettings: ServerSettings): ServerChannelSettings {
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

// =-=-=----------------------=-=-=
// .｡.:☆ user settings types ☆:.｡.
// =-=-=----------------------=-=-=

/**
 * Data that is compatible with the `user_settings` database table.
 *
 * The reason that we allow both `undefined` and `null` is because `null` is used
 * to represent expliticly setting a value to `null` (e.g. removing a set value),
 * while `undefined` is used to do nothing and inheret the value from the parent.
 */
export interface UserSettingsData {
  userId: string;
  serverId?: string | null;
  channelId?: string | null;
  messageTtl?: number | null;
  includePins?: boolean | null;
}

export class UserSettings {
  public static from(data: UserSettingsData): UserSettings {
    return new UserSettings(data.userId, data.messageTtl, data.includePins);
  }

  public constructor(
    public userId: string,
    public messageTtl?: number | null,
    public includePins?: boolean | null,
  ) {}

  public getUserId(): string {
    return this.userId;
  }

  /**
   * @returns the message time-to-live, in seconds. `undefined` if messages should live forever.
   * Defaults to {@link DEFAULT_MESSAGE_TTL}
   */
  public getMessageTtl(): number | undefined {
    if (this.messageTtl === FOREVER_TTL) {
      return undefined;
    } else if (this.messageTtl === null || this.messageTtl === undefined) {
      return DEFAULT_MESSAGE_TTL;
    }
    return this.messageTtl;
  }

  /**
   * @returns `true` if pins should be included. `false` if they should be excluded.
   * Defaults to {@link DEFAULT_INCLUDE_PINS}
   */
  public getIncludePins(): boolean {
    return this.includePins ?? DEFAULT_INCLUDE_PINS;
  }

  /**
   * @returns a {@link UserSettingsData} that can be stored in the `user_settings` db table
   */
  public getData(): UserSettingsData {
    return {
      userId: this.userId,
      serverId: null,
      channelId: null,
      messageTtl: this.messageTtl,
      includePins: this.includePins,
    };
  }

  public clone(): UserSettings {
    return new UserSettings(this.userId, this.messageTtl, this.includePins);
  }
}

export class UserServerSettings extends UserSettings {
  public static from(data: UserSettingsData): UserServerSettings {
    return new UserServerSettings(data.userId, data.serverId!, data.messageTtl, data.includePins);
  }

  public constructor(
    public userId: string,
    public serverId: string,
    public messageTtl?: number | null,
    public includePins?: boolean | null,
  ) {
    super(userId, messageTtl, includePins);
  }

  public getServerId(): string {
    return this.serverId;
  }

  /**
   * @returns a {@link UserSettingsData} that can be stored in the `user_settings` db table
   */
  public getData(): UserSettingsData {
    return {
      userId: this.userId,
      serverId: this.serverId,
      channelId: null,
      messageTtl: this.messageTtl,
      includePins: this.includePins,
    };
  }

  public clone(): UserServerSettings {
    return new UserServerSettings(this.userId, this.serverId, this.messageTtl, this.includePins);
  }

  public _applyUserSettings(userSettings: UserSettings): UserServerSettings {
    return new UserServerSettings(
      this.userId,
      this.serverId,
      this.messageTtl !== undefined ? this.messageTtl : userSettings.messageTtl,
      this.includePins !== undefined ? this.includePins : userSettings.includePins,
    );
  }
}

export class UserServerChannelSettings extends UserServerSettings {
  public static from(data: UserSettingsData): UserServerChannelSettings {
    return new UserServerChannelSettings(
      data.userId,
      data.serverId!,
      data.channelId!,
      data.messageTtl,
      data.includePins,
    );
  }

  public constructor(
    public userId: string,
    public serverId: string,
    public channelId: string,
    public messageTtl?: number | null,
    public includePins?: boolean | null,
  ) {
    super(userId, serverId, messageTtl, includePins);
  }

  public getChannelId(): string {
    return this.channelId;
  }

  /**
   * @returns a {@link UserSettingsData} that can be stored in the `user_settings` db table
   */
  public getData(): UserSettingsData {
    return {
      userId: this.userId,
      serverId: this.serverId,
      channelId: this.channelId,
      messageTtl: this.messageTtl,
      includePins: this.includePins,
    };
  }

  public clone(): UserServerChannelSettings {
    return new UserServerChannelSettings(this.userId, this.serverId, this.channelId, this.messageTtl, this.includePins);
  }

  public _applyUserServerSettings(userServerSettings: UserServerSettings): UserServerChannelSettings {
    return new UserServerChannelSettings(
      this.userId,
      this.serverId,
      this.channelId,
      this.messageTtl !== undefined ? this.messageTtl : userServerSettings.messageTtl,
      this.includePins !== undefined ? this.includePins : userServerSettings.includePins,
    );
  }

  public _applyServerChannelSettings(serverChannelSettings: ServerChannelSettings): UserServerChannelSettings {
    return new UserServerChannelSettings(
      this.userId,
      this.serverId,
      this.channelId,
      this.messageTtl !== undefined ? this.messageTtl : serverChannelSettings.defaultMessageTtl,
      this.includePins !== undefined ? this.includePins : serverChannelSettings.includePins,
    );
  }
}

// =-=-=--------------------------------=-=-=
// .｡.:☆ effective settings calculator ☆:.｡.
// =-=-=--------------------------------=-=-=

export class EffectiveServerChannelSettings {
  private effectiveTtl: number | undefined;

  public from(
    serverSettings: ServerSettings,
    serverChannelSettings: ServerChannelSettings,
    userSettings: UserSettings,
    userServerSettings: UserServerSettings,
    userServerChannelSettings: UserServerChannelSettings,
  ): EffectiveServerChannelSettings {
    const effectiveServerChannelSettings = serverChannelSettings._applyServerSettings(serverSettings);
    const effectiveUserServerChannelSettings = userServerChannelSettings
      ._applyUserServerSettings(userServerSettings._applyUserSettings(userSettings))
      ._applyServerChannelSettings(effectiveServerChannelSettings);
    return new EffectiveServerChannelSettings(
      effectiveServerChannelSettings.getMessageTtl(),
      effectiveUserServerChannelSettings.getMessageTtl(),
      effectiveServerChannelSettings.getMaxMessageTtl(),
      effectiveServerChannelSettings.getMinMessageTtl(),
      effectiveUserServerChannelSettings.getIncludePins(),
    );
  }

  public constructor(
    public defaultMessageTtl: number | undefined,
    public userMessageTtl: number | undefined,
    public maxMessageTtl: number | undefined,
    public minMessageTtl: number | undefined,
    public includePins: boolean,
  ) {
    if (
      this.minMessageTtl === undefined ||
      (this.userMessageTtl !== undefined && this.minMessageTtl > this.userMessageTtl)
    ) {
      this.effectiveTtl = this.minMessageTtl;
    } else if (
      this.maxMessageTtl === undefined ||
      (this.userMessageTtl !== undefined && this.userMessageTtl <= this.maxMessageTtl)
    ) {
      this.effectiveTtl = this.userMessageTtl;
    } else {
      this.effectiveTtl = this.maxMessageTtl;
    }
  }

  public getMessageTtl(): number | undefined {
    return this.effectiveTtl;
  }

  public getUserMessageTtl(): number | undefined {
    return this.userMessageTtl;
  }

  public getDefaulMessageTtl(): number | undefined {
    return this.defaultMessageTtl;
  }

  public getMaxMessageTtl(): number | undefined {
    return this.maxMessageTtl;
  }

  public getMinMessageTtl(): number | undefined {
    return this.minMessageTtl;
  }

  public getIncludePins(): boolean {
    return this.includePins;
  }
}
