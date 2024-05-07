import { ApplicationCommandOptionType, ChatInputCommandInteraction } from 'discord.js';
import { BunnyCommand } from '../../../bunny';

// TODO: Make this command server admin only
const data = {
  description: 'Unset the default message TTL (time to live) for everyone in this server or channel',
  options: [
    {
      type: ApplicationCommandOptionType.Boolean,
      name: 'channel',
      description: "Set to `True` to unset the current channel's default TTL. Otherwise, unsets the server's default",
    },
  ],
};

// TODO: Make the response non-ephemeral
const onExecute = async (self: BunnyCommand, interaction: ChatInputCommandInteraction) => {
  const isChannelTtl = interaction.options.getBoolean('channel', false) ? true : false;
  await interaction.reply({
    content: `The \`/${self.getFullCommandName()}\` command is pending implementation (channel: \`${isChannelTtl}\`)`,
    ephemeral: true,
  });
};

export { data, onExecute };
