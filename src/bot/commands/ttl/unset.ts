import { ApplicationCommandOptionType, ChatInputCommandInteraction } from 'discord.js';

const data = {
  description: 'Unset the message TTL (time to live) for this server or channel',
  options: [
    {
      type: ApplicationCommandOptionType.Boolean,
      name: 'personal',
      description: 'Set this to \'true\' to only change the TTL for yourself',
      required: true,
    },
    {
      type: ApplicationCommandOptionType.Boolean,
      name: 'channel',
      description: 'Set to \'true\' to change the TTL for this channel. \'false\' (default) changes the TTL for the server',
    },
  ],
};

const onExecute = async (interaction: ChatInputCommandInteraction) => {
  await interaction.reply({ content: 'unset!', ephemeral: true });
};

export { data, onExecute };
