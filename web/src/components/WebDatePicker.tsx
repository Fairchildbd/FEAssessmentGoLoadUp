import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { DATE_FORMAT } from '@pet-sitting/shared/date-time';
import { format } from 'date-fns/format';
import { isValid } from 'date-fns/isValid';
import { parse } from 'date-fns/parse';
import { useState, type Ref } from 'react';

export interface WebDatePickerProps {
  label: string;
  /** 'YYYY-MM-DD', or '' for no date. */
  value: string;
  onChange: (value: string) => void;
  /** Called when the calendar closes, which counts as leaving the field. */
  onClose?: () => void;
  disablePast?: boolean;
  name?: string;
  inputRef?: Ref<HTMLInputElement>;
  error?: string;
}

/**
 * A date picker that only picks from the calendar: the field is read-only, and clicking anywhere on
 * it (the text or the calendar icon) opens the calendar. Used by the booking form and the admin page.
 *
 * It takes and returns 'YYYY-MM-DD' strings; MUI's picker works in Date objects, so date-fns converts.
 */
export function WebDatePicker({
  label,
  value,
  onChange,
  onClose,
  disablePast,
  name,
  inputRef,
  error,
}: WebDatePickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <DatePicker
      label={label}
      disablePast={disablePast}
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => {
        setOpen(false);
        onClose?.();
      }}
      value={value ? parse(value, DATE_FORMAT, new Date()) : null}
      onChange={(date) => onChange(date && isValid(date) ? format(date, DATE_FORMAT) : '')}
      inputRef={inputRef}
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
        textField: { name, fullWidth: true, error: Boolean(error), helperText: error },
      }}
    />
  );
}
