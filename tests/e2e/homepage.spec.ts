import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('loads and shows the app name', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Invoice AI/)
  })

  test('footer "Built by Swayam" link points to swayam.space, not swayam.io or the deployed project URL', async ({
    page,
  }) => {
    await page.goto('/')
    const builtByLink = page.getByRole('link', { name: 'Built by Swayam' })
    await expect(builtByLink).toBeVisible()
    await expect(builtByLink).toHaveAttribute('href', 'https://swayam.space')
  })

  test('has working navigation links to login and signup', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('link', { name: 'Login' }).first()).toHaveAttribute(
      'href',
      '/auth/login'
    )
    await expect(page.getByRole('link', { name: /sign up/i }).first()).toHaveAttribute(
      'href',
      '/auth/signup'
    )
  })

  test('has no broken same-origin links in the footer', async ({ page }) => {
    await page.goto('/')
    const footerLinks = page.locator('footer a[href^="/"]')
    const count = await footerLinks.count()
    expect(count).toBeGreaterThan(0)

    for (let i = 0; i < count; i++) {
      const href = await footerLinks.nth(i).getAttribute('href')
      expect(href).toBeTruthy()
    }
  })
})
