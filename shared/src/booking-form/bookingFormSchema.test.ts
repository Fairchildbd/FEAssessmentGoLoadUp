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
  animalName: 'Biscuit',
  animalType: 'dog',
  hoursRequested: 2,
  serviceDate: '2026-10-03',
  startTime: '09:00',
};

/** The first error message for each field, which is what React Hook Form shows. */
function errorsFor(values: BookingFormValues): Record<string, string> {
  const result = bookingFormSchema.safeParse(values);
  const errors: Record<string, string> = {};
  for (const issue of result.error?.issues ?? []) {
    errors[String(issue.path[0])] ??= issue.message;
  }
  return errors;
}

describe('bookingFormSchema', () => {
  it('accepts a complete booking and trims the names', () => {
    const booking = bookingFormSchema.parse({ ...validValues, firstName: '  Jordan ' });

    expect(booking.firstName).toBe('Jordan');
  });

  it('requires every field', () => {
    const emptyForm: BookingFormValues = {
      ...validValues,
      firstName: '',
      lastName: ' ',
      animalName: '',
      animalType: null,
      serviceDate: '',
      startTime: '',
    };

    expect(errorsFor(emptyForm)).toEqual({
      firstName: 'Enter your first name',
      lastName: 'Enter your last name',
      animalName: "Enter your pet's name",
      animalType: 'Choose an animal type',
      serviceDate: 'Choose a date',
      startTime: 'Choose a start time',
    });
  });

  it('only allows whole hours from 2 to 8', () => {
    expect(errorsFor({ ...validValues, hoursRequested: 1 })).toEqual({
      hoursRequested: 'Book at least 2 hours',
    });
    expect(errorsFor({ ...validValues, hoursRequested: 9 })).toEqual({
      hoursRequested: 'Book at most 8 hours',
    });
    expect(errorsFor({ ...validValues, hoursRequested: 2.5 })).toEqual({
      hoursRequested: 'Choose whole hours',
    });
  });

  it('rejects impossible and past dates', () => {
    expect(errorsFor({ ...validValues, serviceDate: '2026-02-30' })).toEqual({
      serviceDate: 'Enter a real date as YYYY-MM-DD',
    });
    expect(errorsFor({ ...validValues, serviceDate: '2026-09-30' })).toEqual({
      serviceDate: 'Choose today or a later date',
    });
  });

  it('starts bookings on the hour or half hour', () => {
    expect(errorsFor({ ...validValues, startTime: '09:15' })).toEqual({
      startTime: 'Start on the hour or half hour',
    });
  });

  it('keeps the whole booking inside service hours', () => {
    expect(errorsFor({ ...validValues, startTime: '06:30' })).toEqual({
      startTime: 'For 2 hours, start between 07:00 and 19:00',
    });
    expect(errorsFor({ ...validValues, hoursRequested: 8, startTime: '13:30' })).toEqual({
      startTime: 'For 8 hours, start between 07:00 and 13:00',
    });
    expect(errorsFor({ ...validValues, hoursRequested: 8, startTime: '13:00' })).toEqual({});
  });

  it('rejects a start time that has already passed today', () => {
    expect(errorsFor({ ...validValues, serviceDate: '2026-10-01', startTime: '11:30' })).toEqual({
      startTime: 'That time has already passed',
    });
    expect(errorsFor({ ...validValues, serviceDate: '2026-10-01', startTime: '12:30' })).toEqual(
      {},
    );
  });

  it('checks the schedule even while other fields are still empty', () => {
    expect(errorsFor({ ...validValues, firstName: '', startTime: '20:00' })).toEqual({
      firstName: 'Enter your first name',
      startTime: 'For 2 hours, start between 07:00 and 19:00',
    });
  });
});
