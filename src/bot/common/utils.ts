export const isForeverTtl = (duration: string): boolean => {
  switch (duration) {
    case 'forever':
    case 'disable':
    case 'disabled':
    case 'off':
    case 'none':
    case '0':
    case '-1':
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
