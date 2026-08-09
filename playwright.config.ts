import { defineConfig, devices } from '@playwright/test'

const PORT = process.env.PORT ?? 3000
const baseURL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  // Written to playwright-report/ and test-results/, both gitignored,
  // see .gitignore.
  reporter: [['html', { open: 'never' }]],

  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Runs the e2e suite against a production build (`next build` +
  // `next start`), not `next dev`. Earlier runs against `next dev` were
  // flaky: dev mode compiles each route on first request, and Playwright's
  // parallel workers hit several different not-yet-compiled routes at
  // once, which overwhelmed the dev compiler and caused page.goto to hang
  // past the 30s navigation timeout, a dev-server concurrency artifact,
  // not a bug in the app (every failure was a timeout on the `load`
  // event, never a failed assertion). Production start serves prebuilt
  // pages, so there's no per-route first-hit compile to contend with.
  //
  // Requires NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY to
  // be set (even to placeholder values) since app/layout.tsx, proxy.ts,
  // and the Supabase browser client all read them at build/boot time.
  // `env` here guarantees the spawned build+start process has them even
  // if the machine running the tests has no .env.local. Without this,
  // proxy.ts silently no-ops (by design, so a misconfigured env doesn't
  // lock developers out of /dashboard) and the dashboard page then
  // crashes client-side trying to build a Supabase client with no
  // credentials, which looks like a failed redirect but isn't one.
  webServer: {
    command: 'npm run build && npm run start',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    // Building can take a minute or more on a cold cache/slower machine;
    // give it real headroom rather than the ~2s a dev server needs.
    timeout: 180_000,
    env: {
      ...process.env,
      NEXT_PUBLIC_SUPABASE_URL:
        process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY:
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key',
    },
  },
})
