import { differenceInMinutes } from 'date-fns/differenceInMinutes';
import { format } from 'date-fns/format';
import { isValid } from 'date-fns/isValid';
import { parse } from 'date-fns/parse';

/**
 * How bookings store dates and times: local wall-clock strings such as '2026-10-03' and '09:30',
 * written as date-fns format tokens. date-fns does the parsing, formatting and date math everywhere
 * else, e.g. format(pickedDate, DATE_FORMAT) for a date picker's value.
 *
 * Import each date-fns function from its own path ('date-fns/format', not 'date-fns'). Metro
 * doesn't tree-shake, so importing from 'date-fns' would put the whole library in the mobile bundle.
 *
 * Never read these strings with `new Date('2026-10-03')`, which treats them as UTC midnight: the
 * previous evening in US time zones. date-fns `parse` reads them as local time.
 */
export const DATE_FORMAT = 'yyyy-MM-dd';
export const TIME_FORMAT = 'HH:mm';

/** A stored 'HH:mm' time as people read it: displayTime('17:00') is '5:00 PM'. */
export function displayTime(time: string): string {
  return format(parse(time, TIME_FORMAT, new Date()), 'h:mm a');
}

/** A booking's local date and time as a Date, e.g. parseDateTime('2026-10-03', '09:30'). */
export function parseDateTime(date: string, time: string): Date {
  return parse(`${date} ${time}`, `${DATE_FORMAT} ${TIME_FORMAT}`, new Date());
}

/**
 * Hours from one 'HH:mm' time to a later one on the same day, e.g. hoursBetween('09:00', '17:00')
 * is 8. Half hours come back as fractions (2.5), and an invalid time as NaN.
 */
export function hoursBetween(startTime: string, endTime: string): number {
  const referenceDate = new Date();
  return (
    differenceInMinutes(
      parse(endTime, TIME_FORMAT, referenceDate),
      parse(startTime, TIME_FORMAT, referenceDate),
    ) / 60
  );
}

/**
 * True if `value` is a real date or time written exactly in `formatString`. date-fns `isMatch` is
 * lenient (it accepts '9:30' for 'HH:mm'), so the parsed value must also format back unchanged.
 */
export function matchesFormat(value: string, formatString: string): boolean {
  const parsed = parse(value, formatString, new Date());
  return isValid(parsed) && format(parsed, formatString) === value;
}

/**
 * The device's IANA time zone, such as 'America/New_York'. date-fns has no function for this (its
 * @date-fns/tz package calculates in a time zone you pass in), so it comes from Intl.
 */
export function getDeviceTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
