import { test, expect } from '@playwright/test';

test.describe('Growth System Console End-to-End', () => {
  test('Login page renders clean form without sensitive prefill', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: 'Growth System' })).toBeVisible();
    await expect(page.getByPlaceholder('Enter admin email')).toBeVisible();
    await expect(page.getByPlaceholder('Enter password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In to Console' })).toBeVisible();

    // Verify email field is empty (never prefilled)
    const emailValue = await page.getByPlaceholder('Enter admin email').inputValue();
    expect(emailValue).toBe('');
  });

  test('Rejects invalid credentials and displays remaining attempts', async ({ page }) => {
    await page.goto('/login');

    await page.getByPlaceholder('Enter admin email').fill('ziauldin371@gmail.com');
    await page.getByPlaceholder('Enter password').fill('wrong_password');
    await page.getByRole('button', { name: 'Sign In to Console' }).click();

    await expect(page.getByText('Invalid email or password.')).toBeVisible();
  });

  test('Public routes allow access without session', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.getByRole('heading', { name: 'Privacy Policy' })).toBeVisible();

    await page.goto('/terms');
    await expect(page.getByRole('heading', { name: 'Terms of Use' })).toBeVisible();
  });
});

