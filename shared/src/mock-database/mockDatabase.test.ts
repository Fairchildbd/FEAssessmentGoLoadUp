import { addHours } from 'date-fns/addHours';
import { areIntervalsOverlapping } from 'date-fns/areIntervalsOverlapping';
import { format } from 'date-fns/format';
import { getMinutes } from 'date-fns/getMinutes';
import { isAfter } from 'date-fns/isAfter';
import { isBefore } from 'date-fns/isBefore';
import { describe, expect, it } from 'vitest';
import { DATE_FORMAT, matchesFormat, parseDateTime, TIME_FORMAT } from '../date-time/localDateTime';
import { ANIMAL_TYPES, BOOKING_RULES, type Booking } from '../domain/bookingDomain';
import { mockDatabase } from './mockDatabase';

/** A booking's time slot as a date-fns interval. */
const slotOf = (booking: Booking) => ({
  start: parseDateTime(booking.serviceDate, booking.startTime),
  end: parseDateTime(booking.serviceDate, booking.endTime),
});

// Guards the seed data, so the apps and E2E tests can rely on it staying valid.
describe('mockDatabase seed', () => {
  const { customers, pets, bookings } = mockDatabase;
  const confirmedBookings = bookings.filter((booking) => booking.status === 'confirmed');

  it('has exactly 2 pets of each animal type', () => {
    for (const animalType of ANIMAL_TYPES) {
      expect(pets.filter((pet) => pet.animalType === animalType)).toHaveLength(2);
    }
  });

  it('only references customers and pets that exist, and each booking matches its pet owner', () => {
    const customerIds = new Set(customers.map((customer) => customer.id));
    const petsById = new Map(pets.map((pet) => [pet.id, pet]));

    for (const pet of pets) {
      expect(customerIds.has(pet.customerId), pet.id).toBe(true);
    }
    for (const booking of bookings) {
      expect(petsById.get(booking.petId)?.customerId, booking.id).toBe(booking.customerId);
    }
  });

  it('books half-hour steps within the allowed range', () => {
    for (const { id, hoursRequested } of bookings) {
      expect((hoursRequested * 60) % BOOKING_RULES.timeStepMinutes, id).toBe(0);
      expect(hoursRequested, id).toBeGreaterThanOrEqual(BOOKING_RULES.minHours);
      expect(hoursRequested, id).toBeLessThanOrEqual(BOOKING_RULES.maxHours);
    }
  });

  it('schedules every booking inside service hours, starting on the hour or half hour', () => {
    const { serviceHours, timeStepMinutes } = BOOKING_RULES;

    for (const booking of bookings) {
      const { start, end } = slotOf(booking);
      const opening = parseDateTime(booking.serviceDate, serviceHours.start);
      const closing = parseDateTime(booking.serviceDate, serviceHours.end);

      expect(matchesFormat(booking.serviceDate, DATE_FORMAT), booking.id).toBe(true);
      expect(format(addHours(start, booking.hoursRequested), TIME_FORMAT), booking.id).toBe(
        booking.endTime,
      );
      expect(isBefore(start, opening) || isAfter(end, closing), booking.id).toBe(false);
      expect(getMinutes(start) % timeStepMinutes, booking.id).toBe(0);
      // Intl throws a RangeError for a time zone name it doesn't know.
      expect(() => new Intl.DateTimeFormat('en-US', { timeZone: booking.timeZone })).not.toThrow();
    }
  });

  it("never double-books a pet (cancelled bookings don't count)", () => {
    for (const booking of confirmedBookings) {
      const clashes = confirmedBookings.filter(
        (other) =>
          other.id !== booking.id &&
          other.petId === booking.petId &&
          areIntervalsOverlapping(slotOf(booking), slotOf(other)),
      );
      expect(clashes, booking.id).toEqual([]);
    }
  });

  it('includes the same-day scenario: 2 dogs, 3 two-hour bookings, one dog booked back-to-back', () => {
    const dogIds = pets.filter((pet) => pet.animalType === 'dog').map((pet) => pet.id);
    const dogBookings = bookings.filter(
      (booking) => dogIds.includes(booking.petId) && booking.serviceDate === '2026-10-03',
    );
    expect(dogBookings).toHaveLength(3);
    expect(dogBookings.every((booking) => booking.hoursRequested === 2)).toBe(true);

    const [firstVisit, secondVisit] = dogBookings.filter((booking) => booking.petId === 'pet_002');
    expect(secondVisit?.startTime).toBe(firstVisit?.endTime);
  });

  it('includes a booking in a time slot freed by a cancellation', () => {
    const cancelledBookings = bookings.filter((booking) => booking.status === 'cancelled');
    const rebooked = confirmedBookings.filter((booking) =>
      cancelledBookings.some(
        (cancelled) =>
          cancelled.petId === booking.petId &&
          areIntervalsOverlapping(slotOf(cancelled), slotOf(booking)),
      ),
    );

    expect(rebooked).not.toEqual([]);
  });
});
