import { describe, expect, it } from 'vitest';
import { ANIMAL_TYPES, BOOKING_RULES } from '../domain/bookingDomain';
import { mockDatabase } from './mockDatabase';

// Guards the seed data, so the apps and E2E tests can rely on it staying valid.
describe('mockDatabase seed', () => {
  const { customers, pets, bookings } = mockDatabase;

  it('has exactly 2 pets of each animal type', () => {
    for (const animalType of ANIMAL_TYPES) {
      expect(pets.filter((pet) => pet.animalType === animalType)).toHaveLength(2);
    }
  });

  it('only references customers and pets that exist, and each booking matches its pet owner', () => {
    const customerIds = new Set(customers.map((customer) => customer.id));
    const petsById = new Map(pets.map((pet) => [pet.id, pet]));

    for (const pet of pets) {
      expect(customerIds.has(pet.customerId)).toBe(true);
    }
    for (const booking of bookings) {
      expect(petsById.get(booking.petId)?.customerId).toBe(booking.customerId);
    }
  });

  it('books whole hours within the allowed range', () => {
    for (const { hoursRequested } of bookings) {
      expect(Number.isInteger(hoursRequested)).toBe(true);
      expect(hoursRequested).toBeGreaterThanOrEqual(BOOKING_RULES.minHours);
      expect(hoursRequested).toBeLessThanOrEqual(BOOKING_RULES.maxHours);
    }
  });

  it('never books a pet for more than the daily limit (cancelled bookings excluded)', () => {
    const hoursByPetAndDate = new Map<string, number>();
    for (const booking of bookings) {
      if (booking.status === 'cancelled') continue;
      const key = `${booking.petId} on ${booking.serviceDate}`;
      hoursByPetAndDate.set(key, (hoursByPetAndDate.get(key) ?? 0) + booking.hoursRequested);
    }

    for (const hours of hoursByPetAndDate.values()) {
      expect(hours).toBeLessThanOrEqual(BOOKING_RULES.maxHoursPerPetPerDay);
    }
  });

  it('includes the same-day scenario: 2 dogs, 3 two-hour bookings on one date', () => {
    const dogIds = pets.filter((pet) => pet.animalType === 'dog').map((pet) => pet.id);
    const dogBookings = bookings.filter(
      (booking) => dogIds.includes(booking.petId) && booking.serviceDate === '2026-10-03',
    );

    expect(dogBookings).toHaveLength(3);
    expect(dogBookings.every((booking) => booking.hoursRequested === 2)).toBe(true);
  });
});
