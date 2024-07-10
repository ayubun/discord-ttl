import { ApplicationCommandOptionType, ChatInputCommandInteraction } from 'discord.js';
import { CookieCommand } from '../../../cookie';
import { getSecondsFromTimeString, isForeverTtl } from '../../../common/utils';

const data = {
  description: 'Set your message TTL (time to live) for this server',
  options: [
    {
      type: ApplicationCommandOptionType.String,
      name: 'time',
      description: 'Message TTL (e.g. "1h10m", "30 min", "1 week"). Put "forever" to never apply TTL to your messages',
      required: true,
    },
    {
      type: ApplicationCommandOptionType.Boolean,
      name: 'include-pins',
      description: 'Specify whether this message TTL should include pinned messages. Defaults to "False"',
    },
  ],
};

const onExecute = async (self: CookieCommand, interaction: ChatInputCommandInteraction) => {
  const timeString = interaction.options.getString('time', true).toLocaleLowerCase();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const includePins = interaction.options.getBoolean('include-pins', false) ? true : false;
  if (isForeverTtl(timeString)) {
    // TODO: Set the user's TTL to forever (a.k.a. never expire). The database API expects `-1` for this.
    // Make sure to use the `isChannelTtl` boolean to determine whether to set the channel or server TTL.
    return await interaction.reply({
      content: `The \`/${self.getFullCommandName()}\` command is pending implementation (parsed: forever) (include-pins: \`${includePins}\`)`,
      ephemeral: true,
    });
  }
  const ttlSeconds = getSecondsFromTimeString(timeString);
  if (!ttlSeconds) {
    // TODO: Tell the user their TTL is invalid.
    return await interaction.reply({
      content: `The \`/${self.getFullCommandName()}\` command is pending implementation (parsed: invalid) (include-pins: \`${includePins}\`)`,
      ephemeral: true,
    });
  }
  // TODO: Set the user's TTL to the parsed TTL.
  // Make sure to use the `isChannelTtl` boolean to determine whether to set the channel or server TTL.
  return await interaction.reply({
    content: `The \`/${self.getFullCommandName()}\` command is pending implementation (parsed: \`${ttlSeconds}\` sec) (include-pins: \`${includePins}\`)`,
    ephemeral: true,
  });
};

export { data, onExecute };
