import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';
import { APIApplicationCommandInteraction, ApplicationCommandOptionType, ApplicationCommandType, CacheType, ChatInputCommandInteraction, Client, ClientOptions, Collection, CommandInteractionOption, Events, Interaction, REST, Routes } from 'discord.js';


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
      return fs.readdirSync(current_dir).map(file_name => {
        const full_file_path = path.join(current_dir, file_name);
        if (fs.lstatSync(full_file_path).isDirectory()) {
          return mapCommandPathsToBunnyCommandsRecursively(full_file_path);
        }
        if (!file_name.endsWith('.ts')) {
          console.log(`[WARNING] BunnyClient is skipping non-Typescript file '${full_file_path}'`)
          return;
        }
        const bunny_command = BunnyCommand.fromFile(full_file_path);
        return { [bunny_command.getName()]: bunny_command };
      });
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

    const buildJsonDataFromTree = (parent_key: string, current_command_tree: Record<string, any>, current_depth: number = 0): Record<string, any> => {
      let new_json_data_tree: Record<string, any> = {
        // We will autofill the command layer
        "name": parent_key,
        "description": "Autofilled by BunnyClient",
      };
      if (BunnyCommand.isBunnyCommand(current_command_tree)) {
        const cmd = (<BunnyCommand>current_command_tree);
        switch (current_depth) {
          case 0: // Command layer
          new_json_data_tree['type'] = ApplicationCommandType.ChatInput;
          break;
          default: // Subcommand layer
          new_json_data_tree['type'] = ApplicationCommandOptionType.Subcommand;
          break;
        }
        new_json_data_tree = {...new_json_data_tree, ...cmd.getJsonData()}
        return new_json_data_tree;
      } else {
        switch (current_depth) {
          case 0: // Command layer
          new_json_data_tree['type'] = ApplicationCommandType.ChatInput;
          break;
          default: // Subcommand layer
          new_json_data_tree['type'] = ApplicationCommandOptionType.SubcommandGroup;
          break;
        }
        new_json_data_tree['options'] = [];
        for (const key in current_command_tree) {
          new_json_data_tree['options'].push(buildJsonDataFromTree(key, current_command_tree[key], current_depth + 1));
        }
      }
      return new_json_data_tree;
    }

    const commands: Array<any> = [];
    let commands_to_add = (Object.keys(this.command_tree) as Array<string>);

    while (commands_to_add.length > 0) {
      const next_command = commands_to_add.pop();
      if (!next_command) {
        break;
      }
      commands.push(buildJsonDataFromTree(next_command, this.command_tree[next_command]));
    }

    console.log('Command Tree:', JSON.stringify(this.command_tree, undefined, 2))
    console.log('Discord API JSON:', JSON.stringify(commands, undefined, 2))

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

    let full_command_name: Array<string> = [interaction.commandName];
    function traverseOptionsRecursively(current_data: readonly CommandInteractionOption[] | undefined) {
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

    // Use the `full_command_name` to power logs & command discovery
    let command = this.command_tree;
    for (const command_name in full_command_name) {
      if (!(command_name in command)) {
        console.error(`BunnyClient was missing '${command_name}' from the following command: ${full_command_name}`);
        return;
      }
      command = command[command_name]
    }
    if (!BunnyCommand.isBunnyCommand(command)) {
      console.error(`BunnyClient could not execute the following command: ${full_command_name}`);
      return;
    }

    // Cast and execute if the command is present in our command tree
    try {
      await (<BunnyCommand> command).execute(interaction);
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
    if (!("type" in json_data)) {
      this.json_data['type'] = ApplicationCommandType.ChatInput;
    }
  }

  static isBunnyCommand(command: any): command is BunnyCommand {
    return (<BunnyCommand>command).json_data !== undefined && (<BunnyCommand>command).execute_fn !== undefined;
  }

  static fromFile(path: string): BunnyCommand {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const command_file = require(path);
    if (!('json_data' in command_file)) {
      throw new Error(
        `BunnyCommand could not be created for ${path}: Missing \`json_data\` export`
      );
    } else if (!('execute_fn' in command_file)) {
      throw new Error(
        `BunnyCommand could not be created for ${path}: Missing \`execute_fn\` export`
      );
    }
    // Type checking
    const json_data_type = typeof(command_file.json_data);
    const execute_fn_type = typeof(command_file.json_data);
    assert(
      json_data_type === 'object', 
      `BunnyCommand could not be created for ${path}: \`json_data\` must be type 'object'`
      + ` (found: ${json_data_type})`
    )
    assert(
      execute_fn_type === 'function', 
      `BunnyCommand could not be created for ${path}: \`execute_fn\` must be type 'function'`
      + ` (found: ${execute_fn_type})`
    )
    let json_data = command_file.json_data;
    // If the name is missing from the json data, we will imply the command name from the file name
    if (!('name' in json_data)) {
      const file_name_without_type = path.slice(
        path.lastIndexOf('/') + 1, path.lastIndexOf('.ts')
      );
      json_data.name = file_name_without_type;
    }
    return new BunnyCommand(json_data, command_file.execute_fn)
  }

  public getName(): string {
    return this.json_data.name;
  }

  public getJsonData(): Record<string, any> {
    return this.json_data;
  }

  public async execute(interaction: ChatInputCommandInteraction) {
    await this.execute_fn(interaction);
  }
}