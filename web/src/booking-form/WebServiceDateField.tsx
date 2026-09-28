import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import type { BookingFormValues, BookingRequest } from '@pet-sitting/shared/booking-form';
import { DATE_FORMAT } from '@pet-sitting/shared/date-time';
import { format } from 'date-fns/format';
import { isValid } from 'date-fns/isValid';
import { parse } from 'date-fns/parse';
import { useState } from 'react';
import { Controller, type Control } from 'react-hook-form';

interface WebServiceDateFieldProps {
  control: Control<BookingFormValues, unknown, BookingRequest>;
}

/**
 * The service date. The field is read-only, so the date can only be picked from the calendar, and
 * clicking anywhere on it (the text or the calendar icon) opens the calendar.
 *
 * The form stores 'YYYY-MM-DD' strings; the picker works in Date objects, so date-fns converts.
 */
export function WebServiceDateField({ control }: WebServiceDateFieldProps) {
  const [open, setOpen] = useState(false);

  return (
    <Controller
      name="serviceDate"
      control={control}
      render={({ field, fieldState }) => (
        <DatePicker
          label="Date"
          disablePast
          open={open}
          onOpen={() => setOpen(true)}
          onClose={() => {
            setOpen(false);
            field.onBlur(); // counts as leaving the field, so its error can show
          }}
          value={field.value ? parse(field.value, DATE_FORMAT, new Date()) : null}
          onChange={(date) =>
            field.onChange(date && isValid(date) ? format(date, DATE_FORMAT) : '')
          }
          inputRef={field.ref}
          slotProps={{
            field: {
              // Overrides the picker's readOnly for the field only: no typing, but it still opens.
              readOnly: true,
              // A read-only field cancels its own click, so open on mousedown instead.
              onMouseDown: () => setOpen(true),
              onKeyDown: (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setOpen(true);
                }
              },
            },
            textField: {
              name: field.name,
              fullWidth: true,
              error: Boolean(fieldState.error),
              helperText: fieldState.error?.message,
            },
          }}
        />
      )}
    />
  );
}
