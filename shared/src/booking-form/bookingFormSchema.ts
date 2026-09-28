import { getMinutes } from 'date-fns/getMinutes';
import { isAfter } from 'date-fns/isAfter';
import { isBefore } from 'date-fns/isBefore';
import { parse } from 'date-fns/parse';
import { startOfToday } from 'date-fns/startOfToday';
import { z } from 'zod';
import {
  DATE_FORMAT,
  hoursBetween,
  matchesFormat,
  parseDateTime,
  TIME_FORMAT,
} from '../date-time/localDateTime';
import { ANIMAL_TYPES, BOOKING_RULES, type AnimalType } from '../domain/bookingDomain';

/**
 * Validation for the booking form. It lives in shared/ so web and mobile apply the same rules.
 * useBookingForm.ts connects it to React Hook Form through zodResolver.
 *
 * One request covers several pets for the same date and time: Oscar and Sulley both get sat from
 * 09:00 to 17:00.
 */

const { minHours, maxHours, serviceHours, timeStepMinutes, maxNameLength } = BOOKING_RULES;

const requiredText = (message: string) =>
  z.string().trim().min(1, message).max(maxNameLength, `Use ${maxNameLength} characters or fewer`);

const pet = z.object({
  name: requiredText("Enter your pet's name"),
  // Starts as null (nothing selected). A valid form narrows it to an AnimalType.
  animalType: z
    .enum(ANIMAL_TYPES)
    .nullable()
    .refine((value): value is AnimalType => value !== null, 'Choose an animal type'),
});

const pets = z
  .array(pet)
  .min(1, 'Add a pet')
  .superRefine((list, context) => {
    // Assumption: a pet is identified by name + animal type, so listing one twice is a mistake.
    const seen = new Set<string>();
    list.forEach(({ name, animalType }, index) => {
      if (!name || !animalType) return;
      const key = `${name.toLowerCase()}|${animalType}`;
      if (seen.has(key)) {
        context.addIssue({
          code: 'custom',
          path: [index, 'name'],
          message: `${name} is already on this request`,
        });
      }
      seen.add(key);
    });
  });

const serviceDate = z
  .string()
  .min(1, 'Choose a date')
  .refine((date) => matchesFormat(date, DATE_FORMAT), 'Enter a real date as YYYY-MM-DD')
  .refine(
    (date) => !isBefore(parse(date, DATE_FORMAT, new Date()), startOfToday()),
    'Choose today or a later date',
  );

/**
 * The start and end time, picked together in one input. The number of hours comes from the two, so
 * the 2 to 8 hour limits are checked here rather than on a separate hours field. The web picker only
 * offers end times 2 to 8 hours after the start, so these errors guard against bad data rather than
 * normal use. Only the first
 * problem is reported, since later checks assume the earlier ones passed.
 */
const serviceTime = z
  .object({ startTime: z.string(), endTime: z.string() })
  .superRefine(({ startTime, endTime }, context) => {
    const fail = (message: string) => context.addIssue({ code: 'custom', message });

    if (startTime === '' || endTime === '') return fail('Choose a start and end time');
    if (!matchesFormat(startTime, TIME_FORMAT) || !matchesFormat(endTime, TIME_FORMAT)) {
      return fail('Enter times as HH:mm');
    }
    const onStep = (time: string) =>
      getMinutes(parse(time, TIME_FORMAT, new Date())) % timeStepMinutes === 0;
    if (!onStep(startTime) || !onStep(endTime))
      return fail('Choose times on the hour or half hour');
    // 'HH:mm' strings sort in time order, so they can be compared directly.
    if (startTime < serviceHours.start || endTime > serviceHours.end) {
      return fail(`Book between ${serviceHours.start} and ${serviceHours.end}`);
    }

    const hours = hoursBetween(startTime, endTime);
    if (hours <= 0) return fail('End after the start time');
    if (hours < minHours) return fail(`Book at least ${minHours} hours`);
    if (hours > maxHours) return fail(`Book at most ${maxHours} hours`);
  });

/** The fields the "already passed" check below needs. */
const schedule = z.object({ serviceDate, serviceTime });

export const bookingFormSchema = z
  .object({
    firstName: requiredText('Enter your first name'),
    lastName: requiredText('Enter your last name'),
    pets,
    serviceDate,
    serviceTime,
  })
  .superRefine(
    (values, context) => {
      const start = parseDateTime(values.serviceDate, values.serviceTime.startTime);
      if (!isAfter(start, new Date())) {
        context.addIssue({
          code: 'custom',
          path: ['serviceTime'],
          message: 'That start time has already passed',
        });
      }
    },
    // Zod skips object-level checks until every field is valid. Run this one as soon as the date
    // and time are, so the error shows even while a name is still empty.
    { when: (payload) => schedule.safeParse(payload.value).success },
  );

/** What the form holds while someone edits it: an animalType can still be null. */
export type BookingFormValues = z.input<typeof bookingFormSchema>;

/** What a valid form submits: names trimmed and every animal type chosen. */
export type BookingRequest = z.output<typeof bookingFormSchema>;

/** One pet row in the form. */
export type PetFormValues = BookingFormValues['pets'][number];
