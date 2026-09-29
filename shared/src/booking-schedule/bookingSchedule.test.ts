import { describe, expect, it } from 'vitest';
import type { BookingListItem } from '../mock-api/mockApi';
import { mockDatabase } from '../mock-database/mockDatabase';
import { dayEarningsCents, groupByStartTime } from './bookingSchedule';

function seedItems(serviceDate: string): BookingListItem[] {
  return mockDatabase.bookings
    .filter((booking) => booking.serviceDate === serviceDate)
    .map((booking) => ({
      booking,
      customer: mockDatabase.customers.find((customer) => customer.id === booking.customerId)!,
      pets: booking.petIds.map((petId) => mockDatabase.pets.find((pet) => pet.id === petId)!),
    }));
}

const summary = (items: BookingListItem[]) =>
  groupByStartTime(items).map((group) => [
    group.startTime,
    group.items.map((item) => item.pets.map((pet) => pet.name).join(' + ')),
  ]);

describe('groupByStartTime', () => {
  it('puts bookings that start at the same time together, earliest time first', () => {
    expect(summary(seedItems('2026-10-03'))).toEqual([
      ['09:00', ['Biscuit', 'Maple']],
      ['11:00', ['Biscuit']],
    ]);
  });

  it('sorts by start time whatever order the bookings come in', () => {
    expect(summary(seedItems('2026-10-10').reverse())).toEqual([
      ['08:00', ['Truffle']],
      ['10:00', ['Hamlet']],
      ['12:00', ['Hamlet']],
    ]);
  });

  it('keeps a booking with several pets as one item', () => {
    const [biscuit, maple] = seedItems('2026-10-03');
    const together: BookingListItem = {
      ...biscuit!,
      booking: { ...biscuit!.booking, id: 'bkg_100', startTime: '07:00', endTime: '09:00' },
      pets: [...biscuit!.pets, ...maple!.pets],
    };

    expect(summary([together])).toEqual([['07:00', ['Biscuit + Maple']]]);
  });

  it('returns no groups for a day without bookings', () => {
    expect(groupByStartTime([])).toEqual([]);
  });
});

describe('dayEarningsCents', () => {
  it("adds up the day's confirmed bookings", () => {
    expect(dayEarningsCents(groupByStartTime(seedItems('2026-10-03')))).toBe(12000);
  });

  it('leaves out cancelled bookings', () => {
    expect(dayEarningsCents(groupByStartTime(seedItems('2026-10-10')))).toBe(18000);
  });

  it('is zero for a day without bookings', () => {
    expect(dayEarningsCents([])).toBe(0);
  });
});
