import { addMinutes } from 'date-fns/addMinutes';
import { format } from 'date-fns/format';
import { isAfter } from 'date-fns/isAfter';
import { isBefore } from 'date-fns/isBefore';
import { parse } from 'date-fns/parse';
import { hoursBetween, parseDateTime, TIME_FORMAT } from '../date-time/localDateTime';
import { BOOKING_RULES } from '../domain/bookingDomain';

/**
 * The choices the start-to-end time picker offers, on web and mobile alike. Only bookable lengths
 * are listed, so the user can't pick one outside the 2 to 8 hour limits.
 */

const { minHours, maxHours, serviceHours, timeStepMinutes } = BOOKING_RULES;

const toTime = (time: string) => parse(time, TIME_FORMAT, new Date());

/** Times every half hour from `first` to `last`, both included. */
function timesBetween(first: Date, last: Date): string[] {
  const options: string[] = [];
  for (let time = first; !isAfter(time, last); time = addMinutes(time, timeStepMinutes)) {
    options.push(format(time, TIME_FORMAT));
  }
  return options;
}

/** Every half hour from opening until the last start that still fits the minimum before closing. */
export function startTimeOptions(): string[] {
  return timesBetween(
    toTime(serviceHours.start),
    addMinutes(toTime(serviceHours.end), -minHours * 60),
  );
}

/** Every half hour from 2 to 8 hours after the start, stopping at closing. */
export function endTimeOptions(startTime: string): string[] {
  if (!startTime) return [];
  const start = toTime(startTime);
  const closing = toTime(serviceHours.end); // same day as `start`, so they compare correctly
  // Compared as Dates: as 'HH:mm' strings, 18:00 + 8 hours would wrap around to '02:00'.
  const latest = addMinutes(start, maxHours * 60);
  return timesBetween(
    addMinutes(start, minHours * 60),
    isAfter(latest, closing) ? closing : latest,
  );
}

/**
 * The end time to keep when the start changes: the same number of hours if they still fit before
 * closing, otherwise '' so the user picks again.
 */
export function endTimeForNewStart(
  previous: { startTime: string; endTime: string },
  newStart: string,
): string {
  const hours = hoursBetween(previous.startTime, previous.endTime);
  if (!(hours > 0)) return '';
  const kept = format(addMinutes(toTime(newStart), hours * 60), TIME_FORMAT);
  return endTimeOptions(newStart).includes(kept) ? kept : '';
}

/** On today's date, true for a start time that has already passed ('' date: nothing has). */
export function hasStartPassed(serviceDate: string, startTime: string): boolean {
  return serviceDate !== '' && isBefore(parseDateTime(serviceDate, startTime), new Date());
}
