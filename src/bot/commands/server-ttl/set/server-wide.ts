import { ApplicationCommandOptionType, ChatInputCommandInteraction } from 'discord.js';
import { CookieCommand } from '../../../cookie';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { getSecondsFromTimeString, isForeverTtl } from '../../../common/utils';

// TODO: Make this command server admin only
const data = {
  description: 'Set a default message TTL (time to live) for everyone in this server or channel',
  options: [
    {
      type: ApplicationCommandOptionType.String,
      name: 'duration',
      description: 'Message TTL (e.g. `1h10m`, `30 min`, `1 week`)',
      required: true,
    },
    {
      type: ApplicationCommandOptionType.Boolean,
      name: 'channel',
      description: 'Set to "True" to set the current channel\'s default TTL. Otherwise, sets the server\'s default',
    },
  ],
};

// TODO: Make the response non-ephemeral
const onExecute = async (self: CookieCommand, interaction: ChatInputCommandInteraction) => {
  const defaultTimeString = interaction.options.getString('default-time', true).toLocaleLowerCase();
  // const maxTimeString = interaction.options.getString('max-time', false)?.toLocaleLowerCase();
  // const minTimeString = interaction.options.getString('min-time', false)?.toLocaleLowerCase();
  // const includePinsDefault = interaction.options.getBoolean('include-pins-by-default', false) ? true : false;
  // const isChannelTtl = interaction.options.getBoolean('channel', false) ? true : false;
  // if (isForeverTtl(durationString)) {
  //   // TODO: Let the user know that they can't set a default TTL to forever.
  //   // The appropriate command would be `/ttl default unset`.
  //   return await interaction.reply({
  //     content: `The \`/${self.getFullCommandName()}\` command is pending implementation (parsed: forever) (channel: \`${isChannelTtl}\`)`,
  //     ephemeral: true,
  //   });
  // }
  const ttlSeconds = getSecondsFromTimeString(defaultTimeString);
  // if (!ttlSeconds) {
  //   // TODO: Tell the user their TTL is invalid.
  //   return await interaction.reply({
  //     content: `The \`/${self.getFullCommandName()}\` command is pending implementation (parsed: invalid) (channel: \`${isChannelTtl}\`)`,
  //     ephemeral: true,
  //   });
  // }
  // TODO: Set the default TTL to the parsed TTL.
  // Make sure to use the `isChannelTtl` boolean to determine whether to set the channel or server default.
  return await interaction.reply({
    content: `The \`/${self.getFullCommandName()}\` command is pending implementation (parsed: \`${ttlSeconds}\` sec)`,
    ephemeral: true,
  });
};

export { data, onExecute };
