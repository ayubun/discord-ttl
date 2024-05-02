/**
 * cookie.ts is a TypeScript file that dynamically handles parity between
 * compatible `command/` files and the Discord API. The cookie.ts 'API' provides
 * a `CookieClient` wrapper for the Discord.js `Client` class, which is
 * responsible for registering, routing, and executing application commands.
 */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';
import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  type CacheType,
  ChatInputCommandInteraction,
  Client,
  type ClientOptions,
  type CommandInteractionOption,
  Events,
  type Interaction,
  REST,
  Routes,
} from 'discord.js';

/**
 * CookieClient is a Discord.js client abstraction that handles application commands :3
 */
export class CookieClient extends Client {
  private command_tree: Record<string, any>;

  public constructor(options: ClientOptions) {
    super(options);
    // listen for 'ready' event (which is sent when the bot connects to the discord api) because we
    // use some information returned from the api to register our commands (such as the client id)
    super.on('ready', () => {
      CookieLogger.info('Setting up application commands...');
      this.deployCommands()
        .then(() => {
          // this routes our interactions (a.k.a. application commands) to our own handler methods c:
          super.on(Events.InteractionCreate, async interaction => this.handleInteraction(interaction));
          CookieLogger.info('The bot is now receiving & processing application commands');
        })
        .catch((err: any) => {
          CookieLogger.error('Encountered a fatal error while deploying commands:', err);
          process.exit(1);
        });
    });
    // load all commands from the commands directory
    this.command_tree = CookieClient.buildCommandTree();
  }

  /**
   * Returns a `command_tree` for the CookieClient based on files/folders within the `commands/` directory.
   *
   * The command tree will look something like this:
   * 'ttl': {
   *   'set': CookieCommand from File('./commands/ttl/set.ts'),
   *   'unset': CookieCommand from File('./commands/ttl/unset.ts'),
   *   'info': CookieCommand from File('./commands/ttl/info.ts'),
   * }
   */
  private static buildCommandTree() {
    const root_commands_path = path.join(import.meta.dir, 'commands');

    function mapCommandPathsToCookieCommandsRecursively(current_dir: string): Record<string, any> {
      const command_tree: Record<string, any> = {};
      fs.readdirSync(current_dir).map(file_name => {
        const full_file_path = path.join(current_dir, file_name);
        if (fs.lstatSync(full_file_path).isDirectory()) {
          command_tree[file_name] = mapCommandPathsToCookieCommandsRecursively(full_file_path);
        }
        if (!file_name.endsWith('.js')) {
          return;
        }
        const cookie_command = CookieCommand.fromFile(full_file_path);
        command_tree[cookie_command.getName()] = cookie_command;
      });
      return command_tree;
    }

    return mapCommandPathsToCookieCommandsRecursively(root_commands_path);
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
      if (CookieCommand.isCookieCommand(current_command_tree)) {
        const cmd = current_command_tree;
        switch (current_depth) {
          case 0: // Command layer
            new_json_data_tree['type'] = ApplicationCommandType.ChatInput;
            break;
          default: // Subcommand layer
            new_json_data_tree['type'] = ApplicationCommandOptionType.Subcommand;
            break;
        }
        new_json_data_tree = { ...new_json_data_tree, ...cmd.getJsonData() };
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
        for (const key of Object.keys(current_command_tree)) {
          new_json_data_tree['options'].push(
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
    CookieLogger.debug(
      `Sending 'PUT ${Routes.applicationCommands(this.user.id)}' with the following payload:`,
      `${JSON.stringify(payload, undefined, 2)}`,
    );
    // we await (instead of `.then().catch()`) so that the error will bubble up to the caller
    const data: any = await rest.put(Routes.applicationCommands(this.user.id), payload);
    assert(
      data.length === commands.length,
      `Expected to update ${commands.length} command${commands.length === 1 ? '' : 's'} but` +
        ` ${data.length} ${data.length === 1 ? 'was' : 'were'} successful.`,
    );
    CookieLogger.debug(
      `Successfully PUT ${commands.length} command${commands.length === 1 ? '' : 's'} to the Discord API!`,
    );
  }

  private async handleInteraction(interaction: Interaction<CacheType>) {
    if (!interaction.isChatInputCommand()) return;

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
    CookieLogger.debug(`Command '/${full_command_name.join(' ')}' invoked by user ${interaction.user.id}`);

    // Use the `full_command_name` to power logs & command discovery
    let command = this.command_tree;
    full_command_name.forEach(command_name => {
      if (!(command_name in command)) {
        CookieLogger.error(`Invariant: Missing '${command_name}' from command '/${full_command_name.join(' ')}'`);
        // We will ignore this because it is likely that our command tree does not match what is in the Discord API.
        // It is *technically* possible to reach this state if the command tree is updated recently, since the
        // Discord API can take an hour to update global commands.
        return;
      }
      command = command[command_name];
    });
    if (!CookieCommand.isCookieCommand(command)) {
      CookieLogger.error(`Invariant: Command '/${full_command_name.join(' ')}' is not a CookieCommand`);
      // Same issue as above. This can happen if the command tree is updated recently.
      // It shouldn't happen regularly, though
      return;
    }
    // Cast and execute if the command is present in our command tree
    try {
      await command.execute(interaction);
      CookieLogger.debug(
        `Command '/${command.getFullCommandName()}' successfully executed for user ${interaction.user.id}`,
      );
    } catch (error) {
      CookieLogger.error(`Command '/${command.getFullCommandName()}' failed for user ${interaction.user.id}:`, error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
      } else {
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
      }
    }
  }
}

/**
 * `CookieCommand` is a wrapper for command files that can be executed by the `CookieClient`
 */
export class CookieCommand {
  private data: Record<string, any>;
  private onExecute: CallableFunction;
  private fullCommandName: string[];

  public constructor(data: Record<string, any>, executeFunction: CallableFunction, fullCommandName: string[]) {
    this.data = data;
    this.onExecute = executeFunction;
    this.fullCommandName = fullCommandName;
  }

  public static isCookieCommand(command: any): command is CookieCommand {
    return (
      command &&
      'data' in command &&
      (command as CookieCommand).data !== undefined &&
      'onExecute' in command &&
      (command as CookieCommand).onExecute !== undefined
    );
  }

  private static assertCommandDataIsValid(data: Record<string, any>) {
    assert('description' in data, `Missing 'description' from command data: ${JSON.stringify(data, undefined, 2)}`);
    assert(
      data['description'].length >= 1 && data['description'].length <= 100,
      `'description' must be between 1 and 100 characters (found ${data['description'].length}): ${JSON.stringify(
        data,
        undefined,
        2,
      )}`,
    );
    if ('options' in data) {
      const options = data['options'];
      assert(Array.isArray(options), `'options' must be an array (found type: ${typeof options})`);
      for (const option of options.values()) {
        assert(typeof option === 'object', `'option' was not resolvable as json: ${String(option)}`);
        assert('description' in option, `Missing 'description' from 'option': ${JSON.stringify(option, undefined, 2)}`);
        assert(
          option.description.length >= 1 && option.description.length <= 100,
          `Option 'description' must be between 1 and 100 characters (found ${
            option.description.length
          }): ${JSON.stringify(option, undefined, 2)}`,
        );
      }
    }
  }

  public static fromFile(filePath: string): CookieCommand {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const commandFile = require(filePath);
      assert('data' in commandFile, `Missing \`data\` export (expected type: json)`);
      assert('onExecute' in commandFile, `Missing \`onExecute\` export (expected type: async function)`);
      const jsonData = commandFile.data;
      const onExecute = commandFile.onExecute;
      // Type checking
      const jsonDataType = typeof jsonData;
      const onExecuteType = typeof onExecute;
      assert(
        jsonDataType === 'object',
        `\`data\` type must be json (expected type: 'object') (found type: ${jsonDataType})`,
      );
      assert(
        onExecuteType === 'function',
        `\`onExecute\` type must be an async function (expected type: 'function') (found type: '${onExecuteType}')`,
      );
      const full_command_name = filePath
        .substring(filePath.indexOf('bot/commands/') + 13, filePath.lastIndexOf('.js'))
        .split('/');
      // If the name is present in the json data, we will force the command name to be the specified name
      if ('name' in jsonData) {
        full_command_name.pop();
        full_command_name.push(String(jsonData.name));
      } else {
        jsonData.name = full_command_name[full_command_name.length - 1];
      }
      CookieCommand.assertCommandDataIsValid(jsonData as Record<string, any>);
      CookieLogger.debug(`Created CookieCommand for command '/${full_command_name.join(' ')}'`);
      return new CookieCommand(jsonData as Record<string, any>, onExecute as CallableFunction, full_command_name);
    } catch (err) {
      CookieLogger.error(`Could not create CookieCommand from file ${filePath}:`, String(err));
      CookieLogger.error(
        'This should not happen in production. Create an Issue on GitHub if you are seeing this during normal bot usage.',
      );
      process.exit(1);
    }
  }

  public getFullCommandName(): string {
    return this.fullCommandName.join(' ');
  }

  public getName(): string {
    return this.data['name'];
  }

  public getJsonData(): Record<string, any> {
    return this.data;
  }

  public async execute(interaction: ChatInputCommandInteraction) {
    await this.onExecute(this, interaction);
  }
}

/**
 * A console logs wrapper for cookie.ts-related logs.
 * cookie.ts uses it's own simple logger so that it can be used in other projects.
 */
class CookieLogger {
  // State
  private static IS_SETUP = false;
  // Defaults
  private static COOKIE_DEBUG_LOGGING = false;
  private static COOKIE_INFO_LOGGING = true;
  private static COOKIE_ERROR_LOGGING = true;

  // I got the colour codes from here: https://ss64.com/nt/syntax-ansi.html

  /**
   * Startup helper function to process .env variables for logging
   * @param variable The name of the logging variable to process
   */
  private static processLoggingEnv(variable: string) {
    if ((this as any)[variable] === undefined) {
      console.log('\x1b[32mCookieLogger does not have a variable called ' + variable);
      process.exit(1);
    }
    const value = process.env[variable]?.toLocaleLowerCase();
    if (value !== undefined) {
      if (value === 'false') {
        (this as any)[variable] = false;
      } else if (value === 'true') {
        (this as any)[variable] = true;
      } else {
        console.log(
          '\x1b[32mInvalid value for variable "' +
            variable +
            '" in the .env (expected true or false, found ' +
            value +
            ')',
        );
        process.exit(1);
      }
    }
  }

  /**
   * Initiate the Logger singleton & print a startup message
   */
  private static startup() {
    this.processLoggingEnv('COOKIE_DEBUG_LOGGING');
    this.processLoggingEnv('COOKIE_INFO_LOGGING');
    this.processLoggingEnv('COOKIE_ERROR_LOGGING');
    this.IS_SETUP = true;
  }

  public static debug(...args: any[]) {
    if (!this.IS_SETUP) {
      this.startup();
    }
    if (!this.COOKIE_DEBUG_LOGGING) {
      return;
    }
    args.unshift('[\x1b[34mcookie.ts\x1b[0m] [\x1b[90mDEBUG\x1b[0m]\x1b[90m');
    args.push('\x1b[0m');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    console.debug(...args);
  }

  public static info(...args: any[]) {
    if (!this.IS_SETUP) {
      this.startup();
    }
    if (!this.COOKIE_INFO_LOGGING) {
      return;
    }
    args.unshift('[\x1b[34mcookie.ts\x1b[0m] [\x1b[32mINFO\x1b[0m]\x1b[37m');
    args.push('\x1b[0m');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    console.info(...args);
  }

  public static error(...args: any[]) {
    if (!this.IS_SETUP) {
      this.startup();
    }
    if (!this.COOKIE_ERROR_LOGGING) {
      return;
    }
    args.unshift('[\x1b[34mcookie.ts\x1b[0m] [\x1b[31mERROR\x1b[0m]\x1b[93m');
    args.push('\x1b[0m');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    console.error(...args);
  }
}
