import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BookingRequest } from '../booking-form/bookingFormSchema';
import {
  createBooking,
  getPricingRules,
  listBookings,
  MockApiError,
  resetMockApi,
} from './mockApi';

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 1, 12, 0));
  resetMockApi({ latencyMs: 0 });
});

afterEach(() => {
  vi.useRealTimers();
});

const request: BookingRequest = {
  firstName: 'Jordan',
  lastName: 'Rivera',
  pets: [
    { name: 'Oscar', animalType: 'dog' },
    { name: 'Sulley', animalType: 'dog' },
  ],
  serviceDate: '2026-10-03',
  serviceTime: { startTime: '07:00', endTime: '09:00' },
};

describe('createBooking', () => {
  it('saves one submission as one booking with all its pets, which listBookings then returns', async () => {
    const before = await listBookings('2026-10-03');
    const booking = await createBooking(request, 'America/New_York');

    expect(booking).toMatchObject({ id: 'bkg_010', petIds: ['pet_007', 'pet_008'] });
    const after = await listBookings('2026-10-03');
    expect(after).toHaveLength(before.length + 1);
    const saved = after.find((item) => item.booking.id === 'bkg_010');
    expect(saved?.pets.map((pet) => pet.name)).toEqual(['Oscar', 'Sulley']);
    expect(saved?.booking.timeZone).toBe('America/New_York');
  });

  it('itemizes the price: the base charge once, then each pet', async () => {
    const { price } = await createBooking(request, 'America/New_York');

    expect(price).toEqual({
      currency: 'USD',
      baseChargeCents: 2000,
      hours: 2,
      pets: [
        { petId: 'pet_007', hourlyRateCents: 1000, subtotalCents: 2000 },
        { petId: 'pet_008', hourlyRateCents: 1000, subtotalCents: 2000 },
      ],
      totalCents: 6000,
    });
  });

  it('reuses an existing customer and pet, matching names without case', async () => {
    const booking = await createBooking(
      { ...request, firstName: 'jordan', pets: [{ name: 'BISCUIT', animalType: 'dog' }] },
      'America/New_York',
    );

    expect(booking).toMatchObject({ customerId: 'cus_002', petIds: ['pet_002'] });
  });

  it("refuses a time that overlaps one of the pet's confirmed bookings", async () => {
    const biscuit: BookingRequest = { ...request, pets: [{ name: 'Biscuit', animalType: 'dog' }] };

    await expect(
      createBooking(
        { ...biscuit, serviceTime: { startTime: '10:00', endTime: '12:00' } },
        'America/New_York',
      ),
    ).rejects.toThrow(
      new MockApiError('Biscuit already has a booking from 9:00 AM to 11:00 AM that day'),
    );
    await expect(
      createBooking(
        { ...biscuit, serviceTime: { startTime: '13:00', endTime: '15:00' } },
        'America/New_York',
      ),
    ).resolves.toMatchObject({ petIds: ['pet_002'] });
  });

  it('ignores cancelled bookings when checking for overlaps', async () => {
    const hamlet: BookingRequest = {
      firstName: 'Sam',
      lastName: 'Okafor',
      pets: [{ name: 'Hamlet', animalType: 'pig' }],
      serviceDate: '2026-10-10',
      serviceTime: { startTime: '14:00', endTime: '16:00' },
    };

    await expect(createBooking(hamlet, 'America/New_York')).resolves.toMatchObject({
      petIds: ['pet_001'],
    });
  });

  it('saves nothing when any pet conflicts', async () => {
    const withBiscuit: BookingRequest = {
      ...request,
      pets: [
        { name: 'Oscar', animalType: 'dog' },
        { name: 'Biscuit', animalType: 'dog' },
      ],
      serviceTime: { startTime: '09:00', endTime: '11:00' },
    };

    await expect(createBooking(withBiscuit, 'America/New_York')).rejects.toThrow(MockApiError);
    expect(await listBookings('2026-10-03')).toHaveLength(3);
  });

  it('checks the request again, as a server would', async () => {
    await expect(
      createBooking(
        { ...request, serviceTime: { startTime: '07:00', endTime: '16:00' } },
        'America/New_York',
      ),
    ).rejects.toThrow('Book at most 8 hours');
  });
});

describe('getPricingRules', () => {
  it('serves the rate card the apps price with: $20 base, then per hour pig $20, dog $10, cat $5', async () => {
    await expect(getPricingRules()).resolves.toEqual({
      currency: 'USD',
      baseChargeCents: 2000,
      hourlyRateCents: { pig: 2000, dog: 1000, cat: 500 },
    });
  });
});
