/**
 * Booking domain: the data contract shared by web/, mobile/ and the mock database.
 *
 * Every value a real backend would store is modeled here, including ones the assessment doesn't
 * mention (ids, timestamps, status, a price snapshot). Anything marked "Assumption" is also listed
 * in the README.
 */

export const ANIMAL_TYPES = ['dog', 'cat', 'pig'] as const;
export type AnimalType = (typeof ANIMAL_TYPES)[number];

/** Rules both apps validate against. The mock API should check them again before saving. */
export const BOOKING_RULES = {
  /** Hours per booking, from the assessment. Assumption: whole hours only. */
  minHours: 2,
  maxHours: 8,
  /**
   * The gotcha: a pet can have several bookings on one date, but it can't be in two places at
   * once. The form has no start time, so one pet's bookings on the same date run back-to-back:
   * the pet is returned before the next booking starts.
   * Assumption: together they must fit in one 8-hour care day, the length of the longest booking.
   */
  maxHoursPerPetPerDay: 8,
} as const;

/**
 * Assumption: a booking is confirmed when it's created. A cancelled booking stays in the list
 * but no longer counts toward the pet's hours for that day.
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

export interface Booking {
  id: string;
  customerId: string;
  petId: string;
  /**
   * Calendar date as 'YYYY-MM-DD', not a timestamp. Assumption: it must be today or later in the
   * customer's time zone. Don't pass it to `new Date()`, which parses it as UTC midnight: in US
   * time zones that displays as the previous day.
   */
  serviceDate: string;
  hoursRequested: number;
  price: PriceBreakdown;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
}
