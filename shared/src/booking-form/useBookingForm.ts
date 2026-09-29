import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useFieldArray, useForm, useWatch, type Control } from 'react-hook-form';
import { hoursBetween } from '../date-time/localDateTime';
import type { PricingRules } from '../domain/bookingDomain';
import { quoteBooking, type BookingQuote } from '../pricing/pricingEngine';
import {
  bookingFormSchema,
  type BookingFormValues,
  type BookingRequest,
  type PetFormValues,
} from './bookingFormSchema';

export type { BookingFormValues, BookingRequest, PetFormValues };

/** A new, empty pet row. No animal type is selected, so no one books the wrong animal by default. */
export const emptyPet: PetFormValues = { name: '', animalType: null };

export const bookingFormDefaultValues: BookingFormValues = {
  firstName: '',
  lastName: '',
  pets: [emptyPet],
  serviceDate: '',
  serviceTime: { startTime: '', endTime: '' },
};

export function useBookingForm() {
  const form = useForm<BookingFormValues, unknown, BookingRequest>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: bookingFormDefaultValues,
    // Check a field when the user leaves it, then on every change after that.
    mode: 'onTouched',
  });
  const { control, subscribe, getFieldState, trigger } = form;

  // Several pets on one request: Oscar and Sulley share the date and time.
  const pets = useFieldArray({ control, name: 'pets' });

  // A start time can pass depending on the date (today vs. tomorrow), so check the time again when
  // the user changes the date (once they've touched the time). Only a user's change counts: reset()
  // after a booking also notifies here, before the time's touched state is cleared, and checking
  // the emptied time then would show "Choose a start and end time" on a fresh form.
  useEffect(
    () =>
      subscribe({
        name: 'serviceDate',
        formState: { values: true },
        callback: ({ type }) => {
          if (type === 'change' && getFieldState('serviceTime').isTouched) {
            void trigger('serviceTime');
          }
        },
      }),
    [subscribe, getFieldState, trigger],
  );

  return { ...form, pets };
}

/**
 * The live price for what's on the form. It updates as pets are added, removed or given an animal
 * type, and as the time changes. Until a time is picked, the total is the base charge.
 */
export function useBookingQuote(
  control: Control<BookingFormValues, unknown, BookingRequest>,
  rules: PricingRules,
): BookingQuote {
  const [pets, serviceTime] = useWatch({ control, name: ['pets', 'serviceTime'] });
  const hours = hoursBetween(serviceTime.startTime, serviceTime.endTime);
  return quoteBooking(
    pets.map((pet) => pet.animalType),
    hours > 0 ? hours : null, // NaN until both times are picked
    rules,
  );
}
