/**
 * A console logs wrapper for prettier logs.
 * Console colour codes source: https://ss64.com/nt/syntax-ansi.html
 */
class Logger {
  private enabled: string[];
  private disabled: string[];
  // Defaults
  private DEBUG_LOGGING = false;
  private INFO_LOGGING = true;
  private ERROR_LOGGING = true;

  public constructor() {
    this.enabled = [];
    this.disabled = [];
    this.processLoggingEnvs(['DEBUG_LOGGING', 'INFO_LOGGING', 'ERROR_LOGGING']);
  }

  public printStartupMessage() {
    const getLogString = (logging_types: string[]) => {
      let log_string = '';
      switch (logging_types.length) {
        case 1:
          log_string += logging_types[0];
          break;
        case 2:
          log_string += logging_types[0] + ' and ' + logging_types[1];
          break;
        default:
          for (let i = 0; i < logging_types.length; i++) {
            if (i === logging_types.length - 1) {
              log_string += 'and ' + logging_types[i];
            } else {
              log_string += logging_types[i] + ', ';
            }
          }
          break;
      }
      log_string += ' logging ' + (logging_types.length > 1 ? 'have' : 'has');
      return log_string;
    };
    if (this.enabled.length > 0) {
      console.log('\x1b[32m' + getLogString(this.enabled) + ' been explicitly enabled via the .env\x1b[0m');
      console.log('');
    }
    if (this.disabled.length > 0) {
      console.log('\x1b[31m' + getLogString(this.disabled) + ' been explicitly disabled via the .env\x1b[0m');
      console.log('');
    }
  }

  /**
   * Startup helper function to process .env variables for logging
   * @param variable The name of the logging variable to process
   */
  private processLoggingEnvs(variables: string[]) {
    for (const variable of variables) {
      if ((this as any)[variable] === undefined) {
        console.log('Logger does not have a variable called ' + variable);
        process.exit(1);
      }
      const value = process.env[variable]?.toLocaleLowerCase();
      if (value !== undefined) {
        const logging_type = variable.split('_')[0];
        if (value === 'false') {
          (this as any)[variable] = false;
          this.disabled.push(logging_type);
        } else if (value === 'true') {
          (this as any)[variable] = true;
          this.enabled.push(logging_type);
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
  }

  public debug(...args: any[]) {
    if (!this.DEBUG_LOGGING) {
      return;
    }
    args.unshift('[\x1b[90mDEBUG\x1b[0m]\x1b[90m');
    args.push('\x1b[0m');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    console.debug(...args);
  }

  public info(...args: any[]) {
    if (!this.INFO_LOGGING) {
      return;
    }
    args.unshift('[\x1b[32mINFO\x1b[0m]\x1b[37m');
    args.push('\x1b[0m');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    console.info(...args);
  }

  public error(...args: any[]) {
    if (!this.ERROR_LOGGING) {
      return;
    }
    args.unshift('[\x1b[31mERROR\x1b[0m]\x1b[93m');
    args.push('\x1b[0m');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    console.error(...args);
  }
}

const logger = new Logger();

export function printStartupMessage() {
  logger.printStartupMessage();
}

export function debug(...args: any[]) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  logger.debug(...args);
}

export function info(...args: any[]) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  logger.info(...args);
}

export function error(...args: any[]) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  logger.error(...args);
}
