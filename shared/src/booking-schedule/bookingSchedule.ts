import { useCallback, useEffect, useState } from 'react';
import { listBookings, type BookingListItem } from '../mock-api/mockApi';

/**
 * The admin schedule: one day's bookings, grouped by start time. Pure grouping plus a loading hook,
 * so web and mobile show the same schedule.
 */

/** Every booking (appointment) that starts at one time, e.g. the three that start at 07:00. */
export interface StartTimeGroup {
  /** 'HH:mm' */
  startTime: string;
  items: BookingListItem[];
}

/**
 * Groups a day's bookings by start time, earliest first. Inside a group, bookings are ordered by
 * end time, then customer and first pet's name, so the list doesn't reshuffle between loads.
 */
export function groupByStartTime(items: readonly BookingListItem[]): StartTimeGroup[] {
  const sorted = [...items].sort(
    (a, b) =>
      // 'HH:mm' strings sort in time order.
      a.booking.startTime.localeCompare(b.booking.startTime) ||
      a.booking.endTime.localeCompare(b.booking.endTime) ||
      a.customer.lastName.localeCompare(b.customer.lastName) ||
      (a.pets[0]?.name ?? '').localeCompare(b.pets[0]?.name ?? ''),
  );

  const groups: StartTimeGroup[] = [];
  for (const item of sorted) {
    const current = groups.at(-1);
    if (current?.startTime === item.booking.startTime) current.items.push(item);
    else groups.push({ startTime: item.booking.startTime, items: [item] });
  }
  return groups;
}

/** What a day earns: every confirmed booking's total, in cents. Cancelled bookings earn nothing. */
export function dayEarningsCents(groups: readonly StartTimeGroup[]): number {
  return groups
    .flatMap((group) => group.items)
    .filter(({ booking }) => booking.status === 'confirmed')
    .reduce((sum, { booking }) => sum + booking.price.totalCents, 0);
}

export type DaySchedule =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'loaded'; groups: StartTimeGroup[] };

/** Loads the bookings for a date ('YYYY-MM-DD') from the mock API, and reloads when it changes. */
export function useDaySchedule(serviceDate: string): { schedule: DaySchedule; reload: () => void } {
  const [attempt, setAttempt] = useState(0);
  // Each result remembers which request it answers, so a new date shows as loading until its own
  // answer arrives. The cleanup ignores a slow answer for a date the user has already left.
  const requestKey = `${serviceDate}#${attempt}`;
  const [result, setResult] = useState<{ key: string; schedule: DaySchedule } | null>(null);

  useEffect(() => {
    let current = true;
    const answer = (schedule: DaySchedule) => {
      if (current) setResult({ key: requestKey, schedule });
    };
    listBookings(serviceDate).then(
      (items) => answer({ status: 'loaded', groups: groupByStartTime(items) }),
      () => answer({ status: 'error', message: "Couldn't load the bookings" }),
    );
    return () => {
      current = false;
    };
  }, [serviceDate, requestKey]);

  const reload = useCallback(() => setAttempt((count) => count + 1), []);
  const schedule: DaySchedule =
    result?.key === requestKey ? result.schedule : { status: 'loading' };
  return { schedule, reload };
}
