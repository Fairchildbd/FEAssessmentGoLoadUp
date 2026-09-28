import { expect, test } from '@playwright/test';

// Smoke test for the starter page. Replace it with E2E tests for the booking form and admin pages.
test('renders shared data, the MUI theme and Tailwind token classes', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1, name: 'Pet Sitting' })).toBeVisible();
  await expect(page.getByText('Mock database: 6 pets, 8 bookings')).toBeVisible();

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
