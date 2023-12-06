import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  CacheType,
  ChatInputCommandInteraction,
  Client,
  ClientOptions,
  CommandInteractionOption,
  Events,
  Interaction,
  REST,
  Routes,
} from 'discord.js';

/**
 * BunnyClient is a Discord.js client abstraction that handles application commands :3
 */
export class BunnyClient extends Client {
  private command_tree: Record<string, any>;

  public constructor(options: ClientOptions) {
    super(options);
    // Listen for 'ready' event (which is sent when the bot connects to the Discord API) because we
    // use some information returned from the API to register our commands (such as the Client ID)
    super.on('ready', () =>
      this.deployCommands().catch((err: any) => {
        console.error('BunnyClient encountered a fatal error while deploying commands:', err);
        process.exit(1);
      }),
    );
    // this routes our interactions (a.k.a. application commands) to our own handler method c:
    super.on(Events.InteractionCreate, async interaction => this.handleInteraction(interaction));
    this.command_tree = BunnyClient.buildCommandTree();
  }

  /**
   * Returns a `command_tree` for the BunnyClient based on files/folders within the `commands/` directory.
   *
   * The command tree should look something like this:
   * {
      'channel-ttl': {
        'set': BunnyCommand(commands/channel-ttl/set.ts file path),
        'unset': BunnyCommand(commands/channel-ttl/unset.ts file path),
        'get': BunnyCommand(commands/channel-ttl/get.ts file path),
      }.
      'server-ttl': {
        'set': BunnyCommand(commands/server-ttl/set.ts file path),
        'unset': BunnyCommand(commands/server-ttl/unset.ts file path),
        'get': BunnyCommand(commands/server-ttl/get.ts file path),
      },
      'my-ttl': {
        'set': BunnyCommand(commands/my-ttl/set.ts),
        'unset': BunnyCommand(commands/my-ttl/unset.ts file path),
        'get': BunnyCommand(commands/my-ttl/get.ts file path),
      },
   * }
   */
  private static buildCommandTree() {
    const root_commands_path = path.join(__dirname, 'commands');

    function mapCommandPathsToBunnyCommandsRecursively(current_dir: string): Record<string, any> {
      const command_tree: Record<string, any> = {};
      fs.readdirSync(current_dir).map(file_name => {
        const full_file_path = path.join(current_dir, file_name);
        if (fs.lstatSync(full_file_path).isDirectory()) {
          command_tree[file_name] = mapCommandPathsToBunnyCommandsRecursively(full_file_path);
        }
        if (!file_name.endsWith('.js')) {
          console.log(`[WARNING] BunnyClient is skipping non-Javascript file '${full_file_path}'`);
          return;
        }
        const bunny_command = BunnyCommand.tryFromFile(full_file_path);
        if (bunny_command === undefined) {
          console.log(`[WARNING] BunnyClient is skipping undefined file '${full_file_path}'`);
          return;
        }
        command_tree[bunny_command.getName()] = bunny_command;
      });
      return command_tree;
    }

    return mapCommandPathsToBunnyCommandsRecursively(root_commands_path);
  }

  /**
   * We currently store the command tree as described in buildCommandTree()
   * But the Discord API will expect something like this:
   * https://discord.com/developers/docs/interactions/application-commands#example-walkthrough
   */
  private async deployCommands() {
    assert(this.token, 'BunnyClient does not have a valid token');
    assert(this.user?.id, 'BunnyClient does not have a valid client id');

    const buildJsonDataFromTree = (
      parent_key: string,
      current_command_tree: Record<string, any>,
      current_depth: number = 0,
    ): Record<string, any> => {
      let new_json_data_tree: Record<string, any> = {
        // We will autofill the command layer
        name: parent_key,
        description: 'bun',
      };
      if (BunnyCommand.isBunnyCommand(current_command_tree)) {
        const cmd = current_command_tree;
        switch (current_depth) {
          case 0: // Command layer
            new_json_data_tree.type = ApplicationCommandType.ChatInput;
            break;
          default: // Subcommand layer
            new_json_data_tree.type = ApplicationCommandOptionType.Subcommand;
            break;
        }
        new_json_data_tree = { ...new_json_data_tree, ...cmd.getJsonData() };
        return new_json_data_tree;
      } else {
        switch (current_depth) {
          case 0: // Command layer
            new_json_data_tree.type = ApplicationCommandType.ChatInput;
            break;
          default: // Subcommand layer
            new_json_data_tree.type = ApplicationCommandOptionType.SubcommandGroup;
            break;
        }
        new_json_data_tree.options = [];
        for (const key of Object.keys(current_command_tree)) {
          new_json_data_tree.options.push(
            buildJsonDataFromTree(key, current_command_tree[key] as Record<string, any>, current_depth + 1),
          );
        }
      }
      return new_json_data_tree;
    };

    const commands: any[] = [];
    const commands_to_add = Object.keys(this.command_tree);

    while (commands_to_add.length > 0) {
      const next_command = commands_to_add.pop();
      if (!next_command) {
        break;
      }
      commands.push(buildJsonDataFromTree(next_command, this.command_tree[next_command] as Record<string, any>));
    }

    console.log('Command Tree:', JSON.stringify(this.command_tree, undefined, 2));
    console.log('Discord API JSON:', JSON.stringify(commands, undefined, 2));

    const rest = new REST().setToken(this.token);

    try {
      console.log(`BunnyClient started refreshing ${commands.length} commands.`);

      const data: any = await rest.put(Routes.applicationCommands(this.user.id), { body: commands });

      console.log(`BunnyClient successfully reloaded ${data.length} commands.`);
    } catch (error) {
      console.error('BunnyClient encountered an unexpected error while deploying commands:', error);
    }
  }

  private async handleInteraction(interaction: Interaction<CacheType>) {
    if (!interaction.isChatInputCommand()) return;

    console.log('received cmd: ', interaction.commandName);
    const full_command_name: string[] = [interaction.commandName];
    function traverseOptionsRecursively(current_data: readonly CommandInteractionOption[] | undefined): void {
      if (current_data === undefined) {
        return;
      }
      for (const option of current_data) {
        switch (option.type) {
          case ApplicationCommandOptionType.SubcommandGroup:
            full_command_name.push(option.name);
            return traverseOptionsRecursively(option.options);
          case ApplicationCommandOptionType.Subcommand:
            full_command_name.push(option.name);
            return;
        }
      }
    }
    // Fill the `full_command_name` array based on a recursive traversal of the interaction options
    traverseOptionsRecursively(interaction.options.data);
    console.log('got cmd: ', full_command_name);

    // Use the `full_command_name` to power logs & command discovery
    let command = this.command_tree;
    full_command_name.forEach(command_name => {
      if (!(command_name in command)) {
        console.error(`BunnyClient was missing '${command_name}' from the following command: ${full_command_name}`);
        return;
      }
      command = command[command_name];
    });
    if (!BunnyCommand.isBunnyCommand(command)) {
      console.error(`BunnyClient could not execute the following command: ${full_command_name}`);
      return;
    }

    console.log('got final cmd: ', command);

    // Cast and execute if the command is present in our command tree
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

class BunnyCommand {
  private json_data: Record<string, any>;
  private execute_fn: CallableFunction;

  public constructor(json_data: Record<string, any>, execute_fn: CallableFunction) {
    this.json_data = json_data;
    this.execute_fn = execute_fn;
  }

  public static isBunnyCommand(command: any): command is BunnyCommand {
    return (
      command &&
      'json_data' in command &&
      (command as BunnyCommand).json_data !== undefined &&
      'execute_fn' in command &&
      (command as BunnyCommand).execute_fn !== undefined
    );
  }

  public static fromFile(file_path: string): BunnyCommand {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const command_file = require(file_path);
    assert(
      'json_data' in command_file,
      `BunnyCommand could not be created for ${file_path}: Missing \`json_data\` export`,
    );
    assert(
      'execute_fn' in command_file,
      `BunnyCommand could not be created for ${file_path}: Missing \`execute_fn\` export`,
    );
    // Type checking
    const json_data_type = typeof command_file.json_data;
    const execute_fn_type = typeof command_file.execute_fn;
    assert(
      json_data_type === 'object',
      `BunnyCommand could not be created for ${file_path}: \`json_data\` must be type 'object'` +
      ` (found: ${json_data_type})`,
    );
    assert(
      execute_fn_type === 'function',
      `BunnyCommand could not be created for ${file_path}: \`execute_fn\` must be type 'function'` +
      ` (found: ${execute_fn_type})`,
    );
    const json_data = command_file.json_data;
    // If the name is missing from the json data, we will imply the command name from the file name
    if (!('name' in json_data)) {
      const file_name_without_type = file_path.slice(file_path.lastIndexOf('/') + 1, file_path.lastIndexOf('.js'));
      json_data.name = file_name_without_type;
    }
    return new BunnyCommand(json_data as Record<string, any>, command_file.execute_fn as CallableFunction);
  }

  public static tryFromFile(file_path: string): BunnyCommand | undefined {
    try {
      return BunnyCommand.fromFile(file_path);
    } catch (err) {
      console.error(`Could not create BunnyCommand from file ${file_path}:`, err);
    }
    return undefined;
  }

  public getName(): string {
    return this.json_data.name;
  }

  public getJsonData(): Record<string, any> {
    return this.json_data;
  }

  public async execute(interaction: ChatInputCommandInteraction) {
    console.log(`Executing command: ${this.getName()}`);
    await this.execute_fn(interaction);
  }
}
