import { PermissionFlagsBits, ChatInputCommandInteraction } from 'discord.js';
import { getServerChannelSettings, setServerChannelSettings } from 'src/database/api';
import { ServerChannelSettings } from 'src/common/types';
import { getServerSettingsDiff } from 'src/bot/common/utils';
import { CookieCommand, CookieConfirmationMenu } from '../../../cookie';

const data = {
  default_member_permissions: String(PermissionFlagsBits.Administrator | PermissionFlagsBits.ManageGuild),
  description: 'Reset the default message TTL settings for this channel',
  options: [],
};

const onExecute = async (self: CookieCommand, interaction: ChatInputCommandInteraction) => {
  const currentSettings: ServerChannelSettings = await getServerChannelSettings(
    interaction.guildId!,
    interaction.channelId,
  );
  const defaultSettings = new ServerChannelSettings(interaction.guildId!, interaction.channelId);

  if (currentSettings === defaultSettings) {
    return await interaction.reply({
      embeds: [
        {
          description: 'This channel already has default TTL settings ^-^',
        },
      ],
      ephemeral: true,
    });
  }

  const result = await new CookieConfirmationMenu(self, interaction)
    .setPromptMessage(
      'Are you sure you want to reset the TTL settings for this channel?\n' +
        getServerSettingsDiff(currentSettings, defaultSettings),
    )
    .setSuccessMessage(
      'The TTL settings for this channel have been reset to defaults~\n' +
        getServerSettingsDiff(currentSettings, defaultSettings),
    )
    .prompt();

  if (result.isConfirmed()) {
    try {
      await setServerChannelSettings(defaultSettings);
    } catch (error) {
      return await result.error(String(error));
    }
  }
  await result.update();
};

export { data, onExecute };
