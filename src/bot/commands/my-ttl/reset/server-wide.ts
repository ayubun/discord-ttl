import { ApplicationCommandOptionType, ChatInputCommandInteraction } from 'discord.js';
import { CookieCommand } from '../../../cookie';

const data = {
  description: 'Reset your TTL settings for this server',
  options: [
    {
      type: ApplicationCommandOptionType.Boolean,
      name: 'also-reset-channels',
      description: 'Set to "True" to unset all TTL settings across all channels in the server. Defaults to "False"',
    },
  ],
};

const onExecute = async (self: CookieCommand, interaction: ChatInputCommandInteraction) => {
  await interaction.reply({
    content: `The ${self.getMention()} command is pending implementation`,
    ephemeral: true,
  });
};

export { data, onExecute };
