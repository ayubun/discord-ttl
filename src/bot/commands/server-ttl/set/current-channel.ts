import { ApplicationCommandOptionType, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { FOREVER_TTL } from 'src/common/types';
import { getServerChannelSettings, setServerChannelSettings } from 'src/database/api';
import { CookieCommand, CookieConfirmationMenu } from '../../../cookie';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import {
  getSecondsFromTimeString,
  getServerSettingsDiff,
  isForeverTtl as isForeverTtlString,
  isResetString,
} from '../../../common/utils';

const data = {
  default_member_permissions: PermissionFlagsBits.Administrator | PermissionFlagsBits.ManageGuild,
  description: 'Sets the default TTL settings for everyone in this channel',
  options: [
    {
      type: ApplicationCommandOptionType.String,
      name: 'default-time',
      description:
        'Default message TTL (e.g. `1h10m`, `30 min`, `1 week`). "forever" = No TTL. "reset" = Reset to default',
      required: true,
    },
    // {
    //   type: ApplicationCommandOptionType.String,
    //   name: 'max-time',
    //   description: 'Max message TTL (e.g. `1h10m`, `30 min`, `1 week`). "forever" = No max. "reset" = Reset to default',
    //   required: false,
    // },
    // {
    //   type: ApplicationCommandOptionType.String,
    //   name: 'min-time',
    //   description:
    //     'Min message TTL (e.g. `1h10m`, `30 min`, `1 week`). "forever" = TTL cannot be used. "reset" = Reset to default',
    //   required: false,
    // },
    {
      type: ApplicationCommandOptionType.Boolean,
      name: 'include-pins-by-default',
      description: 'Whether to include pins by default. "default" = Reset to default',
      required: false,
    },
  ],
};

const onExecute = async (self: CookieCommand, interaction: ChatInputCommandInteraction) => {
  const defaultTimeString = interaction.options.getString('default-time', true).toLocaleLowerCase();
  const maxTimeString = interaction.options.getString('max-time', false)?.toLocaleLowerCase();
  const minTimeString = interaction.options.getString('min-time', false)?.toLocaleLowerCase();
  const includePinsDefault = interaction.options.getBoolean('include-pins-by-default', false);

  const defaultTtlSeconds =
    defaultTimeString && !isForeverTtlString(defaultTimeString)
      ? getSecondsFromTimeString(defaultTimeString)
      : undefined;
  const maxTtlSeconds =
    maxTimeString && !isForeverTtlString(maxTimeString) ? getSecondsFromTimeString(maxTimeString) : undefined;
  const minTtlSeconds =
    minTimeString && !isForeverTtlString(minTimeString) ? getSecondsFromTimeString(minTimeString) : undefined;

  const currentSettings = await getServerChannelSettings(interaction.guildId!, interaction.channelId);
  const newSettings = structuredClone(currentSettings);

  if (isResetString(defaultTimeString)) {
    newSettings.defaultMessageTtl = null;
  } else if (isForeverTtlString(defaultTimeString)) {
    newSettings.defaultMessageTtl = FOREVER_TTL;
  } else if (defaultTtlSeconds) {
    newSettings.defaultMessageTtl = defaultTtlSeconds;
  }

  if (isResetString(maxTimeString)) {
    newSettings.maxMessageTtl = null;
  } else if (isForeverTtlString(maxTimeString)) {
    newSettings.maxMessageTtl = FOREVER_TTL;
  } else if (maxTtlSeconds) {
    newSettings.maxMessageTtl = maxTtlSeconds;
  }

  if (isResetString(minTimeString)) {
    newSettings.minMessageTtl = null;
  } else if (isForeverTtlString(minTimeString)) {
    newSettings.minMessageTtl = FOREVER_TTL;
  } else if (minTtlSeconds) {
    newSettings.minMessageTtl = minTtlSeconds;
  }

  if (includePinsDefault) {
    newSettings.includePinsByDefault = includePinsDefault;
  }

  if (currentSettings === newSettings) {
    return await interaction.reply({
      embeds: [
        {
          description: 'This channel already matches the provided settings ^-^',
        },
      ],
      ephemeral: true,
    });
  }

  const result = await new CookieConfirmationMenu(self, interaction)
    .setPromptMessage(
      'Are you sure you want to update the TTL settings for this channel?\n\n' +
        getServerSettingsDiff(currentSettings, newSettings),
    )
    .setSuccessMessage(
      'The TTL settings for this channel have been updated~\n\n' + getServerSettingsDiff(currentSettings, newSettings),
    )
    .prompt();

  if (result.isConfirmed()) {
    try {
      await setServerChannelSettings(newSettings);
    } catch (error) {
      return await result.error(String(error));
    }
  }
  await result.update();
};

export { data, onExecute };
