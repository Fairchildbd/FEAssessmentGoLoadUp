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
        const hasStart = startTime !== '';
        const hasRange = hasStart && endTime !== '';
        const errorMessage = fieldState.error?.message;
        const rangeLength = hasRange ? formatHours(hoursBetween(startTime, endTime)) : undefined;
        const fieldText = hasRange
          ? `${displayTime(startTime)} – ${displayTime(endTime)}`
          : hasStart
            ? `${displayTime(startTime)} – `
            : '';
        const shrinkLabel = open || hasStart || undefined;
        const startOptions = START_TIMES.map((time) => ({
          time,
          label: displayTime(time),
          selected: time === startTime,
          disabled: hasStartPassed(serviceDate, time),
        }));
        const endOptions = endTimeOptions(startTime).map((time) => ({
          time,
          label: displayTime(time),
          length: formatHours(hoursBetween(startTime, time)),
          selected: time === endTime,
        }));

        const openPicker = () => setOpen(true);

        const close = () => {
          setOpen(false);
          field.onBlur();
        };

        const pickStart = (newStart: string) => {
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
            openPicker();
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
              value={fieldText}
              onClick={openPicker}
              onKeyDown={openOnKey}
              error={Boolean(errorMessage)}
              helperText={errorMessage ?? rangeLength}
              slotProps={{
                inputLabel: { shrink: shrinkLabel },
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
                  autoFocusItem={!hasStart}
                  className="max-h-72 w-40 overflow-y-auto"
                  subheader={<ListSubheader>Start</ListSubheader>}
                >
                  {startOptions.map((option) => (
                    <MenuItem
                      key={option.time}
                      selected={option.selected}
                      disabled={option.disabled}
                      onClick={() => pickStart(option.time)}
                    >
                      {option.label}
                    </MenuItem>
                  ))}
                </MenuList>

                <MenuList
                  aria-label="End time"
                  className="max-h-72 w-48 overflow-y-auto border-0 border-l border-solid border-outline-variant"
                  subheader={<ListSubheader>End</ListSubheader>}
                >
                  {!hasStart ? (
                    <li className="px-md py-sm text-body-small text-on-surface-variant">
                      Choose a start time first
                    </li>
                  ) : (
                    endOptions.map((option) => (
                      <MenuItem
                        key={option.time}
                        selected={option.selected}
                        onClick={() => pickEnd(option.time)}
                      >
                        {option.label}
                        <span className="ml-sm text-body-small text-on-surface-variant">
                          {option.length}
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
