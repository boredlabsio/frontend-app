import { expect, test } from '@playwright/test';

test('creation route exposes validated fields and remains disabled by default', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/launch/create');
  await expect(page.getByLabel('Token name')).toBeVisible();
  await expect(page.getByLabel('Symbol')).toBeVisible();
  await expect(page.getByLabel('Metadata URI')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Simulate and create' })).toBeDisabled();
  await expect(page.getByText(/not a production security boundary/i)).toBeVisible();
  expect(errors).toEqual([]);
});
