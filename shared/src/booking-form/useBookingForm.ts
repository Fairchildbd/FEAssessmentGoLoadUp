import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { BOOKING_RULES } from '../domain/bookingDomain';
import {
  bookingFormSchema,
  type BookingFormValues,
  type BookingRequest,
} from './bookingFormSchema';

export type { BookingFormValues, BookingRequest };

export const bookingFormDefaultValues: BookingFormValues = {
  firstName: '',
  lastName: '',
  animalName: '',
  animalType: null, // nothing selected yet, so no one books the wrong animal by default
  hoursRequested: BOOKING_RULES.minHours,
  serviceDate: '',
  startTime: '',
};

export function useBookingForm() {
  const form = useForm<BookingFormValues, unknown, BookingRequest>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: bookingFormDefaultValues,
    // Check a field when the user leaves it, then on every change after that.
    mode: 'onTouched',
  });
  const { subscribe, getFieldState, trigger } = form;

  // Whether a start time is valid also depends on the date and the number of hours, so check it
  // again when either one changes (once the user has touched the start time).
  useEffect(
    () =>
      subscribe({
        name: ['serviceDate', 'hoursRequested'],
        formState: { values: true },
        callback: () => {
          if (getFieldState('startTime').isTouched) void trigger('startTime');
        },
      }),
    [subscribe, getFieldState, trigger],
  );

  // Still to build here, so both apps get it: the live price quote from the pricing API, and submit.

  return form;
}
