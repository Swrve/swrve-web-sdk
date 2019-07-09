import DateHelper from '../helpers/DateHelper';

/**
 * It returns the current time in millis from current client timezone
 */
export function nowInUtcTime() {
  return DateHelper.dateToUTCDate(new Date()).getTime();
}
