import { ApplicationCommandOptionType, ChatInputCommandInteraction } from 'discord.js';
import { BunnyCommand } from '../../bunny';

const data = {
  description: 'Unset your message TTL (time to live) for this server or channel',
  options: [
    {
      type: ApplicationCommandOptionType.Boolean,
      name: 'channel',
      description: 'Set to `True` to unset your TTL for the current channel. Otherwise, your server TTL will be unset.',
    },
  ],
};

const onExecute = async (self: BunnyCommand, interaction: ChatInputCommandInteraction) => {
  const isChannelTtl = interaction.options.getBoolean('channel', false) ? true : false;
  await interaction.reply({
    content: `The \`/${self.getFullCommandName()}\` command is pending implementation (channel: \`${isChannelTtl}\`)`,
    ephemeral: true,
  });
};

export { data, onExecute };
