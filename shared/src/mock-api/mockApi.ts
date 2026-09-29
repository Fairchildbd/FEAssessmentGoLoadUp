import { areIntervalsOverlapping } from 'date-fns/areIntervalsOverlapping';
import { bookingFormSchema, type BookingRequest } from '../booking-form/bookingFormSchema';
import { displayTime, hoursBetween, parseDateTime } from '../date-time/localDateTime';
import type { Booking, Customer, Pet, PricingRules } from '../domain/bookingDomain';
import { mockDatabase, type MockDatabase } from '../mock-database/mockDatabase';
import { quoteBooking } from '../pricing/pricingEngine';

const ID_ASSIGNED_WHEN_SAVED = '';

let database: MockDatabase = copyOfSeed();
let latencyMs = 300;

function copyOfSeed(): MockDatabase {
  return JSON.parse(JSON.stringify(mockDatabase)) as MockDatabase;
}

const respond = <Value>(value: Value) =>
  latencyMs === 0
    ? Promise.resolve(value)
    : new Promise<Value>((resolve) => setTimeout(() => resolve(value), latencyMs));

export function resetMockApi(options: { latencyMs?: number } = {}): void {
  database = copyOfSeed();
  latencyMs = options.latencyMs ?? 300;
}

export class MockApiError extends Error {
  override name = 'MockApiError';
}

export function getPricingRules(): Promise<PricingRules> {
  return respond(database.pricingRules);
}

export interface BookingListItem {
  booking: Booking;
  customer: Customer;
  pets: Pet[];
}

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
        id: ID_ASSIGNED_WHEN_SAVED,
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

  if (!database.customers.includes(customer)) database.customers.push(customer);
  for (const pet of petRecords) {
    if (pet.id === ID_ASSIGNED_WHEN_SAVED) {
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
        const petQuote = quote.pets[index]!;
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

function findCustomer(firstName: string, lastName: string): Customer | undefined {
  return database.customers.find(
    (customer) => sameName(customer.firstName, firstName) && sameName(customer.lastName, lastName),
  );
}

function findPet(customerId: string, name: string, animalType: Pet['animalType']) {
  return database.pets.find(
    (pet) =>
      pet.customerId === customerId && sameName(pet.name, name) && pet.animalType === animalType,
  );
}

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
        areIntervalsOverlapping(newSlot, {
          start: parseDateTime(existing.serviceDate, existing.startTime),
          end: parseDateTime(existing.serviceDate, existing.endTime),
        }),
    );
    if (booking) return { pet, booking };
  }
  return undefined;
}

function nextId(prefix: string, items: { id: string }[]): string {
  const highest = Math.max(0, ...items.map((item) => Number(item.id.split('_')[1]) || 0));
  return `${prefix}_${String(highest + 1).padStart(3, '0')}`;
}
