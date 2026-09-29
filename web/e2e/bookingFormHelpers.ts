import type { Page } from '@playwright/test';

export const submitButton = (page: Page) => page.getByRole('button', { name: 'Request a sitter' });

export async function pickTime(page: Page, start: string, end: string) {
  await page.getByRole('textbox', { name: 'Time' }).click();
  await page
    .getByRole('menu', { name: 'Start time' })
    .getByRole('menuitem', { name: start })
    .click();
  await page
    .getByRole('menu', { name: 'End time' })
    .getByRole('menuitem', { name: new RegExp(`^${end}`) })
    .click();
}

export async function pickDate(page: Page, day: string, label = 'Date') {
  await page.getByRole('group', { name: label }).click();
  await page.getByRole('gridcell', { name: day, exact: true }).click();
}

export async function fillPet(page: Page, index: number, name: string, type: string) {
  const pet = page.getByRole('group', { name: `Pet ${index + 1}` });
  await pet.getByRole('textbox', { name: "Pet's name" }).fill(name);
  await pet.getByRole('combobox', { name: 'Animal type' }).click();
  await page.getByRole('option', { name: type }).click();
}
