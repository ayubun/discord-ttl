import { DiscordSnowflake } from '@sapphire/snowflake';
import { PermissionFlagsBits, Routes, Message as DiscordJsMessage } from 'discord.js';
import { bot } from '../bot/api';
import { getServerChannelSettings, getServerSettings } from '../database/api';
import { error } from '../logger';

// 14 days (discord's bulk deletion age threshold) (-600 sec for time to delete buffer)
const BULK_DELETION_MAX_AGE_MILLIS: number = 1000 * (60 * 60 * 24 * 14 - 600);

// =-=-=----------------=-=-=
// .｡.:☆ message types ☆:.｡.
// =-=-=----------------=-=-=

/**
 * Data that is compatible with the `message_ids` database table
 */
export interface MessageIdsData {
  serverId: string;
  channelId: string;
  messageId: string;
  authorId: string;
}

export class Message {
  private createdAt: Date;
  private pinned: boolean;

  public static fromDiscordJsMessage(message: DiscordJsMessage): Message {
    if (!message.guildId) {
      throw new Error('Cannot create a Message object from a DM');
    }
    const msg = new Message(message.guildId, message.channelId, message.id, message.author.id);
    if (message.pinned) {
      msg.setPinned();
    }
    return msg;
  }

  public static fromMessageData(data: MessageIdsData): Message {
    return new Message(data.serverId, data.channelId, data.messageId, data.authorId);
  }

  public constructor(
    public serverId: string,
    public channelId: string,
    public messageId: string,
    public authorId: string,
  ) {
    this.createdAt = new Date(DiscordSnowflake.timestampFrom(this.messageId));
    this.pinned = false;
  }

  public setPinned(): this {
    this.pinned = true;
    return this;
  }

  public getServerId(): string {
    return this.serverId;
  }

  public getChannelId(): string {
    return this.channelId;
  }

  public getMessageId(): string {
    return this.messageId;
  }

  public getAuthorId(): string {
    return this.authorId;
  }

  public isPinned(): boolean {
    return this.pinned;
  }

  public getCreationDate(): Date {
    return this.createdAt;
  }

  /**
   * @returns `true` if the message is older than the effective time to live
   */
  public async isTimeToDie(): Promise<boolean> {
    const channelSettings = await getServerChannelSettings(this.serverId, this.channelId);
    const serverSettings = await getServerSettings(this.serverId);
    const effectiveSettings = channelSettings.applyServerSettings(serverSettings);

    const ttl = effectiveSettings.getMessageTtl();

    if (ttl === undefined) {
      return false;
    }

    if (this.pinned && !effectiveSettings.getIncludePins()) {
      return false;
    }

    return this.createdAt.getTime() < Date.now() - ttl * 1000;
  }

  /**
   * @returns `true` if the bot can delete this message
   */
  public isDeletable(): boolean {
    const channel = bot.channels.cache.get(this.channelId);
    if (!channel || channel.isDMBased()) {
      return false;
    }

    const me = channel.guild.members.me;
    if (!me) {
      return false;
    }

    const currentPerms = me.permissionsIn(channel);
    if (
      !currentPerms.has(PermissionFlagsBits.ViewChannel) ||
      !currentPerms.has(PermissionFlagsBits.ReadMessageHistory) ||
      !currentPerms.has(PermissionFlagsBits.ManageMessages)
    ) {
      return false;
    }

    // text-in-voice channels require `CONNECT` permissions, too :<
    if (channel.isVoiceBased() && !currentPerms.has(PermissionFlagsBits.Connect)) {
      return false;
    }

    return true;
  }

  /**
   * @returns `true` if this message is young enough for the bulk delete api (see: {@link BULK_DELETION_MAX_AGE_MILLIS})
   */
  public isBulkDeletable(): boolean {
    return this.createdAt.getTime() > Date.now() - BULK_DELETION_MAX_AGE_MILLIS;
  }

  /**
   * Attempt to delete this message from Discord
   * @returns `true` if the message was successfully deleted
   */
  public async delete(): Promise<boolean> {
    try {
      await bot.rest.delete(Routes.channelMessage(this.channelId, this.messageId));
      return true;
    } catch (err) {
      error(`[bot/message] Could not delete ${this.serverId}/${this.channelId}/${this.messageId}:`, err);
      return false;
    }
  }

  /**
   * @returns a {@link MessageIdsData} that can be stored in the `message_ids` db table
   */
  public getData(): MessageIdsData {
    return {
      serverId: this.serverId,
      channelId: this.channelId,
      messageId: this.messageId,
      authorId: this.authorId,
    };
  }

  public equals(obj: Message): boolean {
    return (
      this.authorId === obj.authorId &&
      this.channelId === obj.channelId &&
      this.messageId === obj.messageId &&
      this.serverId === obj.serverId
    );
  }
}

// =-=-=-------------------------=-=-=
// .｡.:☆ message metadata types ☆:.｡.
// =-=-=-------------------------=-=-=

/**
 * Data that is compatible with the `message_ids_metadata` database table
 */
export interface MessageIdsMetadataData {
  serverId: string;
  channelId: string;
  lastBackfilledMessageId: string;
}
