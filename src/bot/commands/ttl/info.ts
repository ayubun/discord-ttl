import { ChatInputCommandInteraction } from 'discord.js';
import { BunnyCommand } from '../../bunny';

const data = {
  description: 'Get info about the TTL (time to live) for the current scope',
};

// TODO: Make the response ephemeral
const onExecute = async (self: BunnyCommand, interaction: ChatInputCommandInteraction) => {
  await interaction.reply({
    content: `The \`/${self.getFullCommandName()}\` command is pending implementation`,
    ephemeral: true,
  });
};

export { data, onExecute };
