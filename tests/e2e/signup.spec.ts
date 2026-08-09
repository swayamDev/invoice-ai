import { test, expect } from '@playwright/test'

test.describe('Signup page', () => {
  test('renders the signup form', async ({ page }) => {
    await page.goto('/auth/signup')
    await expect(page.locator('#email')).toBeVisible()
    await expect(page.getByRole('button', { name: /create account/i })).toBeVisible()
  })

  test('links back to the login page', async ({ page }) => {
    await page.goto('/auth/signup')
    const loginLink = page.getByRole('link', { name: /sign in/i })
    await expect(loginLink).toHaveAttribute('href', '/auth/login')
  })

  test('does not submit with an empty form', async ({ page }) => {
    await page.goto('/auth/signup')
    await page.getByRole('button', { name: /create account/i }).click()
    await expect(page).toHaveURL(/\/auth\/signup/)
  })
})
