import { useCallback, useState } from 'react';
import { BOOKING_RULES, type AnimalType } from '../domain/bookingDomain';

/**
 * Shared booking-form logic for web/ and mobile/.
 *
 * Only React and shared code may be imported here (no DOM, MUI, React Native or Paper), so both
 * apps can call this hook and put their own inputs on top of it: MUI on web, Paper on mobile.
 */

/** Mirrors the assessment's form fields. */
export interface BookingFormValues {
  firstName: string;
  lastName: string;
  animalName: string;
  /** null until the user picks one, so no one books the wrong animal by default. */
  animalType: AnimalType | null;
  hoursRequested: number;
  /** 'YYYY-MM-DD'. See Booking.serviceDate. */
  serviceDate: string;
}

export const initialBookingFormValues: BookingFormValues = {
  firstName: '',
  lastName: '',
  animalName: '',
  animalType: null,
  hoursRequested: BOOKING_RULES.minHours,
  serviceDate: '',
};

export function useBookingForm() {
  const [values, setValues] = useState<BookingFormValues>(initialBookingFormValues);

  /** Updates one field. The generic keeps each field's type, e.g. hoursRequested must be a number. */
  const setField = useCallback(
    <Field extends keyof BookingFormValues>(field: Field, value: BookingFormValues[Field]) => {
      setValues((current) => ({ ...current, [field]: value }));
    },
    [],
  );

  const reset = useCallback(() => setValues(initialBookingFormValues), []);

  // Still to build, in this file so both apps get it: validation against BOOKING_RULES (including
  // the per-pet daily limit), the live price quote from the pricing API, and submit.

  return { values, setField, reset };
}
