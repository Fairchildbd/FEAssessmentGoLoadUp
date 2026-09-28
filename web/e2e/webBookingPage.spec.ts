import { expect, test } from '@playwright/test';
import { fillPet, pickDate, pickTime, submitButton } from './bookingFormHelpers';

// The date picker ignores a click that lands while its calendar is still animating open, which
// only a test is fast enough to do. Reduced motion turns the animation off.
test.use({ reducedMotion: 'reduce' });

// A fixed "now": noon on 1 Oct 2026 in New York, the time zone set in playwright.config.ts.
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-01T16:00:00Z'));
  await page.goto('/');
});

test('opens the date picker from anywhere on the field and blocks typing', async ({ page }) => {
  const dateField = page.getByRole('group', { name: 'Date' });

  await dateField.getByText('MM').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: /choose date/i }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');

  await dateField.getByRole('spinbutton', { name: 'Month' }).focus();
  await page.keyboard.type('10032026');
  await expect(dateField.getByRole('spinbutton', { name: 'Month' })).toHaveText('MM');

  await pickDate(page, '3');
  await expect(dateField.getByRole('spinbutton', { name: 'Day' })).toHaveText('03');
});

test('only offers end times 2 to 8 hours after the start, every half hour', async ({ page }) => {
  await page.getByRole('textbox', { name: 'Time' }).click();
  await page
    .getByRole('menu', { name: 'Start time' })
    .getByRole('menuitem', { name: '9:00 AM' })
    .click();

  const endTimes = page.getByRole('menu', { name: 'End time' }).getByRole('menuitem');
  // 11:00 AM (2 hours) to 5:00 PM (8 hours) in half hours: nothing shorter or longer.
  await expect(endTimes).toHaveCount(13);
  await expect(endTimes.first()).toContainText('11:00 AM');
  await expect(endTimes.nth(1)).toContainText('11:30 AM');
  await expect(endTimes.last()).toContainText('5:00 PM');

  await endTimes.nth(1).click();
  await expect(page.getByRole('textbox', { name: 'Time' })).toHaveValue('9:00 AM – 11:30 AM');
  await expect(page.getByText('2.5 hours', { exact: true }).first()).toBeVisible();
});

test('stops the end times at closing (9:00 PM)', async ({ page }) => {
  await pickTime(page, '6:00 PM', '9:00 PM');
  await page.getByRole('textbox', { name: 'Time' }).click();
  await expect(
    page.getByRole('menu', { name: 'End time' }).getByRole('menuitem').last(),
  ).toContainText('9:00 PM');
  // The last start that still leaves 2 hours before closing.
  await expect(
    page.getByRole('menu', { name: 'Start time' }).getByRole('menuitem').last(),
  ).toHaveText('7:00 PM');
});

test('prices several pets with the base charge once, and updates as pets are added', async ({
  page,
}) => {
  const total = page.getByTestId('total-price');
  await expect(total).toHaveText('$20'); // just the base charge until there's something to price

  await fillPet(page, 0, 'Oscar', 'Dog');
  await expect(total).toHaveText('$20'); // no time picked yet
  await pickTime(page, '9:00 AM', '5:00 PM');
  await expect(total).toHaveText('$100'); // $20 base + 8 hours at $10

  await page.getByRole('button', { name: 'Add another pet' }).click();
  await fillPet(page, 1, 'Sulley', 'Dog');
  await expect(total).toHaveText('$180'); // base charged once, not per pet

  // Itemized under each name, not written as an equation.
  const sulley = page.getByRole('listitem', { name: 'Sulley price' });
  await expect(sulley).toContainText('8 hours');
  await expect(sulley).toContainText('$10 per hour');
  await expect(sulley).toContainText('$80');

  await page.getByRole('button', { name: 'Add another pet' }).click();
  await fillPet(page, 2, 'Hamlet', 'Pig');
  await expect(total).toHaveText('$340');

  await page.getByRole('button', { name: 'Remove Hamlet' }).click();
  await expect(total).toHaveText('$180');
});

test('keeps submit disabled until every input is filled in', async ({ page }) => {
  await expect(submitButton(page)).toBeDisabled();

  await page.getByRole('textbox', { name: 'First name' }).fill('Jordan');
  await page.getByRole('textbox', { name: 'Last name' }).fill('Rivera');
  await fillPet(page, 0, 'Oscar', 'Dog');
  await page.getByRole('button', { name: 'Add another pet' }).click();
  await fillPet(page, 1, 'Sulley', 'Dog');
  await pickDate(page, '3');
  await expect(submitButton(page)).toBeDisabled(); // no time yet

  await pickTime(page, '9:00 AM', '11:00 AM');
  await expect(submitButton(page)).toBeEnabled();

  // Emptying any input disables it again.
  await page.getByRole('textbox', { name: 'Last name' }).fill('');
  await expect(submitButton(page)).toBeDisabled();
  await page.getByRole('textbox', { name: 'Last name' }).fill('Rivera');

  await page.getByRole('button', { name: 'Add another pet' }).click();
  await expect(submitButton(page)).toBeDisabled(); // the new pet is empty
  await page.getByRole('button', { name: 'Remove Pet 3' }).click();

  await submitButton(page).click();
  await expect(page.getByRole('alert')).toContainText('Booked Oscar and Sulley.');
});
