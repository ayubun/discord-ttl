import { ChatInputCommandInteraction } from 'discord.js';

const json_data = {
  description: 'Unsets',
};

const execute_fn = async (interaction: ChatInputCommandInteraction) => {
  console.log('unset!!');
};

export { json_data, execute_fn };
