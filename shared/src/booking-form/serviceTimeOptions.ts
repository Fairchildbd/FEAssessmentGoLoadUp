import { addMinutes } from 'date-fns/addMinutes';
import { format } from 'date-fns/format';
import { isAfter } from 'date-fns/isAfter';
import { isBefore } from 'date-fns/isBefore';
import { parse } from 'date-fns/parse';
import { hoursBetween, parseDateTime, TIME_FORMAT } from '../date-time/localDateTime';
import { BOOKING_RULES } from '../domain/bookingDomain';

const { minHours, maxHours, serviceHours, timeStepMinutes } = BOOKING_RULES;

const toTime = (time: string) => parse(time, TIME_FORMAT, new Date());

function timesBetween(first: Date, last: Date): string[] {
  const options: string[] = [];
  for (let time = first; !isAfter(time, last); time = addMinutes(time, timeStepMinutes)) {
    options.push(format(time, TIME_FORMAT));
  }
  return options;
}

export function startTimeOptions(): string[] {
  return timesBetween(
    toTime(serviceHours.start),
    addMinutes(toTime(serviceHours.end), -minHours * 60),
  );
}

export function endTimeOptions(startTime: string): string[] {
  if (!startTime) return [];
  const start = toTime(startTime);
  const closingOnSameDay = toTime(serviceHours.end);
  const earliestEnd = addMinutes(start, minHours * 60);
  const endAtMaxLengthAsDate = addMinutes(start, maxHours * 60);
  const latestEnd = isAfter(endAtMaxLengthAsDate, closingOnSameDay)
    ? closingOnSameDay
    : endAtMaxLengthAsDate;
  return timesBetween(earliestEnd, latestEnd);
}

export function endTimeForNewStart(
  previous: { startTime: string; endTime: string },
  newStart: string,
): string {
  const hours = hoursBetween(previous.startTime, previous.endTime);
  if (!(hours > 0)) return '';
  const kept = format(addMinutes(toTime(newStart), hours * 60), TIME_FORMAT);
  return endTimeOptions(newStart).includes(kept) ? kept : '';
}

export function hasStartPassed(serviceDate: string, startTime: string): boolean {
  return serviceDate !== '' && isBefore(parseDateTime(serviceDate, startTime), new Date());
}
