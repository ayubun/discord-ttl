import { ChatInputCommandInteraction } from 'discord.js';
import { CookieCommand } from '../../../cookie';

const data = {
  description: 'Reset your message TTL (time to live) for this channel',
  options: [],
};

const onExecute = async (self: CookieCommand, interaction: ChatInputCommandInteraction) => {
  await interaction.reply({
    content: `The \`/${self.getFullCommandName()}\` command is pending implementation`,
    ephemeral: true,
  });
};

export { data, onExecute };
