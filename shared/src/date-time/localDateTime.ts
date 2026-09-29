import { differenceInMinutes } from 'date-fns/differenceInMinutes';
import { format } from 'date-fns/format';
import { isValid } from 'date-fns/isValid';
import { parse } from 'date-fns/parse';

export const DATE_FORMAT = 'yyyy-MM-dd';
export const TIME_FORMAT = 'HH:mm';

export function displayTime(time: string): string {
  return format(parse(time, TIME_FORMAT, new Date()), 'h:mm a');
}

export function formatHours(hours: number): string {
  return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
}

export function parseDateTime(date: string, time: string): Date {
  return parse(`${date} ${time}`, `${DATE_FORMAT} ${TIME_FORMAT}`, new Date());
}

export function hoursBetween(startTime: string, endTime: string): number {
  const referenceDate = new Date();
  return (
    differenceInMinutes(
      parse(endTime, TIME_FORMAT, referenceDate),
      parse(startTime, TIME_FORMAT, referenceDate),
    ) / 60
  );
}

export function matchesFormat(value: string, formatString: string): boolean {
  const parsed = parse(value, formatString, new Date());
  return isValid(parsed) && format(parsed, formatString) === value;
}

export function getDeviceTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
