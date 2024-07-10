import { ApplicationCommandOptionType, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { CookieCommand } from '../../../cookie';

const data = {
  default_member_permissions: PermissionFlagsBits.Administrator | PermissionFlagsBits.ManageGuild,
  description: 'Unset the default message TTL (time to live) for everyone in this server or channel',
  options: [
    {
      type: ApplicationCommandOptionType.Boolean,
      name: 'clear-all-channels',
      description:
        'Set to "True" to also unset ALL channel settings for this server. Otherwise, unsets only the server\'s default',
    },
  ],
};

const onExecute = async (self: CookieCommand, interaction: ChatInputCommandInteraction) => {
  const clearAllChannels = interaction.options.getBoolean('clear-all-channels', false) ? true : false;
  await interaction.reply({
    content: `The \`/${self.getFullCommandName()}\` command is pending implementation (clearAllChannels: \`${clearAllChannels}\`)`,
    ephemeral: true,
  });
};

export { data, onExecute };
