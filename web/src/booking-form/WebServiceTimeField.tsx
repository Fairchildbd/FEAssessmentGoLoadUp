import AccessTimeIcon from '@mui/icons-material/AccessTime';
import InputAdornment from '@mui/material/InputAdornment';
import ListSubheader from '@mui/material/ListSubheader';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import Popover from '@mui/material/Popover';
import TextField from '@mui/material/TextField';
import type { BookingFormValues, BookingRequest } from '@pet-sitting/shared/booking-form';
import {
  displayTime,
  hoursBetween,
  parseDateTime,
  TIME_FORMAT,
} from '@pet-sitting/shared/date-time';
import { BOOKING_RULES } from '@pet-sitting/shared/domain';
import { addMinutes } from 'date-fns/addMinutes';
import { format } from 'date-fns/format';
import { isAfter } from 'date-fns/isAfter';
import { isBefore } from 'date-fns/isBefore';
import { parse } from 'date-fns/parse';
import { useRef, useState, type KeyboardEvent } from 'react';
import { Controller, useWatch, type Control } from 'react-hook-form';

const { minHours, maxHours, serviceHours, timeStepMinutes } = BOOKING_RULES;

const pluralHours = (hours: number) => `${hours} ${hours === 1 ? 'hour' : 'hours'}`;

const toTime = (time: string) => parse(time, TIME_FORMAT, new Date());
const timePlusHours = (time: string, hours: number) =>
  format(addMinutes(toTime(time), hours * 60), TIME_FORMAT);

/** Times every half hour from `first` to `last`, both included. */
function timesBetween(first: Date, last: Date): string[] {
  const options: string[] = [];
  for (let time = first; !isAfter(time, last); time = addMinutes(time, timeStepMinutes)) {
    options.push(format(time, TIME_FORMAT));
  }
  return options;
}

/** Every half hour from opening until the last start that still fits the minimum before closing. */
const START_TIMES = timesBetween(
  toTime(serviceHours.start),
  addMinutes(toTime(serviceHours.end), -minHours * 60),
);

/**
 * Every half hour from 2 to 8 hours after the start, stopping at closing. Nothing shorter or longer
 * is offered, so the user can't pick a length outside the limits.
 */
function endTimeOptions(startTime: string): string[] {
  if (!startTime) return [];
  const start = toTime(startTime);
  const closing = toTime(serviceHours.end); // same day as `start`, so they compare correctly
  // Compared as Dates: as 'HH:mm' strings, 18:00 + 8 hours would wrap around to '02:00'.
  const latest = addMinutes(start, maxHours * 60);
  return timesBetween(
    addMinutes(start, minHours * 60),
    isAfter(latest, closing) ? closing : latest,
  );
}

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

  // On today's date, start times that have passed can't be picked.
  const hasPassed = (startTime: string) =>
    serviceDate !== '' && isBefore(parseDateTime(serviceDate, startTime), new Date());

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
          const previousHours = hoursBetween(startTime, endTime);
          const keptEnd = previousHours > 0 ? timePlusHours(newStart, previousHours) : '';
          const newEnd = endTimeOptions(newStart).includes(keptEnd) ? keptEnd : '';
          field.onChange({ startTime: newStart, endTime: newEnd });
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
              helperText={fieldState.error?.message ?? (hasRange ? pluralHours(hours) : undefined)}
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
                      disabled={hasPassed(time)}
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
                          {pluralHours(hoursBetween(startTime, time))}
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
