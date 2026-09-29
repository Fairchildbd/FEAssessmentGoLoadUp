import AccessTimeIcon from '@mui/icons-material/AccessTime';
import InputAdornment from '@mui/material/InputAdornment';
import ListSubheader from '@mui/material/ListSubheader';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import Popover from '@mui/material/Popover';
import TextField from '@mui/material/TextField';
import type { BookingFormValues, BookingRequest } from '@pet-sitting/shared/booking-form';
import { displayTime, formatHours, hoursBetween } from '@pet-sitting/shared/date-time';
import {
  endTimeForNewStart,
  endTimeOptions,
  hasStartPassed,
  startTimeOptions,
} from '@pet-sitting/shared/service-time';
import { useRef, useState, type KeyboardEvent } from 'react';
import { Controller, useWatch, type Control } from 'react-hook-form';

const START_TIMES = startTimeOptions();

interface WebServiceTimeFieldProps {
  control: Control<BookingFormValues, unknown, BookingRequest>;
}

/**
 * The start and end time in one input. Clicking it opens a panel with a Start column and an End
 * column; the number of hours comes from the two, so there's no separate hours input. The End
 * column only lists times 2 to 8 hours after the start.
 */
export function WebServiceTimeField({ control }: WebServiceTimeFieldProps) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const serviceDate = useWatch({ control, name: 'serviceDate' });

  return (
    <Controller
      name="serviceTime"
      control={control}
      render={({ field, fieldState }) => {
        const { startTime, endTime } = field.value;
        const hours = hoursBetween(startTime, endTime);
        const hasRange = startTime !== '' && endTime !== '';

        const close = () => {
          setOpen(false);
          field.onBlur(); // counts as leaving the field, so its error can show
        };

        const pickStart = (newStart: string) => {
          // Keep the same number of hours if they still fit before closing; otherwise pick again.
          field.onChange({
            startTime: newStart,
            endTime: endTimeForNewStart(field.value, newStart),
          });
        };

        const pickEnd = (newEnd: string) => {
          field.onChange({ startTime, endTime: newEnd });
          close();
        };

        const openOnKey = (event: KeyboardEvent) => {
          if (['Enter', ' ', 'ArrowDown'].includes(event.key)) {
            event.preventDefault();
            setOpen(true);
          }
        };

        return (
          <>
            <TextField
              ref={anchorRef}
              inputRef={field.ref}
              name={field.name}
              label="Time"
              placeholder="Start – end"
              fullWidth
              value={
                hasRange
                  ? `${displayTime(startTime)} – ${displayTime(endTime)}`
                  : startTime
                    ? `${displayTime(startTime)} – `
                    : ''
              }
              onClick={() => setOpen(true)}
              onKeyDown={openOnKey}
              error={Boolean(fieldState.error)}
              helperText={fieldState.error?.message ?? (hasRange ? formatHours(hours) : undefined)}
              slotProps={{
                inputLabel: { shrink: open || startTime !== '' || undefined },
                input: {
                  readOnly: true,
                  className: 'cursor-pointer',
                  endAdornment: (
                    <InputAdornment position="end">
                      <AccessTimeIcon />
                    </InputAdornment>
                  ),
                },
                htmlInput: {
                  className: 'cursor-pointer',
                  'aria-haspopup': 'dialog',
                  'aria-expanded': open,
                },
              }}
            />

            <Popover
              open={open}
              anchorEl={anchorRef.current}
              onClose={close}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              slotProps={{ paper: { role: 'dialog', 'aria-label': 'Choose a start and end time' } }}
            >
              <div className="flex">
                <MenuList
                  aria-label="Start time"
                  autoFocusItem={startTime === ''}
                  className="max-h-72 w-40 overflow-y-auto"
                  subheader={<ListSubheader>Start</ListSubheader>}
                >
                  {START_TIMES.map((time) => (
                    <MenuItem
                      key={time}
                      selected={time === startTime}
                      disabled={hasStartPassed(serviceDate, time)} // on today's date
                      onClick={() => pickStart(time)}
                    >
                      {displayTime(time)}
                    </MenuItem>
                  ))}
                </MenuList>

                <MenuList
                  aria-label="End time"
                  className="max-h-72 w-48 overflow-y-auto border-0 border-l border-solid border-outline-variant"
                  subheader={<ListSubheader>End</ListSubheader>}
                >
                  {startTime === '' ? (
                    <li className="px-md py-sm text-body-small text-on-surface-variant">
                      Choose a start time first
                    </li>
                  ) : (
                    endTimeOptions(startTime).map((time) => (
                      <MenuItem
                        key={time}
                        selected={time === endTime}
                        onClick={() => pickEnd(time)}
                      >
                        {displayTime(time)}
                        <span className="ml-sm text-body-small text-on-surface-variant">
                          {formatHours(hoursBetween(startTime, time))}
                        </span>
                      </MenuItem>
                    ))
                  )}
                </MenuList>
              </div>
            </Popover>
          </>
        );
      }}
    />
  );
}
