import { ApplicationCommandOptionType, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { CookieCommand } from '../../../cookie';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { getSecondsFromTimeString, isForeverTtl } from '../../../common/utils';

const data = {
  default_member_permissions: PermissionFlagsBits.Administrator | PermissionFlagsBits.ManageGuild,
  description: 'Set a default message TTL (time to live) for everyone in this server or channel',
  options: [
    {
      type: ApplicationCommandOptionType.String,
      name: 'default-time',
      description: 'Default message TTL (e.g. `1h10m`, `30 min`, `1 week`)',
      required: true,
    },
    {
      type: ApplicationCommandOptionType.String,
      name: 'max-time',
      description: 'Max message TTL (e.g. `1h10m`, `30 min`, `1 week`). Leave empty / "forever" = No max',
      required: false,
    },
    {
      type: ApplicationCommandOptionType.String,
      name: 'min-time',
      description:
        'Min message TTL (e.g. `1h10m`, `30 min`, `1 week`). "forever" = TTL cannot be used. Leave empty = No min',
      required: false,
    },
    {
      type: ApplicationCommandOptionType.Boolean,
      name: 'include-pins-by-default',
      description: 'Whether to include pins by default. Defaults to "False"',
      required: false,
    },
  ],
};

// TODO: Make the response non-ephemeral
const onExecute = async (self: CookieCommand, interaction: ChatInputCommandInteraction) => {
  const defaultTimeString = interaction.options.getString('default-time', true).toLocaleLowerCase();
  // const maxTimeString = interaction.options.getString('max-time', false)?.toLocaleLowerCase();
  // const minTimeString = interaction.options.getString('min-time', false)?.toLocaleLowerCase();
  // const includePinsDefault = interaction.options.getBoolean('include-pins-by-default', false) ? true : false;
  // if (isForeverTtl(defaultTimeString)) {
  //   // TODO: Let the user know that they can't set a default TTL to forever.
  //   // The appropriate command would be `/ttl default unset`.
  //   return await interaction.reply({
  //     content: `The \`/${self.getFullCommandName()}\` command is pending implementation (default: forever) (channel: \`${includePinsDefault}\`)`,
  //     ephemeral: true,
  //   });
  // }
  const ttlSeconds = getSecondsFromTimeString(defaultTimeString);
  // if (!ttlSeconds) {
  //   // TODO: Tell the user their TTL is invalid.
  //   return await interaction.reply({
  //     content: `The \`/${self.getFullCommandName()}\` command is pending implementation (default: invalid) (channel: \`${includePinsDefault}\`)`,
  //     ephemeral: true,
  //   });
  // }
  // TODO: Set the default TTL to the parsed TTL.
  // Make sure to use the `isChannelTtl` boolean to determine whether to set the channel or server default.
  return await interaction.reply({
    content: `The \`/${self.getFullCommandName()}\` command is pending implementation (parsed: \`${ttlSeconds}\` sec)`,
    ephemeral: true,
  });
};

export { data, onExecute };
