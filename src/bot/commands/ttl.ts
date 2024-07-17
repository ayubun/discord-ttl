import { ChatInputCommandInteraction } from 'discord.js';
import { getServerChannelSettings, getServerSettings } from 'src/database/api';
import { CookieCommand } from '../cookie';
import { getServerSettingsDisplay } from '../common/utils';

const data = {
  description: 'Get the TTL settings for the current scope',
};

const onExecute = async (self: CookieCommand, interaction: ChatInputCommandInteraction) => {
  const serverSettings = await getServerSettings(interaction.guildId!);
  const channelSettings = await getServerChannelSettings(interaction.guildId!, interaction.channelId);
  const effectiveSettings = channelSettings.applyServerSettings(serverSettings);
  await interaction.reply({
    embeds: [
      {
        title: 'Current TTL Settings',
        description:
          getServerSettingsDisplay(serverSettings, '### __Server Settings__') +
          '\n\n' +
          getServerSettingsDisplay(channelSettings, '### __Channel Settings__') +
          '\n\n' +
          getServerSettingsDisplay(effectiveSettings, '### __Effective Settings__'),
      },
    ],
    ephemeral: true,
  });
};

export { data, onExecute };
