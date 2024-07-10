import { PermissionFlagsBits, ChatInputCommandInteraction } from 'discord.js';
import { CookieCommand } from '../../../cookie';

const data = {
  default_member_permissions: PermissionFlagsBits.Administrator | PermissionFlagsBits.ManageGuild,
  description: 'Unset the default message TTL (time to live) for everyone in this server or channel',
  options: [],
};

const onExecute = async (self: CookieCommand, interaction: ChatInputCommandInteraction) => {
  await interaction.reply({
    content: `The \`/${self.getFullCommandName()}\` command is pending implementation`,
    ephemeral: true,
  });
};

export { data, onExecute };
