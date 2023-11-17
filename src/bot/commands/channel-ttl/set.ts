import { ChatInputCommandInteraction } from 'discord.js';

const json_data = {
  description: 'Set the TTL for the current channel',
};

const execute_fn = async (interaction: ChatInputCommandInteraction) => {
  console.log('shes alive !!');
};

export { json_data, execute_fn };
