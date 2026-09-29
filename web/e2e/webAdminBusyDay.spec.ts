import { expect, test, type Page } from '@playwright/test';
import { fillPet, pickDate, pickTime, submitButton } from './bookingFormHelpers';

test.use({ reducedMotion: 'reduce' });

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-01T16:00:00Z'));
});

interface Appointment {
  firstName: string;
  lastName: string;
  pets: { name: string; type: 'Dog' | 'Cat' | 'Pig' }[];
  start: string;
  end: string;
}

const BUSY_DAY_OF_OCTOBER = '12';
const TWO_MINUTES = 120_000;
const NO_TIME_LIMIT = 0;
const watchingInSlowMotion = Boolean(process.env.SLOW_MO);

const overlappingAppointments: Appointment[] = [
  {
    firstName: 'Avery',
    lastName: 'Chen',
    pets: [{ name: 'Oscar', type: 'Dog' }],
    start: '7:00 AM',
    end: '9:00 AM',
  },
  {
    firstName: 'Blake',
    lastName: 'Diaz',
    pets: [{ name: 'Luna', type: 'Cat' }],
    start: '7:00 AM',
    end: '11:00 AM',
  },
  {
    firstName: 'Casey',
    lastName: 'Ellis',
    pets: [{ name: 'Pork Chop', type: 'Pig' }],
    start: '7:30 AM',
    end: '10:30 AM',
  },
  {
    firstName: 'Devon',
    lastName: 'Fox',
    pets: [
      { name: 'Max', type: 'Dog' },
      { name: 'Ruby', type: 'Dog' },
    ],
    start: '8:00 AM',
    end: '12:00 PM',
  },
  {
    firstName: 'Emery',
    lastName: 'Gray',
    pets: [{ name: 'Mochi', type: 'Cat' }],
    start: '8:00 AM',
    end: '10:00 AM',
  },
  {
    firstName: 'Finley',
    lastName: 'Hart',
    pets: [{ name: 'Bacon', type: 'Pig' }],
    start: '9:00 AM',
    end: '5:00 PM',
  },
  {
    firstName: 'Harper',
    lastName: 'Ito',
    pets: [{ name: 'Cooper', type: 'Dog' }],
    start: '9:00 AM',
    end: '11:30 AM',
  },
  {
    firstName: 'Jules',
    lastName: 'Lane',
    pets: [{ name: 'Pepper', type: 'Cat' }],
    start: '10:30 AM',
    end: '1:00 PM',
  },
  {
    firstName: 'Kai',
    lastName: 'Moreno',
    pets: [{ name: 'Nala', type: 'Dog' }],
    start: '12:00 PM',
    end: '3:00 PM',
  },
  {
    firstName: 'Logan',
    lastName: 'Nash',
    pets: [
      { name: 'Hazel', type: 'Cat' },
      { name: 'Truffle', type: 'Pig' },
    ],
    start: '12:00 PM',
    end: '6:00 PM',
  },
];

async function bookThroughTheForm(page: Page, appointment: Appointment) {
  await page.getByRole('textbox', { name: 'First name' }).fill(appointment.firstName);
  await page.getByRole('textbox', { name: 'Last name' }).fill(appointment.lastName);
  for (const [index, pet] of appointment.pets.entries()) {
    if (index > 0) await page.getByRole('button', { name: 'Add another pet' }).click();
    await fillPet(page, index, pet.name, pet.type);
  }
  await pickDate(page, BUSY_DAY_OF_OCTOBER);
  await pickTime(page, appointment.start, appointment.end);
  await submitButton(page).click();

  const petNames = appointment.pets.map((pet) => pet.name).join(' and ');
  await expect(page.getByRole('alert')).toContainText(`Booked ${petNames}.`);
}

const cardTitles = (page: Page) =>
  page.getByRole('region', { name: 'Schedule' }).getByRole('heading', { level: 2 });

const customerNamesInCard = (page: Page, cardTitle: string) =>
  page
    .getByRole('article', { name: cardTitle })
    .locator('li[aria-label]')
    .evaluateAll((appointments) =>
      appointments.map((appointment) => appointment.getAttribute('aria-label')),
    );

test('shows ten overlapping appointments grouped by start time, with the day’s earnings', async ({
  page,
}) => {
  test.setTimeout(watchingInSlowMotion ? NO_TIME_LIMIT : TWO_MINUTES);

  await page.goto('/');
  for (const appointment of overlappingAppointments) {
    await bookThroughTheForm(page, appointment);
  }

  await page.getByRole('link', { name: "See the day's bookings" }).click();
  await expect(page).toHaveURL(/\/admin\?date=2026-10-12/);

  await expect(cardTitles(page)).toHaveText([
    '2 appointments starting at 7:00 AM',
    '1 appointment starting at 7:30 AM',
    '2 appointments starting at 8:00 AM',
    '2 appointments starting at 9:00 AM',
    '1 appointment starting at 10:30 AM',
    '2 appointments starting at 12:00 PM',
  ]);

  const expectedCardContents: [string, string[]][] = [
    ['2 appointments starting at 7:00 AM', ['Avery Chen', 'Blake Diaz']],
    ['1 appointment starting at 7:30 AM', ['Casey Ellis']],
    ['2 appointments starting at 8:00 AM', ['Emery Gray', 'Devon Fox']],
    ['2 appointments starting at 9:00 AM', ['Harper Ito', 'Finley Hart']],
    ['1 appointment starting at 10:30 AM', ['Jules Lane']],
    ['2 appointments starting at 12:00 PM', ['Kai Moreno', 'Logan Nash']],
  ];
  for (const [cardTitle, customerNames] of expectedCardContents) {
    expect(await customerNamesInCard(page, cardTitle)).toEqual(customerNames);
  }

  const devonsAppointment = page.getByRole('listitem', { name: 'Devon Fox' });
  await expect(devonsAppointment).toContainText('8:00 AM – 12:00 PM · 4 hours · 2 pets');
  await expect(devonsAppointment).toContainText('$100');

  const julesAppointment = page.getByRole('listitem', { name: 'Jules Lane' });
  await expect(julesAppointment).toContainText('10:30 AM – 1:00 PM · 2.5 hours · 1 pet');
  await expect(julesAppointment).toContainText('$32.50');

  await expect(page.getByTestId('day-earnings')).toHaveText('$767.50');
});
