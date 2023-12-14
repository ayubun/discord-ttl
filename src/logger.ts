/**
 * A console logs wrapper discord-ttl logs
 */
export class Logger {
  // I got the colour codes from here: https://ss64.com/nt/syntax-ansi.html
  private static DEBUG_LOGGING = true;
  private static INFO_LOGGING = true;

  // I got the colour codes from here: https://ss64.com/nt/syntax-ansi.html

  public static debug(...args: any[]) {
    if (!Logger.DEBUG_LOGGING) {
      return;
    }
    args.unshift('[\x1b[90mDEBUG\x1b[0m]\x1b[90m');
    args.push('\x1b[0m');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    console.debug(...args);
  }

  public static info(...args: any[]) {
    if (!Logger.INFO_LOGGING) {
      return;
    }
    args.unshift('[\x1b[32mINFO\x1b[0m]\x1b[37m');
    args.push('\x1b[0m');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    console.info(...args);
  }

  public static error(...args: any[]) {
    args.unshift('[\x1b[31mERROR\x1b[0m]\x1b[93m');
    args.push('\x1b[0m');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    console.error(...args);
  }
}
