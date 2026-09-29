import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { DATE_FORMAT } from '@pet-sitting/shared/date-time';
import { format } from 'date-fns/format';
import { isValid } from 'date-fns/isValid';
import { parse } from 'date-fns/parse';
import { useState, type KeyboardEvent, type Ref } from 'react';

export interface WebDatePickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onClose?: () => void;
  disablePast?: boolean;
  name?: string;
  inputRef?: Ref<HTMLInputElement>;
  error?: string;
}

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
  const pickedDate = value ? parse(value, DATE_FORMAT, new Date()) : null;
  const openCalendar = () => setOpen(true);
  const openBeforeReadOnlyFieldSwallowsClick = openCalendar;
  const closeCalendar = () => {
    setOpen(false);
    onClose?.();
  };
  const changeDate = (date: Date | null) =>
    onChange(date && isValid(date) ? format(date, DATE_FORMAT) : '');
  const openOnEnterOrSpace = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openCalendar();
    }
  };

  return (
    <DatePicker
      label={label}
      disablePast={disablePast}
      open={open}
      onOpen={openCalendar}
      onClose={closeCalendar}
      value={pickedDate}
      onChange={changeDate}
      inputRef={inputRef}
      slotProps={{
        field: {
          readOnly: true,
          onMouseDown: openBeforeReadOnlyFieldSwallowsClick,
          onKeyDown: openOnEnterOrSpace,
        },
        textField: { name, fullWidth: true, error: Boolean(error), helperText: error },
      }}
    />
  );
}
