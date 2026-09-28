import type { Booking, Customer, Pet, PricingRules } from '../domain/bookingDomain';

/** The shape of the mock backend's data store. */
export interface MockDatabase {
  pricingRules: PricingRules;
  customers: Customer[];
  pets: Pet[];
  bookings: Booking[];
}

/**
 * Mock database: a plain JSON object standing in for the backend (there is no server in this
 * repo). Treat it as seed data: the mock API layer should copy it into memory and read and write
 * the copy, so this object never changes.
 *
 * The seed has 2 of each animal and covers the same-day gotcha:
 * - Jordan Rivera has 2 dogs and 3 two-hour bookings on 2026-10-03: both dogs from 09:00, then
 *   Biscuit again from 11:00, the minute his first booking ends.
 * - Miso is booked 09:00-17:00 on 2026-10-05, so another booking for Miso that day has to fit
 *   before 09:00 or after 17:00.
 * - Hamlet's 10:00-16:00 booking on 2026-10-10 was cancelled, which freed the slot for his
 *   12:00-14:00 booking.
 */
export const mockDatabase: MockDatabase = {
  pricingRules: {
    currency: 'USD',
    baseChargeCents: 2000,
    hourlyRateCents: { dog: 1000, cat: 500, pig: 2000 },
  },
  customers: [
    { id: 'cus_001', firstName: 'Sam', lastName: 'Okafor', createdAt: '2026-09-14T13:15:00.000Z' },
    {
      id: 'cus_002',
      firstName: 'Jordan',
      lastName: 'Rivera',
      createdAt: '2026-09-21T16:02:00.000Z',
    },
    { id: 'cus_003', firstName: 'Priya', lastName: 'Shah', createdAt: '2026-09-23T19:45:00.000Z' },
  ],
  pets: [
    {
      id: 'pet_001',
      customerId: 'cus_001',
      name: 'Hamlet',
      animalType: 'pig',
      createdAt: '2026-09-14T13:15:00.000Z',
    },
    {
      id: 'pet_002',
      customerId: 'cus_002',
      name: 'Biscuit',
      animalType: 'dog',
      createdAt: '2026-09-21T16:02:00.000Z',
    },
    {
      id: 'pet_003',
      customerId: 'cus_002',
      name: 'Maple',
      animalType: 'dog',
      createdAt: '2026-09-21T16:05:00.000Z',
    },
    {
      id: 'pet_004',
      customerId: 'cus_003',
      name: 'Miso',
      animalType: 'cat',
      createdAt: '2026-09-23T19:45:00.000Z',
    },
    {
      id: 'pet_005',
      customerId: 'cus_003',
      name: 'Tofu',
      animalType: 'cat',
      createdAt: '2026-09-23T19:48:00.000Z',
    },
    {
      id: 'pet_006',
      customerId: 'cus_001',
      name: 'Truffle',
      animalType: 'pig',
      createdAt: '2026-09-25T14:20:00.000Z',
    },
  ],
  bookings: [
    {
      id: 'bkg_001',
      customerId: 'cus_001',
      petId: 'pet_001',
      serviceDate: '2026-09-20',
      startTime: '09:00',
      endTime: '13:00',
      timeZone: 'America/New_York',
      hoursRequested: 4,
      price: {
        currency: 'USD',
        baseChargeCents: 2000,
        hourlyRateCents: 2000,
        hours: 4,
        totalCents: 10000,
      },
      status: 'confirmed',
      createdAt: '2026-09-14T13:15:00.000Z',
      updatedAt: '2026-09-14T13:15:00.000Z',
    },
    {
      id: 'bkg_002',
      customerId: 'cus_002',
      petId: 'pet_002',
      serviceDate: '2026-10-03',
      startTime: '09:00',
      endTime: '11:00',
      timeZone: 'America/New_York',
      hoursRequested: 2,
      price: {
        currency: 'USD',
        baseChargeCents: 2000,
        hourlyRateCents: 1000,
        hours: 2,
        totalCents: 4000,
      },
      status: 'confirmed',
      createdAt: '2026-09-21T16:02:00.000Z',
      updatedAt: '2026-09-21T16:02:00.000Z',
    },
    {
      id: 'bkg_003',
      customerId: 'cus_002',
      petId: 'pet_003',
      serviceDate: '2026-10-03',
      startTime: '09:00',
      endTime: '11:00',
      timeZone: 'America/New_York',
      hoursRequested: 2,
      price: {
        currency: 'USD',
        baseChargeCents: 2000,
        hourlyRateCents: 1000,
        hours: 2,
        totalCents: 4000,
      },
      status: 'confirmed',
      createdAt: '2026-09-21T16:05:00.000Z',
      updatedAt: '2026-09-21T16:05:00.000Z',
    },
    {
      id: 'bkg_004',
      customerId: 'cus_002',
      petId: 'pet_002',
      serviceDate: '2026-10-03',
      startTime: '11:00',
      endTime: '13:00',
      timeZone: 'America/New_York',
      hoursRequested: 2,
      price: {
        currency: 'USD',
        baseChargeCents: 2000,
        hourlyRateCents: 1000,
        hours: 2,
        totalCents: 4000,
      },
      status: 'confirmed',
      createdAt: '2026-09-21T16:09:00.000Z',
      updatedAt: '2026-09-21T16:09:00.000Z',
    },
    {
      id: 'bkg_005',
      customerId: 'cus_003',
      petId: 'pet_004',
      serviceDate: '2026-10-05',
      startTime: '09:00',
      endTime: '17:00',
      timeZone: 'America/New_York',
      hoursRequested: 8,
      price: {
        currency: 'USD',
        baseChargeCents: 2000,
        hourlyRateCents: 500,
        hours: 8,
        totalCents: 6000,
      },
      status: 'confirmed',
      createdAt: '2026-09-23T19:45:00.000Z',
      updatedAt: '2026-09-23T19:45:00.000Z',
    },
    {
      id: 'bkg_006',
      customerId: 'cus_003',
      petId: 'pet_005',
      serviceDate: '2026-10-05',
      startTime: '10:00',
      endTime: '13:00',
      timeZone: 'America/New_York',
      hoursRequested: 3,
      price: {
        currency: 'USD',
        baseChargeCents: 2000,
        hourlyRateCents: 500,
        hours: 3,
        totalCents: 3500,
      },
      status: 'confirmed',
      createdAt: '2026-09-23T19:48:00.000Z',
      updatedAt: '2026-09-23T19:48:00.000Z',
    },
    {
      id: 'bkg_007',
      customerId: 'cus_001',
      petId: 'pet_006',
      serviceDate: '2026-10-10',
      startTime: '08:00',
      endTime: '13:00',
      timeZone: 'America/New_York',
      hoursRequested: 5,
      price: {
        currency: 'USD',
        baseChargeCents: 2000,
        hourlyRateCents: 2000,
        hours: 5,
        totalCents: 12000,
      },
      status: 'confirmed',
      createdAt: '2026-09-25T14:20:00.000Z',
      updatedAt: '2026-09-25T14:20:00.000Z',
    },
    {
      id: 'bkg_008',
      customerId: 'cus_001',
      petId: 'pet_001',
      serviceDate: '2026-10-10',
      startTime: '10:00',
      endTime: '16:00',
      timeZone: 'America/New_York',
      hoursRequested: 6,
      price: {
        currency: 'USD',
        baseChargeCents: 2000,
        hourlyRateCents: 2000,
        hours: 6,
        totalCents: 14000,
      },
      status: 'cancelled',
      createdAt: '2026-09-25T14:24:00.000Z',
      updatedAt: '2026-09-27T10:00:00.000Z',
    },
    {
      id: 'bkg_009',
      customerId: 'cus_001',
      petId: 'pet_001',
      serviceDate: '2026-10-10',
      startTime: '12:00',
      endTime: '14:00',
      timeZone: 'America/New_York',
      hoursRequested: 2,
      price: {
        currency: 'USD',
        baseChargeCents: 2000,
        hourlyRateCents: 2000,
        hours: 2,
        totalCents: 6000,
      },
      status: 'confirmed',
      createdAt: '2026-09-27T10:05:00.000Z',
      updatedAt: '2026-09-27T10:05:00.000Z',
    },
  ],
};
