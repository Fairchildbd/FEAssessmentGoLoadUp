import { useCallback, useEffect, useState } from 'react';
import { listBookings, type BookingListItem } from '../mock-api/mockApi';

export interface StartTimeGroup {
  startTime: string;
  items: BookingListItem[];
}

const compareHHmmTimes = (a: string, b: string) => a.localeCompare(b);

const firstPetName = (item: BookingListItem) => item.pets[0]?.name ?? '';

function compareForStableSchedule(a: BookingListItem, b: BookingListItem): number {
  return (
    compareHHmmTimes(a.booking.startTime, b.booking.startTime) ||
    compareHHmmTimes(a.booking.endTime, b.booking.endTime) ||
    a.customer.lastName.localeCompare(b.customer.lastName) ||
    firstPetName(a).localeCompare(firstPetName(b))
  );
}

export function groupByStartTime(items: readonly BookingListItem[]): StartTimeGroup[] {
  const groups: StartTimeGroup[] = [];
  for (const item of [...items].sort(compareForStableSchedule)) {
    const lastGroup = groups.at(-1);
    if (lastGroup?.startTime === item.booking.startTime) lastGroup.items.push(item);
    else groups.push({ startTime: item.booking.startTime, items: [item] });
  }
  return groups;
}

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

export function useDaySchedule(serviceDate: string): { schedule: DaySchedule; reload: () => void } {
  const [reloadCount, setReloadCount] = useState(0);
  const requestKey = `${serviceDate}#${reloadCount}`;
  const [answerForRequest, setAnswerForRequest] = useState<{
    key: string;
    schedule: DaySchedule;
  } | null>(null);

  useEffect(() => {
    let userStillWantsThisDate = true;
    const answer = (schedule: DaySchedule) => {
      if (userStillWantsThisDate) setAnswerForRequest({ key: requestKey, schedule });
    };
    listBookings(serviceDate).then(
      (items) => answer({ status: 'loaded', groups: groupByStartTime(items) }),
      () => answer({ status: 'error', message: "Couldn't load the bookings" }),
    );
    return () => {
      userStillWantsThisDate = false;
    };
  }, [serviceDate, requestKey]);

  const reload = useCallback(() => setReloadCount((count) => count + 1), []);
  const schedule: DaySchedule =
    answerForRequest?.key === requestKey ? answerForRequest.schedule : { status: 'loading' };
  return { schedule, reload };
}
