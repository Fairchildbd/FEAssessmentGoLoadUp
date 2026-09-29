import { areIntervalsOverlapping } from 'date-fns/areIntervalsOverlapping';
import { bookingFormSchema, type BookingRequest } from '../booking-form/bookingFormSchema';
import { displayTime, hoursBetween, parseDateTime } from '../date-time/localDateTime';
import type { Booking, Customer, Pet, PricingRules } from '../domain/bookingDomain';
import { mockDatabase, type MockDatabase } from '../mock-database/mockDatabase';
import { quoteBooking } from '../pricing/pricingEngine';

/**
 * Mock API: stands in for the backend's HTTP endpoints. The apps call these async functions as if
 * they were remote, and the "server" reads and writes an in-memory copy of the seed data, so the
 * seed itself never changes. The copy lasts until the page reloads (or the app restarts).
 */

let database: MockDatabase = copyOfSeed();
let latencyMs = 300;

function copyOfSeed(): MockDatabase {
  return JSON.parse(JSON.stringify(mockDatabase)) as MockDatabase;
}

/** Waits like a network round trip would. With no latency, answers without a timer at all. */
const respond = <Value>(value: Value) =>
  latencyMs === 0
    ? Promise.resolve(value)
    : new Promise<Value>((resolve) => setTimeout(() => resolve(value), latencyMs));

/** Starts over from the seed data. Tests use it, with no latency, to run each case from scratch. */
export function resetMockApi(options: { latencyMs?: number } = {}): void {
  database = copyOfSeed();
  latencyMs = options.latencyMs ?? 300;
}

/** A request the server refused. `message` is written for the user. */
export class MockApiError extends Error {
  override name = 'MockApiError';
}

export function getPricingRules(): Promise<PricingRules> {
  return respond(database.pricingRules);
}

/** A booking with its customer and pets, as a list screen needs it. */
export interface BookingListItem {
  booking: Booking;
  customer: Customer;
  /** In the booking's petIds order. */
  pets: Pet[];
}

/** Every booking on a date ('YYYY-MM-DD'), cancelled ones included, in no particular order. */
export function listBookings(serviceDate: string): Promise<BookingListItem[]> {
  const items = database.bookings
    .filter((booking) => booking.serviceDate === serviceDate)
    .map((booking) => ({
      booking,
      customer: findById(database.customers, booking.customerId),
      pets: booking.petIds.map((petId) => findById(database.pets, petId)),
    }));
  return respond(items);
}

/**
 * Books a sitter: one submission is one booking (one appointment), however many pets it has. Checks
 * the request again with the form's schema (a server never trusts the client), then refuses it if
 * any pet already has a confirmed booking overlapping the new one. Back-to-back bookings are fine.
 *
 * The price is the quote the form showed: the base charge once, then each pet's hourly charge.
 */
export async function createBooking(request: BookingRequest, timeZone: string): Promise<Booking> {
  const parsed = bookingFormSchema.safeParse(request);
  if (!parsed.success) {
    await respond(null);
    throw new MockApiError(parsed.error.issues[0]?.message ?? 'That request is not valid');
  }
  const { firstName, lastName, pets, serviceDate, serviceTime } = parsed.data;
  const now = new Date().toISOString();

  const customer = findCustomer(firstName, lastName) ?? {
    id: nextId('cus', database.customers),
    firstName,
    lastName,
    createdAt: now,
  };
  const petRecords = pets.map(
    (pet) =>
      findPet(customer.id, pet.name, pet.animalType) ?? {
        id: '', // assigned below, once we know the request is accepted
        customerId: customer.id,
        name: pet.name,
        animalType: pet.animalType,
        createdAt: now,
      },
  );

  const conflict = findConflict(
    petRecords,
    serviceDate,
    serviceTime.startTime,
    serviceTime.endTime,
  );
  if (conflict) {
    await respond(null);
    throw new MockApiError(
      `${conflict.pet.name} already has a booking from ${displayTime(conflict.booking.startTime)} ` +
        `to ${displayTime(conflict.booking.endTime)} that day`,
    );
  }

  // Accepted: save the customer, any new pets, and the booking.
  if (!database.customers.includes(customer)) database.customers.push(customer);
  for (const pet of petRecords) {
    if (pet.id === '') {
      pet.id = nextId('pet', database.pets);
      database.pets.push(pet);
    }
  }

  const hours = hoursBetween(serviceTime.startTime, serviceTime.endTime);
  const quote = quoteBooking(
    petRecords.map((pet) => pet.animalType),
    hours,
    database.pricingRules,
  );
  const booking: Booking = {
    id: nextId('bkg', database.bookings),
    customerId: customer.id,
    petIds: petRecords.map((pet) => pet.id),
    serviceDate,
    startTime: serviceTime.startTime,
    endTime: serviceTime.endTime,
    timeZone,
    hoursRequested: hours,
    price: {
      currency: quote.currency,
      baseChargeCents: quote.baseChargeCents,
      hours,
      pets: petRecords.map((pet, index) => {
        const petQuote = quote.pets[index]!; // every pet has an animal type, so every pet is priced
        return {
          petId: pet.id,
          hourlyRateCents: petQuote.hourlyRateCents,
          subtotalCents: petQuote.subtotalCents,
        };
      }),
      totalCents: quote.totalCents,
    },
    status: 'confirmed',
    createdAt: now,
    updatedAt: now,
  };
  database.bookings.push(booking);

  return respond(booking);
}

function findById<Item extends { id: string }>(items: Item[], id: string): Item {
  const item = items.find((candidate) => candidate.id === id);
  if (!item) throw new Error(`Mock database is missing ${id}`);
  return item;
}

const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** Assumption (see README): the same first + last name is the same customer. */
function findCustomer(firstName: string, lastName: string): Customer | undefined {
  return database.customers.find(
    (customer) => sameName(customer.firstName, firstName) && sameName(customer.lastName, lastName),
  );
}

/** Assumption (see README): a customer's pet is identified by name + animal type. */
function findPet(customerId: string, name: string, animalType: Pet['animalType']) {
  return database.pets.find(
    (pet) =>
      pet.customerId === customerId && sameName(pet.name, name) && pet.animalType === animalType,
  );
}

/** The first confirmed booking that overlaps the new time for one of these pets, if any. */
function findConflict(pets: Pet[], serviceDate: string, startTime: string, endTime: string) {
  const newSlot = {
    start: parseDateTime(serviceDate, startTime),
    end: parseDateTime(serviceDate, endTime),
  };
  for (const pet of pets) {
    const booking = database.bookings.find(
      (existing) =>
        existing.petIds.includes(pet.id) &&
        existing.status === 'confirmed' &&
        existing.serviceDate === serviceDate &&
        // Not inclusive, so a booking may start the minute the previous one ends.
        areIntervalsOverlapping(newSlot, {
          start: parseDateTime(existing.serviceDate, existing.startTime),
          end: parseDateTime(existing.serviceDate, existing.endTime),
        }),
    );
    if (booking) return { pet, booking };
  }
  return undefined;
}

/** The next id after the highest one in use, e.g. 'bkg_010' after 'bkg_009'. */
function nextId(prefix: string, items: { id: string }[]): string {
  const highest = Math.max(0, ...items.map((item) => Number(item.id.split('_')[1]) || 0));
  return `${prefix}_${String(highest + 1).padStart(3, '0')}`;
}
