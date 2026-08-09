import { test, expect } from '@playwright/test'

// app's route protection lives in proxy.ts, Next.js 16's file convention
// that replaced middleware.ts. It redirects unauthenticated visitors away
// from /dashboard/* and signed-in users away from /auth/login /
// /auth/signup. These tests exercise that behavior end-to-end.

test.describe('Dashboard route protection (proxy.ts)', () => {
  test('redirects an unauthenticated visitor from /dashboard to /auth/login', async ({
    page,
  }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('redirects an unauthenticated visitor from nested dashboard routes too', async ({
    page,
  }) => {
    await page.goto('/dashboard/invoices')
    await expect(page).toHaveURL(/\/auth\/login/)

    await page.goto('/dashboard/settings')
    await expect(page).toHaveURL(/\/auth\/login/)
  })
})
