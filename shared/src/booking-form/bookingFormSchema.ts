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

const { minHours, maxHours, serviceHours, timeStepMinutes, maxNameLength } = BOOKING_RULES;

const requiredText = (message: string) =>
  z.string().trim().min(1, message).max(maxNameLength, `Use ${maxNameLength} characters or fewer`);

const pet = z.object({
  name: requiredText("Enter your pet's name"),
  animalType: z
    .enum(ANIMAL_TYPES)
    .nullable()
    .refine((value): value is AnimalType => value !== null, 'Choose an animal type'),
});

const pets = z
  .array(pet)
  .min(1, 'Add a pet')
  .superRefine((list, context) => {
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
    if (startTime < serviceHours.start || endTime > serviceHours.end) {
      return fail(`Book between ${serviceHours.start} and ${serviceHours.end}`);
    }

    const hours = hoursBetween(startTime, endTime);
    if (hours <= 0) return fail('End after the start time');
    if (hours < minHours) return fail(`Book at least ${minHours} hours`);
    if (hours > maxHours) return fail(`Book at most ${maxHours} hours`);
  });

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
    { when: (payload) => schedule.safeParse(payload.value).success },
  );

export type BookingFormValues = z.input<typeof bookingFormSchema>;

export type BookingRequest = z.output<typeof bookingFormSchema>;

export type PetFormValues = BookingFormValues['pets'][number];
