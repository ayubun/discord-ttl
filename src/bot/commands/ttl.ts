import { ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { EffectiveUserServerChannelSettings } from 'src/common/settingsTypes';
import {
  getServerChannelSettings,
  getServerSettings,
  getUserServerChannelSettings,
  getUserServerSettings,
  getUserSettings,
} from '../../database/api';
import { CookieCommand } from '../cookie';
import { getServerSettingsDisplay } from '../common/utils';

const data = {
  default_member_permissions: String(PermissionFlagsBits.SendMessages),
  description: 'Get the TTL settings for the current scope',
};

const onExecute = async (self: CookieCommand, interaction: ChatInputCommandInteraction) => {
  const serverSettings = await getServerSettings(interaction.guildId!);
  const channelSettings = await getServerChannelSettings(interaction.guildId!, interaction.channelId);
  const userSettings = await getUserSettings(interaction.user.id);
  const userServerSettings = await getUserServerSettings(interaction.guildId!, interaction.user.id);
  const userServerChannelSettings = await getUserServerChannelSettings(
    interaction.guildId!,
    interaction.channelId,
    interaction.user.id,
  );
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const effectiveSettings = EffectiveUserServerChannelSettings.from(
    serverSettings,
    channelSettings,
    userSettings,
    userServerSettings,
    userServerChannelSettings,
  );
  await interaction.reply({
    embeds: [
      {
        title: 'Current TTL Settings',
        description:
          getServerSettingsDisplay(serverSettings, '### __Server Settings__') +
          '\n' +
          getServerSettingsDisplay(channelSettings, '### __Channel Settings__') +
          '\n',
        // TODO: Display all settings
      },
    ],
    ephemeral: true,
  });
};

export { data, onExecute };
