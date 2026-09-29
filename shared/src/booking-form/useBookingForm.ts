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
    mode: 'onTouched',
  });
  const { control, subscribe, getFieldState, trigger } = form;

  const pets = useFieldArray({ control, name: 'pets' });

  useEffect(
    () =>
      subscribe({
        name: 'serviceDate',
        formState: { values: true },
        callback: ({ type }) => {
          const userChangedTheDate = type === 'change';
          if (userChangedTheDate && getFieldState('serviceTime').isTouched) {
            void trigger('serviceTime');
          }
        },
      }),
    [subscribe, getFieldState, trigger],
  );

  return { ...form, pets };
}

export function useBookingQuote(
  control: Control<BookingFormValues, unknown, BookingRequest>,
  rules: PricingRules,
): BookingQuote {
  const [pets, serviceTime] = useWatch({ control, name: ['pets', 'serviceTime'] });
  const hours = hoursBetween(serviceTime.startTime, serviceTime.endTime);
  const bothTimesPicked = hours > 0;
  return quoteBooking(
    pets.map((pet) => pet.animalType),
    bothTimesPicked ? hours : null,
    rules,
  );
}
