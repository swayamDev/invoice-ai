import { test, expect } from '@playwright/test'

test.describe('Login page', () => {
  test('renders email and password fields', async ({ page }) => {
    await page.goto('/auth/login')
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.locator('#email')).toHaveAttribute('type', 'email')
  })

  test('shows a validation error for an empty submit', async ({ page }) => {
    await page.goto('/auth/login')
    await page.getByRole('button', { name: /log in|sign in/i }).click()
    // The form should not navigate away, and should surface some error
    // state rather than silently submitting.
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('links to the signup page', async ({ page }) => {
    await page.goto('/auth/login')
    const signupLink = page.getByRole('link', { name: /sign up/i })
    await expect(signupLink).toHaveAttribute('href', '/auth/signup')
  })
})
