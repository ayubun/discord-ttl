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
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
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
    // load all commands from the commands directory
    this.command_tree = CookieClient.buildCommandTree();
    // listen for 'ready' event (which is sent when the bot connects to the discord api) because we
    // use some information returned from the api to register our commands (such as the client id)
    super.on('ready', () => {
      CookieLogger.info('Setting up application commands...');
      this.deployCommands()
        .then(async data => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          await this.populateCommandIds(data).catch(e => CookieLogger.error('Could not populate command ids:', e));
          // this routes our interactions (a.k.a. application commands) to our own handler methods c:
          // https://stackoverflow.com/questions/63488141/promise-returned-in-function-argument-where-a-void-return-was-expected
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          super.on(Events.InteractionCreate, async interaction => await this.handleInteraction(interaction));
          CookieLogger.info('The bot is now receiving & processing application commands');
        })
        .catch((err: any) => {
          CookieLogger.error('Encountered a fatal error while deploying commands:', err);
          process.exit(1);
        });
    });
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
      let errors = false;
      fs.readdirSync(current_dir).map(file_name => {
        const full_file_path = path.join(current_dir, file_name);
        if (fs.lstatSync(full_file_path).isDirectory()) {
          command_tree[file_name] = mapCommandPathsToCookieCommandsRecursively(full_file_path);
        }
        if (!file_name.endsWith('.js')) {
          return;
        }
        const cookie_command = CookieCommand.fromFile(full_file_path);
        if (!cookie_command) {
          // Since we want to print out all of the poorly formatted commands, we will continue for now
          errors = true;
          return;
        }
        command_tree[cookie_command.getName()] = cookie_command;
      });
      if (errors) {
        // TODO: uncomment once user ttls are implemented !
        // CookieLogger.error(
        //   'This should not happen in production. Create an Issue on GitHub if you are seeing this during normal bot usage.',
        // );
        // process.exit(1);
      }
      return command_tree;
    }

    return mapCommandPathsToCookieCommandsRecursively(root_commands_path);
  }

  /**
   * Deploys the application commands to the Discord API.
   * https://discord.com/developers/docs/interactions/application-commands#example-walkthrough
   */
  private async deployCommands(): Promise<any> {
    assert(this.token, 'Invariant: Missing valid token');
    assert(this.user?.id, 'Invariant: Missing valid client id');

    const getMinimumNecessaryPermissions = (current_command_tree: Record<string, any>): bigint => {
      if (CookieCommand.isCookieCommand(current_command_tree)) {
        const cmd = current_command_tree;
        const cmdPerms = cmd.getJsonData()['default_member_permissions'];
        if (cmdPerms && typeof cmdPerms === 'string') {
          return BigInt(cmdPerms);
        }
      } else {
        const keys = Object.keys(current_command_tree);
        if (!keys) {
          return BigInt(0);
        }
        let perms = BigInt('0xffffffff');
        for (const key of keys) {
          perms &= getMinimumNecessaryPermissions(current_command_tree[key] as Record<string, any>);
        }
        return perms;
      }
      return BigInt(0);
    };

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
      if (current_depth === 0) {
        const perms = getMinimumNecessaryPermissions(current_command_tree);
        if (perms !== BigInt(0)) {
          new_json_data_tree['default_member_permissions'] = String(perms);
        }
      }
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
    return data;
  }

  /**
   * Populates the `commandId` field for each `CookieCommand` in the `command_tree`.
   *
   * @param data The data returned from the Discord API after deploying commands
   */
  private async populateCommandIds(data: { id: string; name: string }[]) {
    const command_names_to_ids: Record<string, string> = {};
    for (const command_object of data) {
      command_names_to_ids[command_object.name] = command_object.id;
    }

    function traverseCommandTreeRecursively(
      command_id: string,
      current_command_tree: Record<string, any> | CookieCommand,
    ) {
      if (CookieCommand.isCookieCommand(current_command_tree)) {
        const cmd: CookieCommand = current_command_tree;
        cmd.setId(command_id);
      } else {
        for (const tree_key of Object.keys(current_command_tree)) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          traverseCommandTreeRecursively(command_id, current_command_tree[tree_key]);
        }
      }
    }

    for (const command of Object.keys(this.command_tree)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      traverseCommandTreeRecursively(command_names_to_ids[command], this.command_tree[command]);
    }
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
  private id: string | undefined;

  public constructor(data: Record<string, any>, executeFunction: CallableFunction, fullCommandName: string[]) {
    this.data = data;
    this.onExecute = executeFunction;
    this.fullCommandName = fullCommandName;
    this.id = undefined;
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

  public static fromFile(filePath: string): CookieCommand | undefined {
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
      // TODO: uncomment once user ttls are implemented !
      // CookieLogger.error(`Could not create CookieCommand from file ${filePath}:`, String(err));
      return undefined;
    }
  }

  public setId(id: string) {
    this.id = id;
  }

  public getMention(): string {
    if (this.id === undefined) {
      return '`/' + this.getFullCommandName() + '`';
    }
    return `</${this.getFullCommandName()}:${this.id}>`;
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

interface CookieConfirmationResult {
  confirmed: boolean;
  cancelled: boolean;
  timedOut: boolean;
}

export class CookieConfirmationMenu {
  private response: ButtonInteraction | undefined;
  private result: CookieConfirmationResult;
  private promptPrefix: string;
  private promptMessage: string;
  private successPrefix: string;
  private successMessage: string;
  private cancelPrefix: string;
  private cancelMessage: string;
  private timeoutPrefix: string;
  private timeoutMessage: string;

  public constructor(public command: CookieCommand, public interaction: ChatInputCommandInteraction) {
    this.command = command;
    this.interaction = interaction;
    this.response = undefined;
    this.result = { confirmed: false, cancelled: false, timedOut: false };
    this.promptPrefix = '૮  . .  ྀིა';
    this.promptMessage = 'Are you sure you would like to proceed?';
    this.successPrefix = '(⸝⸝• ω •⸝⸝) ♡';
    this.successMessage = `${command.getMention()} was confirmed.\n*It may take a moment for changes to take place.*`;
    this.cancelPrefix = '(￣^￣ゞ';
    this.cancelMessage = `${command.getMention()} was cancelled.\n*No changes were made.*`;
    this.timeoutPrefix = '( •́ ∧ •̀ )';
    this.timeoutMessage = `${command.getMention()} did not receive user confirmation in time.\n*No changes were made.*`;
  }

  public setPromptPrefix(prefix: string) {
    this.promptPrefix = prefix;
    return this;
  }

  public setPromptMessage(message: string) {
    this.promptMessage = message;
    return this;
  }

  public setSuccessPrefix(prefix: string) {
    this.successPrefix = prefix;
    return this;
  }

  public setSuccessMessage(message: string) {
    this.successMessage = message;
    return this;
  }

  public setCancelPrefix(prefix: string) {
    this.cancelPrefix = prefix;
    return this;
  }

  public setCancelMessage(message: string) {
    this.cancelMessage = message;
    return this;
  }

  public setTimeoutPrefix(prefix: string) {
    this.timeoutPrefix = prefix;
    return this;
  }

  public setTimeoutMessage(message: string) {
    this.timeoutMessage = message;
    return this;
  }

  public isConfirmed(): boolean {
    return this.result.confirmed;
  }

  public isCancelled(): boolean {
    return this.result.cancelled;
  }

  public isTimedOut(): boolean {
    return this.result.timedOut;
  }

  public async prompt(): Promise<this> {
    const confirm = new ButtonBuilder().setCustomId('confirm').setLabel('Confirm').setStyle(ButtonStyle.Success);

    const cancel = new ButtonBuilder().setCustomId('cancel').setLabel('Cancel').setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(confirm, cancel);

    const promise = await this.interaction.reply({
      embeds: [
        {
          description: this.promptPrefix + (this.promptPrefix ? ' ' : '') + this.promptMessage,
        },
      ],
      components: [row],
      ephemeral: true,
    });

    const collectorFilter = (i: { user: { id: string } }) => i.user.id === this.interaction.user.id;

    try {
      const confirmation = await promise.awaitMessageComponent({ filter: collectorFilter, time: 60_000 });
      assert(confirmation instanceof ButtonInteraction);
      this.response = confirmation;
      if (confirmation.customId === 'confirm') {
        this.result.confirmed = true;
      } else if (confirmation.customId === 'cancel') {
        this.result.cancelled = true;
      }
    } catch (e) {
      this.result.timedOut = true;
    }
    return this;
  }

  public async update() {
    if (this.isConfirmed()) {
      await this.response!.update({
        embeds: [
          {
            description: this.successPrefix + (this.successPrefix ? ' ' : '') + this.successMessage,
          },
        ],
        components: [],
      });
    } else if (this.isCancelled()) {
      await this.response!.update({
        embeds: [
          {
            description: this.cancelPrefix + (this.cancelPrefix ? ' ' : '') + this.cancelMessage,
          },
        ],
        components: [],
      });
    } else if (this.isTimedOut()) {
      await this.interaction.editReply({
        embeds: [
          {
            description: this.timeoutPrefix + (this.timeoutPrefix ? ' ' : '') + this.timeoutMessage,
          },
        ],
        components: [],
      });
    }
  }

  public async error(message: string = '') {
    const errorMessage =
      `( ꩜ ᯅ ꩜;) An unexpected error occurred while executing ${this.command.getMention()}` +
      (message ? `:\n\n${message}` : '');
    if (this.response !== undefined) {
      await this.response.update({
        embeds: [
          {
            description: errorMessage,
          },
        ],
        components: [],
      });
    } else {
      await this.interaction.editReply({
        embeds: [
          {
            description: errorMessage,
          },
        ],
        components: [],
      });
    }
  }

  public async promptAndUpdate(): Promise<this> {
    await this.prompt();
    await this.update();
    return this;
  }
}

/**
 * A console logs wrapper for cookie.ts-related logs.
 * cookie.ts uses it's own simple logger so that it can be used in other projects without a logger dependency.
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
    args.unshift('\x1b[0m[\x1b[34mcookie.ts\x1b[0m] [\x1b[90mDEBUG\x1b[0m]\x1b[90m');
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
    args.unshift('\x1b[0m[\x1b[34mcookie.ts\x1b[0m] [\x1b[32mINFO\x1b[0m]\x1b[37m');
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
    args.unshift('\x1b[0m[\x1b[34mcookie.ts\x1b[0m] [\x1b[31mERROR\x1b[0m]\x1b[93m');
    args.push('\x1b[0m');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    console.error(...args);
  }
}
