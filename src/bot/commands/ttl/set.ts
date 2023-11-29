import { ChatInputCommandInteraction } from 'discord.js';

const json_data = {
  description: 'Sets',
};

const execute_fn = async (interaction: ChatInputCommandInteraction) => {
  console.log('set!');
};

export { json_data, execute_fn };
