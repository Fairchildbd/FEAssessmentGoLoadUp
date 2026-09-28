/**
 * Booking domain: the data contract shared by web/, mobile/ and the mock database.
 *
 * Every value a real backend would store is modeled here, including ones the assessment doesn't
 * mention (ids, timestamps, status, a price snapshot, the time zone). Anything marked "Assumption"
 * is also listed in the README.
 */

export const ANIMAL_TYPES = ['dog', 'cat', 'pig'] as const;
export type AnimalType = (typeof ANIMAL_TYPES)[number];

/**
 * Rules the booking form checks in both apps (see booking-form/bookingFormSchema.ts). The mock API
 * should check them again before saving.
 */
export const BOOKING_RULES = {
  /** Hours per booking, from the assessment. Assumption: whole hours only. */
  minHours: 2,
  maxHours: 8,
  /**
   * Assumption: sitters work from 07:00 to 21:00 local time. A booking must start and end inside
   * those hours, so it never runs past midnight.
   */
  serviceHours: { start: '07:00', end: '21:00' },
  /**
   * Assumption: bookings start on the hour or half hour. The check looks at minutes past the hour,
   * so keep this a divisor of 60.
   */
  startTimeStepMinutes: 30,
  /** Assumption: names have a length limit, as a database column would. */
  maxNameLength: 50,
} as const;

/**
 * Assumption: a booking is confirmed when it's created. A cancelled booking stays in the list but
 * no longer blocks its time slot.
 */
export type BookingStatus = 'confirmed' | 'cancelled';

/**
 * The form collects names, not accounts. Assumption: the same first + last name (trimmed,
 * case-insensitive) is the same customer. In production this would be a signed-in user's id.
 */
export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  /** ISO 8601 timestamp in UTC. */
  createdAt: string;
}

/**
 * Assumption: a customer's pet is identified by name + animal type, so Biscuit the dog and
 * Biscuit the cat are two different pets.
 */
export interface Pet {
  id: string;
  customerId: string;
  name: string;
  animalType: AnimalType;
  createdAt: string;
}

/**
 * The rate card lives in the (mock) database, not in the apps, so the server stays the source of
 * truth for prices, which can then change without shipping a new mobile build. Money is stored
 * in integer cents to avoid floating-point rounding errors.
 */
export interface PricingRules {
  currency: 'USD';
  baseChargeCents: number;
  hourlyRateCents: Record<AnimalType, number>;
}

/** An itemized price. Each booking keeps a copy, so a later rate change can't alter past totals. */
export interface PriceBreakdown {
  currency: 'USD';
  baseChargeCents: number;
  hourlyRateCents: number;
  hours: number;
  totalCents: number;
}

/**
 * One pet sat for a block of time.
 *
 * The gotcha: a pet can have several bookings on one date, but it can't be in two places at once.
 * A pet's confirmed bookings must not overlap, so the pet is returned before its next booking starts
 * (the next one may start the minute the previous one ends). Only the mock API can enforce this,
 * because it needs the existing bookings. date-fns `areIntervalsOverlapping` does the comparison,
 * and doesn't count back-to-back bookings as overlapping.
 */
export interface Booking {
  id: string;
  customerId: string;
  petId: string;
  /** Local calendar date, 'YYYY-MM-DD'. Read it with date-fns, never `new Date()` (see localDateTime.ts). */
  serviceDate: string;
  /** Local start time, 24-hour 'HH:mm'. */
  startTime: string;
  /** Local end time, 'HH:mm': startTime + hoursRequested, stored so lists and checks don't recompute it. */
  endTime: string;
  /**
   * IANA time zone of the service location, e.g. 'America/New_York'. A local date and time only
   * pin down an exact moment together with a time zone, which reminders or scheduling would need.
   */
  timeZone: string;
  hoursRequested: number;
  price: PriceBreakdown;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
}
