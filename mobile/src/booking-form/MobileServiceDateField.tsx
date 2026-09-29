import type { BookingFormValues, BookingRequest } from '@pet-sitting/shared/booking-form';
import { Controller, type Control } from 'react-hook-form';
import { MobileDatePicker } from '../components/MobileDatePicker';

interface MobileServiceDateFieldProps {
  control: Control<BookingFormValues, unknown, BookingRequest>;
}

export function MobileServiceDateField({ control }: MobileServiceDateFieldProps) {
  return (
    <Controller
      name="serviceDate"
      control={control}
      render={({ field, fieldState }) => (
        <MobileDatePicker
          label="Date"
          disablePast
          value={field.value}
          onChange={field.onChange}
          onClose={field.onBlur}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}
