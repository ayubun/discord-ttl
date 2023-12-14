import { ApplicationCommandOptionType, ChatInputCommandInteraction } from 'discord.js';
import { BunnyCommand } from '../../bunny';
import { getSecondsFromDurationString, isForeverTtl } from '../../common/utils';

const data = {
  description: 'Set your message TTL (time to live) for this server or channel',
  options: [
    {
      type: ApplicationCommandOptionType.String,
      name: 'duration',
      description: 'Message TTL (e.g. `1h10m`, `30 min`, `1 week`). Put `forever` to never apply TTL to your messages',
      required: true,
    },
    {
      type: ApplicationCommandOptionType.Boolean,
      name: 'channel',
      description: 'Set to `True` to set your TTL for the current channel. Otherwise, your server TTL will be set.',
    },
  ],
};

const onExecute = async (self: BunnyCommand, interaction: ChatInputCommandInteraction) => {
  const durationString = interaction.options.getString('duration', true).toLocaleLowerCase();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const isChannelTtl = interaction.options.getBoolean('channel', false) ? true : false;
  if (isForeverTtl(durationString)) {
    // TODO: Set the user's TTL to forever (a.k.a. never expire). The database API expects `-1` for this.
    // Make sure to use the `isChannelTtl` boolean to determine whether to set the channel or server TTL.
    return await interaction.reply({
      content: `The \`/${self.getFullCommandName()}\` command is pending implementation (parsed: forever) (channel: \`${isChannelTtl}\`)`,
      ephemeral: true,
    });
  }
  const ttlSeconds = getSecondsFromDurationString(durationString);
  if (!ttlSeconds) {
    // TODO: Tell the user their TTL is invalid.
    return await interaction.reply({
      content: `The \`/${self.getFullCommandName()}\` command is pending implementation (parsed: invalid) (channel: \`${isChannelTtl}\`)`,
      ephemeral: true,
    });
  }
  // TODO: Set the user's TTL to the parsed TTL.
  // Make sure to use the `isChannelTtl` boolean to determine whether to set the channel or server TTL.
  return await interaction.reply({
    content: `The \`/${self.getFullCommandName()}\` command is pending implementation (parsed: \`${ttlSeconds}\` sec) (channel: \`${isChannelTtl}\`)`,
    ephemeral: true,
  });
};

export { data, onExecute };
