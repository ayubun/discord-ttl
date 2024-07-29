import { ApplicationCommandOptionType, ChatInputCommandInteraction } from 'discord.js';
import { CookieCommand } from '../../../cookie';

const data = {
  description: 'Reset your TTL settings for this server',
  options: [
    {
      type: ApplicationCommandOptionType.Boolean,
      name: 'also-reset-all-channels',
      description: 'Set to "True" to also unset ALL channel settings for this server.',
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
