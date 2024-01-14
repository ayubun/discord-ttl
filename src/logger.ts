import assert from "assert";
import figlet from "figlet";


/**
 * A Discord TTL console logs wrapper for prettier logs.
 * Console colour codes source: https://ss64.com/nt/syntax-ansi.html
 */
export class Logger {

  // Defaults
  private static DEBUG_LOGGING = false;
  private static INFO_LOGGING = true;
  private static ERROR_LOGGING = true;

  /**
   * Startup helper function to process .env variables for logging
   * @param variable The name of the logging variable to process
   */
  private static processLoggingEnv(variable: string) {
    assert((this as any)[variable] !== undefined, 'Logger does not have a variable called ' + variable);
    const value = process.env[variable]?.toLocaleLowerCase();
    if (value !== undefined) {
      const logging_type = variable.split('_')[0];
      if (value === 'false') {
        console.log('\x1b[31m' + logging_type + ' logging has been explicitly disabled via the .env\x1b[0m');
        (this as any)[variable] = false;
      } else if (value === 'true') {
        console.log('\x1b[32m' + logging_type + ' logging has been explicitly enabled via the .env\x1b[0m');
        (this as any)[variable] = true;
      } else {
        console.log('\x1b[32mInvalid value for variable "' + variable + '" in the .env (expected true or false, found ' + value + ')');
        process.exit(1);
      }
      console.log('');
    }
  }

  /**
   * Initiate the Logger singleton & print a startup message
   */
  public static startup() {
    console.log('\x1b[36m' + figlet.textSync('Discord TTL') + '\x1b[0m');
    console.log('\x1b[90m        https://github.com/ayubun/discord-ttl\x1b[0m');
    console.log('');
    this.processLoggingEnv('DEBUG_LOGGING');
    this.processLoggingEnv('INFO_LOGGING');
    this.processLoggingEnv('ERROR_LOGGING');
  }

  public static debug(...args: any[]) {
    if (!this.DEBUG_LOGGING) {
      return;
    }
    args.unshift('[\x1b[90mDEBUG\x1b[0m]\x1b[90m');
    args.push('\x1b[0m');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    console.debug(...args);
  }

  public static info(...args: any[]) {
    if (!this.INFO_LOGGING) {
      return;
    }
    args.unshift('[\x1b[32mINFO\x1b[0m]\x1b[37m');
    args.push('\x1b[0m');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    console.info(...args);
  }

  public static error(...args: any[]) {
    if (!this.ERROR_LOGGING) {
      return;
    }
    args.unshift('[\x1b[31mERROR\x1b[0m]\x1b[93m');
    args.push('\x1b[0m');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    console.error(...args);
  }
}
