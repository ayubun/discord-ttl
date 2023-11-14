import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';
import { CacheType, Client, ClientOptions, Collection, Interaction, REST, Routes } from 'discord.js';

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts'));

export class CommandClient extends Client {
  public commands: Collection<string, any>;

  public constructor(options: ClientOptions) {
    super(options);
    this.commands = new Collection();
    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const command = require(filePath);
      if ('data' in command && 'execute' in command) {
        this.commands.set(command.data.name as string, command);
      } else {
        // TODO: Make this a test so that merged code will never hit this line
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
      }
    }
  }

  public async deployCommands() {
    assert(this.token, 'deployCommands cannot be called until TTL has a valid token');
    assert(this.user?.id, 'deployCommands cannot be called until TTL has a valid client id');

    const commands = [];
    for (const command of this.commands.values()) {
      commands.push(command.data.toJSON());
    }

    const rest = new REST().setToken(this.token);

    try {
      console.log(`Started refreshing ${commands.length} application (/) commands.`);

      const data: any = await rest.put(Routes.applicationCommands(this.user.id), { body: commands });

      console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
      console.error('TTL encountered an unexpected error while deploying commands:', error);
    }
  }

  public async handleInteraction(interaction: Interaction<CacheType>) {
    if (!interaction.isChatInputCommand()) return;

    const command = this.commands.get(interaction.commandName);

    if (!command) {
      console.error(`No command matching ${interaction.commandName} was found.`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
      } else {
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
      }
    }
  }
}
