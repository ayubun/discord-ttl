import { ApplicationCommandOptionType, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { ServerSettings } from 'src/common/types';
import { getServerSettings, resetAllServerSettings, setServerSettings } from 'src/database/api';
import { getServerSettingsDiff } from 'src/bot/common/utils';
import { CookieCommand, CookieConfirmationMenu } from '../../../cookie';

const data = {
  default_member_permissions: String(PermissionFlagsBits.ManageGuild),
  description: 'Unset the default message TTL (time to live) for everyone in this server or channel',
  options: [
    {
      type: ApplicationCommandOptionType.Boolean,
      name: 'also-reset-all-channels',
      description: 'Set to "True" to also unset ALL channel settings for this server.',
    },
  ],
};

const onExecute = async (self: CookieCommand, interaction: ChatInputCommandInteraction) => {
  const clearAllChannels = interaction.options.getBoolean('also-reset-all-channels', false) ? true : false;
  const currentSettings: ServerSettings = await getServerSettings(interaction.guildId!);
  const defaultSettings = new ServerSettings(interaction.guildId!);

  if (currentSettings === defaultSettings && !clearAllChannels) {
    return await interaction.reply({
      embeds: [
        {
          description: 'The server already has default TTL settings ^-^',
        },
      ],
      ephemeral: true,
    });
  }

  const dangerMsg = clearAllChannels
    ? '**__DANGER__**: You have selected to reset ***all*** channel settings to default.\n'
    : '';
  const extraSuccessMsg = clearAllChannels ? 'All channel settings have also been reset to default.\n' : '';
  const result = await new CookieConfirmationMenu(self, interaction)
    .setPromptMessage(
      'Are you sure you want to reset the default TTL settings for this server?\n' +
        dangerMsg +
        '\n' +
        getServerSettingsDiff(currentSettings, defaultSettings),
    )
    .setSuccessMessage(
      'The default TTL settings for this server have been reset to defaults~\n' +
        extraSuccessMsg +
        '\n' +
        getServerSettingsDiff(currentSettings, defaultSettings),
    )
    .prompt();

  if (result.isConfirmed()) {
    try {
      if (clearAllChannels) {
        await resetAllServerSettings(interaction.guildId!);
      }
      await setServerSettings(defaultSettings);
    } catch (error) {
      return await result.error(String(error));
    }
  }
  await result.update();
};

export { data, onExecute };
