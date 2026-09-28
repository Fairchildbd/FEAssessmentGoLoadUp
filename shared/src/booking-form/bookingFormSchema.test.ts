import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { bookingFormSchema, type BookingFormValues } from './bookingFormSchema';

// "Now" is 1 Oct 2026 at 12:00 in the device's time zone, so date and time checks are repeatable.
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 1, 12, 0));
});

afterEach(() => {
  vi.useRealTimers();
});

const validValues: BookingFormValues = {
  firstName: 'Jordan',
  lastName: 'Rivera',
  pets: [
    { name: 'Oscar', animalType: 'dog' },
    { name: 'Sulley', animalType: 'dog' },
  ],
  serviceDate: '2026-10-03',
  serviceTime: { startTime: '09:00', endTime: '17:00' },
};

const at = (startTime: string, endTime: string): BookingFormValues => ({
  ...validValues,
  serviceTime: { startTime, endTime },
});

/** The first error message for each field path, which is what React Hook Form shows. */
function errorsFor(values: BookingFormValues): Record<string, string> {
  const result = bookingFormSchema.safeParse(values);
  const errors: Record<string, string> = {};
  for (const issue of result.error?.issues ?? []) {
    errors[issue.path.join('.')] ??= issue.message;
  }
  return errors;
}

describe('bookingFormSchema', () => {
  it('accepts several pets on one request and trims the names', () => {
    const booking = bookingFormSchema.parse({
      ...validValues,
      firstName: '  Jordan ',
      pets: [{ name: ' Oscar ', animalType: 'dog' }, ...validValues.pets.slice(1)],
    });

    expect(booking.firstName).toBe('Jordan');
    expect(booking.pets.map((pet) => pet.name)).toEqual(['Oscar', 'Sulley']);
  });

  it('requires every field', () => {
    const emptyForm: BookingFormValues = {
      firstName: '',
      lastName: ' ',
      pets: [{ name: '', animalType: null }],
      serviceDate: '',
      serviceTime: { startTime: '', endTime: '' },
    };

    expect(errorsFor(emptyForm)).toEqual({
      firstName: 'Enter your first name',
      lastName: 'Enter your last name',
      'pets.0.name': "Enter your pet's name",
      'pets.0.animalType': 'Choose an animal type',
      serviceDate: 'Choose a date',
      serviceTime: 'Choose a start and end time',
    });
  });

  it('needs at least one pet, and each pet only once', () => {
    expect(errorsFor({ ...validValues, pets: [] })).toEqual({ pets: 'Add a pet' });
    expect(
      errorsFor({
        ...validValues,
        pets: [
          { name: 'Oscar', animalType: 'dog' },
          { name: 'oscar ', animalType: 'dog' },
          { name: 'Oscar', animalType: 'cat' },
        ],
      }),
    ).toEqual({ 'pets.1.name': 'oscar is already on this request' });
  });

  it('books from 2 to 8 hours, set by the start and end time', () => {
    expect(errorsFor(at('09:00', '11:00'))).toEqual({});
    expect(errorsFor(at('09:00', '10:00'))).toEqual({ serviceTime: 'Book at least 2 hours' });
    expect(errorsFor(at('09:00', '18:00'))).toEqual({ serviceTime: 'Book at most 8 hours' });
    expect(errorsFor(at('09:00', '11:30'))).toEqual({}); // half hours are fine
    expect(errorsFor(at('12:00', '09:00'))).toEqual({ serviceTime: 'End after the start time' });
  });

  it('rejects impossible and past dates', () => {
    expect(errorsFor({ ...validValues, serviceDate: '2026-02-30' })).toEqual({
      serviceDate: 'Enter a real date as YYYY-MM-DD',
    });
    expect(errorsFor({ ...validValues, serviceDate: '2026-09-30' })).toEqual({
      serviceDate: 'Choose today or a later date',
    });
  });

  it('starts and ends on the hour or half hour, inside service hours', () => {
    expect(errorsFor(at('09:15', '11:15'))).toEqual({
      serviceTime: 'Choose times on the hour or half hour',
    });
    expect(errorsFor(at('09:00', '11:45'))).toEqual({
      serviceTime: 'Choose times on the hour or half hour',
    });
    expect(errorsFor(at('06:30', '08:30'))).toEqual({
      serviceTime: 'Book between 07:00 and 21:00',
    });
    expect(errorsFor(at('19:30', '21:30'))).toEqual({
      serviceTime: 'Book between 07:00 and 21:00',
    });
    expect(errorsFor(at('13:00', '21:00'))).toEqual({});
  });

  it('rejects a start time that has already passed today', () => {
    const today = { ...validValues, serviceDate: '2026-10-01' };
    expect(errorsFor({ ...today, serviceTime: { startTime: '11:30', endTime: '13:30' } })).toEqual({
      serviceTime: 'That start time has already passed',
    });
    expect(errorsFor({ ...today, serviceTime: { startTime: '12:30', endTime: '14:30' } })).toEqual(
      {},
    );
  });

  it('checks the schedule even while other fields are still empty', () => {
    expect(
      errorsFor({
        ...validValues,
        firstName: '',
        serviceDate: '2026-10-01',
        serviceTime: { startTime: '09:00', endTime: '11:00' },
      }),
    ).toEqual({
      firstName: 'Enter your first name',
      serviceTime: 'That start time has already passed',
    });
  });
});
