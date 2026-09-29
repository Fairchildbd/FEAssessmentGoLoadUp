import { expect, test, type Page } from '@playwright/test';
import { fillPet, pickDate, pickTime, submitButton } from './bookingFormHelpers';

test.use({ reducedMotion: 'reduce' });

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-01T16:00:00Z'));
});

const cardTitles = (page: Page) =>
  page.getByRole('region', { name: 'Schedule' }).getByRole('heading', { level: 2 });

test('groups a day’s bookings by start time, earliest first', async ({ page }) => {
  await page.goto('/admin?date=2026-10-03');

  await expect(cardTitles(page)).toHaveText([
    '2 appointments starting at 9:00 AM',
    '1 appointment starting at 11:00 AM',
  ]);
  const nineOClock = page.getByRole('article', { name: '2 appointments starting at 9:00 AM' });
  const earnings = page.getByTestId('day-earnings');
  await expect(earnings).toHaveText('$120');
  const title = await page.getByRole('heading', { level: 1, name: 'Bookings' }).boundingBox();
  const total = await earnings.boundingBox();
  const schedule = await page.getByRole('region', { name: 'Schedule' }).boundingBox();
  expect(Math.abs(total!.y - title!.y)).toBeLessThan(4);
  expect(Math.abs(total!.x + total!.width - (schedule!.x + schedule!.width))).toBeLessThan(2);

  const appointments = nineOClock.getByRole('listitem', { name: 'Jordan Rivera' });
  await expect(appointments).toHaveCount(2);
  await expect(appointments.first()).toContainText('9:00 AM – 11:00 AM · 2 hours · 1 pet');
  await expect(appointments.first()).toContainText('Biscuit (Dog)');
  await expect(appointments.last()).toContainText('Maple (Dog)');
});

test('switches days with the date picker and the previous and next buttons', async ({ page }) => {
  await page.goto('/admin');
  await expect(page.getByText('Thursday, October 1, 2026')).toBeVisible();
  await expect(page.getByText('No bookings on this day.')).toBeVisible();
  await expect(page.getByTestId('day-earnings')).toHaveText('$0');

  await pickDate(page, '5', 'Day');
  await expect(page).toHaveURL(/date=2026-10-05/);
  await expect(cardTitles(page)).toHaveText([
    '1 appointment starting at 9:00 AM',
    '1 appointment starting at 10:00 AM',
  ]);

  await page.getByRole('button', { name: 'Next day' }).click();
  await expect(page.getByText('Tuesday, October 6, 2026')).toBeVisible();
  await expect(page.getByText('No bookings on this day.')).toBeVisible();

  await page.goto('/admin?date=2026-10-11');
  await page.getByRole('button', { name: 'Previous day' }).click();
  await expect(cardTitles(page)).toHaveText([
    '1 appointment starting at 8:00 AM',
    '1 appointment starting at 10:00 AM',
    '1 appointment starting at 12:00 PM',
  ]);
  await expect(page.getByText('Cancelled')).toBeVisible();
  await expect(page.getByTestId('day-earnings')).toHaveText('$180');
});

test('one submission is one appointment, with all its pets under the customer', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'First name' }).fill('Ben');
  await page.getByRole('textbox', { name: 'Last name' }).fill('Fairchild');
  const pets = [
    ['Oscar', 'Dog'],
    ['Sulley', 'Dog'],
    ['Mittens', 'Cat'],
    ['Babe', 'Pig'],
  ] as const;
  for (const [index, [name, type]] of pets.entries()) {
    if (index > 0) await page.getByRole('button', { name: 'Add another pet' }).click();
    await fillPet(page, index, name, type);
  }
  await pickDate(page, '3');
  await pickTime(page, '8:30 AM', '4:30 PM');
  await submitButton(page).click();

  await expect(page.getByRole('alert')).toContainText('Booked Oscar, Sulley, Mittens, and Babe.');
  await page.getByRole('link', { name: "See the day's bookings" }).click();

  await expect(page).toHaveURL(/\/admin\?date=2026-10-03/);
  await expect(cardTitles(page)).toHaveText([
    '1 appointment starting at 8:30 AM',
    '2 appointments starting at 9:00 AM',
    '1 appointment starting at 11:00 AM',
  ]);
  const appointment = page
    .getByRole('article', { name: '1 appointment starting at 8:30 AM' })
    .getByRole('listitem', { name: 'Ben Fairchild' });
  await expect(appointment).toContainText('8:30 AM – 4:30 PM · 8 hours · 4 pets');
  await expect(
    appointment.getByRole('list', { name: "Ben Fairchild's pets" }).getByRole('listitem'),
  ).toHaveText([
    /^Oscar \(Dog\)\s*\$80$/,
    /^Sulley \(Dog\)\s*\$80$/,
    /^Mittens \(Cat\)\s*\$40$/,
    /^Babe \(Pig\)\s*\$160$/,
    /^Base charge\s*\$20$/,
  ]);
  await expect(appointment).toContainText('$380');
  await expect(page.getByTestId('day-earnings')).toHaveText('$500');

  await page.getByRole('tab', { name: 'Book a sitter' }).click();
  await expect(page.getByRole('heading', { name: 'Book a pet sitter' })).toBeVisible();
  await page.getByRole('tab', { name: 'Admin' }).click();
  await expect(page.getByRole('heading', { name: 'Bookings' })).toBeVisible();
});

test("refuses a booking that overlaps one of the pet's bookings", async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'First name' }).fill('Jordan');
  await page.getByRole('textbox', { name: 'Last name' }).fill('Rivera');
  await fillPet(page, 0, 'Biscuit', 'Dog');
  await pickDate(page, '3');
  await pickTime(page, '10:00 AM', '12:00 PM');
  await submitButton(page).click();

  await expect(page.getByRole('alert')).toHaveText(
    'Biscuit already has a booking from 9:00 AM to 11:00 AM that day',
  );
  await expect(page.getByRole('textbox', { name: "Pet's name" })).toHaveValue('Biscuit');
});
