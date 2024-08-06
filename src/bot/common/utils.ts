import { FOREVER_TTL, type ServerChannelSettings, type ServerSettings } from '../../common/settingsTypes';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const prettySeconds = require('pretty-seconds');

export const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export const isResetString = (input: string | undefined): boolean => {
  switch (input) {
    case 'default':
    case 'reset':
      return true;
  }
  return false;
};

export const isForeverTtlString = (duration: number | string | undefined): boolean => {
  if (duration === undefined) {
    return false;
  }
  if (typeof duration === 'number') {
    return duration <= 0 || duration === FOREVER_TTL;
  }
  switch (duration) {
    case 'forever':
    case '0':
    case '-1':
    case 'none':
    case 'no':
    case 'unset':
    case 'null':
    case 'off':
    case 'disable':
    case 'disabled':
    case String(FOREVER_TTL):
      return true;
  }
  return false;
};

/**
 * Gets the seconds that a given duration string represents.
 * For example, the duration string `1h 30min 10s` would return `5410`.
 * If the string does not have any parsable durations, this function returns `undefined`.
 */
export const getSecondsFromTimeString = (duration: string): number | undefined => {
  duration = duration
    .toLowerCase()
    .replaceAll(/(and|,)/g, '')
    .replaceAll(/\s/g, '');
  const secondsPerUnit = (unit: string): number | undefined => {
    switch (unit) {
      case 'seconds':
      case 'second':
      case 'secs':
      case 'sec':
      case 's':
        return 1;
      case 'minutes':
      case 'minute':
      case 'mins':
      case 'min':
      case 'm':
        return 60;
      case 'hours':
      case 'hour':
      case 'hrs':
      case 'hr':
      case 'h':
        return 3600;
      case 'days':
      case 'day':
      case 'd':
        return 86400;
      case 'weeks':
      case 'week':
      case 'w':
        return 604800;
      case 'months':
      case 'month':
        return 2592000;
    }
    return undefined;
  };

  const splitString = (input: string): string[] => {
    return input.split(/(?<=\D)(?=\d)/g);
  };

  let seconds = 0;
  splitString(duration).forEach((part: string) => {
    if (part === null || part === undefined) {
      return;
    }
    const unitMatcher = part.match(/[a-zA-Z]+/g);
    const numberMatcher = part.match(/[0-9]+/g);
    if (!unitMatcher || !numberMatcher) {
      return;
    }
    const unit = unitMatcher[0];
    const number = numberMatcher[0];
    const val = secondsPerUnit(unit);
    if (val) {
      seconds += parseInt(number, 10) * val;
    }
  });
  if (seconds === 0) {
    return undefined;
  }
  return seconds;
};

function getTtlDisplayString(friendlyTtl: number | undefined, rawTtl: number | undefined | null): string {
  let str = '';
  if (friendlyTtl === undefined) {
    str += '`Forever`';
  } else {
    str += '**' + String(prettySeconds(friendlyTtl)) + '**';
  }
  if (rawTtl === undefined || rawTtl === null) {
    str += ' (*default*)';
  }
  return str;
}
function getBooleanDisplayString(friendlyBoolean: boolean, rawBoolean: boolean | undefined | null): string {
  let str = '`' + String(friendlyBoolean) + '`';
  if (rawBoolean === undefined || rawBoolean === null) {
    str += ' (*default*)';
  }
  return str;
}

export const getServerSettingsDisplay = (
  settings: ServerSettings | ServerChannelSettings,
  header = '### __Current Settings__',
): string => {
  let display = header + '\n';
  display += '- __TTL__: ' + getTtlDisplayString(settings.getMessageTtl(), settings.defaultMessageTtl) + '\n';
  // TODO: uncomment when user TTLs are implemented~
  // display += `  - __User Minimum__: ${getTtlDisplayString(settings.getMinMessageTtl(), settings.minMessageTtl)}\n`;
  // display += `  - __User Maximum__: ${getTtlDisplayString(settings.getMaxMessageTtl(), settings.maxMessageTtl)}\n`;
  display += `- __Include Pins By Default__: ${getBooleanDisplayString(
    settings.getIncludePins(),
    settings.includePins,
  )}\n`;
  return display;
};

export const getServerSettingsDiff = (
  oldSettings: ServerSettings | ServerChannelSettings,
  newSettings: ServerSettings | ServerChannelSettings,
  header = '### __Settings Changes__',
): string => {
  let diff = header + '\n';
  if (oldSettings === newSettings) {
    return diff + 'No changes are being made\n';
  }
  if (oldSettings.defaultMessageTtl !== newSettings.defaultMessageTtl) {
    diff += `- __Default TTL__: ${getTtlDisplayString(
      oldSettings.getMessageTtl(),
      oldSettings.defaultMessageTtl,
    )} **→** ${getTtlDisplayString(newSettings.getMessageTtl(), newSettings.defaultMessageTtl)}\n`;
  }
  if (oldSettings.minMessageTtl !== newSettings.minMessageTtl) {
    diff += `- __User TTL Mininum__: ${getTtlDisplayString(
      oldSettings.getMinMessageTtl(),
      oldSettings.minMessageTtl,
    )} **→** ${getTtlDisplayString(oldSettings.getMinMessageTtl(), newSettings.minMessageTtl)}\n`;
  }
  if (oldSettings.maxMessageTtl !== newSettings.maxMessageTtl) {
    diff += `- __User TTL Maximum__: ${getTtlDisplayString(
      oldSettings.getMaxMessageTtl(),
      oldSettings.maxMessageTtl,
    )} **→** ${getTtlDisplayString(oldSettings.getMaxMessageTtl(), newSettings.maxMessageTtl)}\n`;
  }
  if (oldSettings.includePins !== newSettings.includePins) {
    diff += `- __Include Pins By Default__: ${getBooleanDisplayString(
      oldSettings.getIncludePins(),
      oldSettings.includePins,
    )} **→** ${getBooleanDisplayString(oldSettings.getIncludePins(), newSettings.includePins)}\n`;
  }
  return diff;
};
