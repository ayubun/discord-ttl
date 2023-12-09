/**
 * bunny.ts is a TypeScript file that dynamically handles parity between
 * compatible `command/` files and the Discord API. The API provides a `BunnyClient`
 * wrapper for the Discord.js `Client` class and is responsible for registering,
 * routing, and executing bot commands.
 */
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
    // listen for 'ready' event (which is sent when the bot connects to the discord api) because we
    // use some information returned from the api to register our commands (such as the client id)
    super.on('ready', () => {
      this.deployCommands()
        .then(() => {
          // this routes our interactions (a.k.a. application commands) to our own handler methods c:
          super.on(Events.InteractionCreate, async interaction => this.handleInteraction(interaction))
          BunnyLogger.info('The bot is now receiving & processing application commands');
        })
        .catch((err: any) => {
          BunnyLogger.error('Encountered a fatal error while deploying commands:', err);
          process.exit(1);
        });
    });
    // load all commands from the commands directory
    this.command_tree = BunnyClient.buildCommandTree();
  }

  /**
   * Returns a `command_tree` for the BunnyClient based on files/folders within the `commands/` directory.
   *
   * The command tree will look something like this:
   * 'ttl': {
   *   'set': BunnyCommand from File('./commands/ttl/set.ts'),
   *   'unset': BunnyCommand from File('./commands/ttl/unset.ts'),
   *   'info': BunnyCommand from File('./commands/ttl/info.ts'),
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
          return;
        }
        const bunny_command = BunnyCommand.fromFile(full_file_path);
        command_tree[bunny_command.getName()] = bunny_command;
      });
      return command_tree;
    }

    return mapCommandPathsToBunnyCommandsRecursively(root_commands_path);
  }

  /**
   * Deploys the application commands to the Discord API.
   * https://discord.com/developers/docs/interactions/application-commands#example-walkthrough
   */
  private async deployCommands() {
    assert(this.token, 'Invariant: Missing valid token');
    assert(this.user?.id, 'Invariant: Missing valid client id');

    const buildJsonDataFromTree = (
      parent_key: string,
      current_command_tree: Record<string, any>,
      current_depth: number = 0,
    ): Record<string, any> => {
      let new_json_data_tree: Record<string, any> = {
        // We will autofill the command layer
        name: parent_key,
        // The API docs seem unclear on if this is necessary to populate
        // for subcommand groups / parent commands. This shouldn't be visible to users though
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

    const payload = { body: commands };
    const rest = new REST().setToken(this.token);
    BunnyLogger.debug(
      `Sending \`PUT ${Routes.applicationCommands(this.user.id)}\` with the following payload: ${JSON.stringify(payload, undefined, 2)}`
    );
    // we await (instead of `.then().catch()`) so that the error will bubble up to the caller
    const data: any = await rest.put(Routes.applicationCommands(this.user.id), payload);
    assert(
      data.length === commands.length,
      `Expected to update ${commands.length} commands but ${data.length} were successful.`
    );
    BunnyLogger.debug(`Successfully PUT ${commands.length} commands to the Discord API!`);
  }

  private async handleInteraction(interaction: Interaction<CacheType>) {
    if (!interaction.isChatInputCommand()) return;

    BunnyLogger.debug('received cmd: ', interaction.commandName);
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
    BunnyLogger.debug('The following command has been invoked by a user: /', full_command_name);

    // Use the `full_command_name` to power logs & command discovery
    let command = this.command_tree;
    full_command_name.forEach(command_name => {
      if (!(command_name in command)) {
        BunnyLogger.error(`Missing '${command_name}' from the following command: ${full_command_name}`);
        // We will ignore this because it is likely that our command tree does not match what is in the Discord API.
        // It is *technically* possible to reach this state if the command tree is updated recently, since the
        // Discord API can take an hour to update global commands.
        return;
      }
      command = command[command_name];
    });
    if (!BunnyCommand.isBunnyCommand(command)) {
      BunnyLogger.error(`Could not execute the following command: ${full_command_name}`);
      // Same issue as above. This can happen if the command tree is updated recently.
      // It shouldn't happen regularly, though
      return;
    }

    BunnyLogger.debug('got final cmd: ', command);

    // Cast and execute if the command is present in our command tree
    try {
      await command.execute(interaction);
    } catch (error) {
      BunnyLogger.error(`Could not execute command ${command.getName()}:`, error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
      } else {
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
      }
    }
  }
}

/**
 * `BunnyCommand` is a wrapper for command files that can be executed by the `BunnyClient`
 */
class BunnyCommand {
  private json_data: Record<string, any>;
  private execute_fn: CallableFunction;
  private full_command_name: string[];

  public constructor(json_data: Record<string, any>, execute_fn: CallableFunction, full_command_name: string[]) {
    this.json_data = json_data;
    this.execute_fn = execute_fn;
    this.full_command_name = full_command_name;
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
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const command_file = require(file_path);
      assert(
        'json_data' in command_file,
        `Missing \`json_data\` export`,
      );
      assert(
        'execute_fn' in command_file,
        `Missing \`execute_fn\` export`,
      );
      // Type checking
      const json_data_type = typeof command_file.json_data;
      const execute_fn_type = typeof command_file.execute_fn;
      assert(
        json_data_type === 'object',
        `\`json_data\` must be type 'object' (found: ${json_data_type})`,
      );
      assert(
        execute_fn_type === 'function',
        `\`execute_fn\` must be type 'function' (found: ${execute_fn_type})`,
      );
      const json_data = command_file.json_data;
      const full_command_name = file_path.substring(file_path.indexOf('bot/commands/') + 13, file_path.lastIndexOf('.js')).split('/');
      // If the name is present in the json data, we will force the command name to be the specified name
      if ('name' in json_data) {
        full_command_name.pop();
        full_command_name.push(String(json_data.name));
      }
      BunnyLogger.debug(`Created BunnyCommand for command /${full_command_name.join(' ')}`);
      return new BunnyCommand(json_data as Record<string, any>, command_file.execute_fn as CallableFunction, full_command_name);
    } catch (err) {
      BunnyLogger.error(`Could not create BunnyCommand from file ${file_path}:`, String(err));
      BunnyLogger.error('This should not happen in production. Create an Issue on GitHub if you are seeing this during normal bot usage.');
      process.exit(1);
    }
  }

  public getName(): string {
    return this.full_command_name.join(' ');
  }

  public getJsonData(): Record<string, any> {
    return this.json_data;
  }

  public async execute(interaction: ChatInputCommandInteraction) {
    BunnyLogger.debug(`Executing command: /${this.getName()}`);
    await this.execute_fn(interaction);
  }
}

/**
 * A console logs wrapper for bunny.ts-related logs.
 * bunny.ts uses it's own simple logger so that it can be used in other projects.
 */
class BunnyLogger {
  private static DEBUG_LOGGING = false;
  private static INFO_LOGGING = true;

  // I got the colour codes from here: https://ss64.com/nt/syntax-ansi.html

  public static debug(...args: any[]) {
    if (!BunnyLogger.DEBUG_LOGGING) {
      return;
    }
    args.unshift('[\x1b[34mbunny.ts\x1b[0m] [\x1b[90mDEBUG\x1b[0m]\x1b[90m');
    args.push('\x1b[0m');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    console.debug(...args);
  }

  public static info(...args: any[]) {
    if (!BunnyLogger.INFO_LOGGING) {
      return;
    }
    args.unshift('[\x1b[34mbunny.ts\x1b[0m] [\x1b[32mINFO\x1b[0m]\x1b[37m');
    args.push('\x1b[0m');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    console.info(...args);
  }

  public static error(...args: any[]) {
    args.unshift('[\x1b[34mbunny.ts\x1b[0m] [\x1b[31mERROR\x1b[0m]\x1b[93m');
    args.push('\x1b[0m');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    console.error(...args);
  }
}
