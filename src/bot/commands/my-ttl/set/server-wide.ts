// import { ApplicationCommandOptionType, ChatInputCommandInteraction } from 'discord.js';
// import { CookieCommand } from '../../../cookie';

// const data = {
//   description: 'Set your TTL settings for this server',
//   options: [
//     {
//       type: ApplicationCommandOptionType.String,
//       name: 'time',
//       description: 'Message TTL (e.g. "1h10m", "30 min", "1 week"). Put "forever" to never apply TTL to your messages',
//       required: true,
//     },
//     {
//       type: ApplicationCommandOptionType.Boolean,
//       name: 'include-pins',
//       description: 'Specify whether this message TTL should include pinned messages. Defaults to "False"',
//     },
//   ],
// };

// const onExecute = async (self: CookieCommand, interaction: ChatInputCommandInteraction) => {
//   return await interaction.reply({
//     content: `The ${self.getMention()} command is pending implementation`,
//     ephemeral: true,
//   });
// };

// export { data, onExecute };
