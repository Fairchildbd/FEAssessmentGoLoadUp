import { addHours } from 'date-fns/addHours';
import { format } from 'date-fns/format';
import { getMinutes } from 'date-fns/getMinutes';
import { isAfter } from 'date-fns/isAfter';
import { isBefore } from 'date-fns/isBefore';
import { parse } from 'date-fns/parse';
import { startOfToday } from 'date-fns/startOfToday';
import { subHours } from 'date-fns/subHours';
import { z } from 'zod';
import { DATE_FORMAT, matchesFormat, parseDateTime, TIME_FORMAT } from '../date-time/localDateTime';
import { ANIMAL_TYPES, BOOKING_RULES, type AnimalType } from '../domain/bookingDomain';

/**
 * Validation for the booking form. It lives in shared/ so web, mobile and (later) the mock API all
 * apply the same rules. useBookingForm.ts connects it to React Hook Form through zodResolver.
 */

const { minHours, maxHours, serviceHours, startTimeStepMinutes, maxNameLength } = BOOKING_RULES;

const requiredText = (message: string) =>
  z.string().trim().min(1, message).max(maxNameLength, `Use ${maxNameLength} characters or fewer`);

const hoursRequested = z
  .number({ error: 'Choose how many hours' })
  .int('Choose whole hours')
  .min(minHours, `Book at least ${minHours} hours`)
  .max(maxHours, `Book at most ${maxHours} hours`);

const serviceDate = z
  .string()
  .min(1, 'Choose a date')
  .refine((date) => matchesFormat(date, DATE_FORMAT), 'Enter a real date as YYYY-MM-DD')
  .refine(
    (date) => !isBefore(parse(date, DATE_FORMAT, new Date()), startOfToday()),
    'Choose today or a later date',
  );

const startTime = z
  .string()
  .min(1, 'Choose a start time')
  .refine((time) => matchesFormat(time, TIME_FORMAT), 'Enter a time as HH:mm')
  .refine(
    (time) => getMinutes(parse(time, TIME_FORMAT, new Date())) % startTimeStepMinutes === 0,
    'Start on the hour or half hour',
  );

/** The fields the schedule check below needs. */
const schedule = z.object({ serviceDate, startTime, hoursRequested });

export const bookingFormSchema = z
  .object({
    firstName: requiredText('Enter your first name'),
    lastName: requiredText('Enter your last name'),
    animalName: requiredText("Enter your pet's name"),
    // Starts as null (nothing selected). A valid form narrows it to an AnimalType.
    animalType: z
      .enum(ANIMAL_TYPES)
      .nullable()
      .refine((value): value is AnimalType => value !== null, 'Choose an animal type'),
    hoursRequested,
    serviceDate,
    startTime,
  })
  .superRefine(
    (values, context) => {
      const start = parseDateTime(values.serviceDate, values.startTime);
      const opening = parseDateTime(values.serviceDate, serviceHours.start);
      const closing = parseDateTime(values.serviceDate, serviceHours.end);

      // The booking has to end by closing time, so the latest start depends on its length.
      if (isBefore(start, opening) || isAfter(addHours(start, values.hoursRequested), closing)) {
        const latestStart = format(subHours(closing, values.hoursRequested), TIME_FORMAT);
        context.addIssue({
          code: 'custom',
          path: ['startTime'],
          message: `For ${values.hoursRequested} hours, start between ${serviceHours.start} and ${latestStart}`,
        });
      }

      if (!isAfter(start, new Date())) {
        context.addIssue({
          code: 'custom',
          path: ['startTime'],
          message: 'That time has already passed',
        });
      }
    },
    // Zod skips object-level checks until every field is valid. Run this one as soon as the
    // schedule fields are, so the start-time error shows even while a name is still empty.
    { when: (payload) => schedule.safeParse(payload.value).success },
  );

/** What the form holds while someone edits it: animalType can still be null. */
export type BookingFormValues = z.input<typeof bookingFormSchema>;

/** What a valid form submits: names trimmed and an animal type chosen. */
export type BookingRequest = z.output<typeof bookingFormSchema>;
