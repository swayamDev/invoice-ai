import { test, expect } from '@playwright/test'

test.describe('404 page', () => {
  test('renders for an unknown route with a 404 status', async ({ page }) => {
    const response = await page.goto('/this-route-does-not-exist')
    expect(response?.status()).toBe(404)
    await expect(page.getByRole('heading', { name: /doesn.t exist/i })).toBeVisible()
  })

  test('has a working link back home', async ({ page }) => {
    await page.goto('/this-route-does-not-exist')
    await page.getByRole('link', { name: 'Back to home' }).click()
    await expect(page).toHaveURL('/')
  })
})
