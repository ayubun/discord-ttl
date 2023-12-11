import { ChatInputCommandInteraction } from 'discord.js';

const data = {
  description: 'Get info about TTL for the current scope',
};

const onExecute = async (interaction: ChatInputCommandInteraction) => {
  await interaction.reply({ content: 'info!', ephemeral: true });
};

export { data, onExecute };
