import type { BookingFormValues, BookingRequest } from '@pet-sitting/shared/booking-form';
import { Controller, type Control } from 'react-hook-form';
import { WebDatePicker } from '../components/WebDatePicker';

interface WebServiceDateFieldProps {
  control: Control<BookingFormValues, unknown, BookingRequest>;
}

/** The booking form's service date: the shared date picker, bound to React Hook Form. */
export function WebServiceDateField({ control }: WebServiceDateFieldProps) {
  return (
    <Controller
      name="serviceDate"
      control={control}
      render={({ field, fieldState }) => (
        <WebDatePicker
          label="Date"
          disablePast
          value={field.value}
          onChange={field.onChange}
          onClose={field.onBlur} // closing the calendar counts as leaving the field
          name={field.name}
          inputRef={field.ref}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}
