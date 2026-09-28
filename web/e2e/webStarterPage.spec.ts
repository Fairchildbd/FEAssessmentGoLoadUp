import { expect, test } from '@playwright/test';

// Smoke test for the starter page. Replace it with E2E tests for the booking form and admin pages.
test('renders shared data, the MUI theme and Tailwind token classes', async ({ page }) => {
  // A fixed "now": noon on 1 Oct 2026 in New York, the time zone set in playwright.config.ts.
  await page.clock.setFixedTime(new Date('2026-10-01T16:00:00Z'));
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1, name: 'Pet Sitting' })).toBeVisible();
  await expect(page.getByText('Mock database: 6 pets, 9 bookings')).toBeVisible();
  await expect(page.getByText('React Hook Form): hours start at 2')).toBeVisible();
  await expect(page.getByText('date-fns: today is 2026-10-01 in America/New_York')).toBeVisible();

  // Tokens reach Tailwind: bg-secondary-container is the lime accent (#ccff00).
  await expect(page.getByText('Tailwind classes built from the shared design tokens')).toHaveCSS(
    'background-color',
    'rgb(204, 255, 0)',
  );

  // Tokens reach MUI (primary teal #087a77), and a Tailwind class overrides MUI's default radius.
  const button = page.getByRole('button', { name: 'MUI button, rounded by a Tailwind class' });
  await expect(button).toHaveCSS('background-color', 'rgb(8, 122, 119)');
  await expect(button).toHaveCSS('border-radius', '9999px');
});
