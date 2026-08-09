# Testing Guide

This project has three layers of automated tests. This doc explains what
each one covers, how to run it locally, and how it runs in CI.

| Layer | Tool | What it covers | Needs a real backend? |
|---|---|---|---|
| Unit | Vitest | Pure logic: `lib/rate-limit.ts`, `lib/email-templates.ts` (HTML escaping), `lib/utils.ts`, `lib/logo-upload.ts`, `lib/env.ts`, and one component (`Button`) | No |
| Integration | Vitest | `requireUser()`, the auth and rate-limit gate every API route goes through, with a mocked Supabase client | No, Supabase is mocked |
| End-to-end | Playwright | Real browser navigation: homepage, login, signup, the 404 page, and the `/dashboard` route-protection redirect | No, only public pages and the redirect behavior are covered, so no Supabase project or seed data is required |

All three run in CI on every push and pull request to `main` (see
`.github/workflows/ci.yml`). Unit and integration tests also produce a
coverage report, uploaded as a CI artifact.

---

## 1. Setup

```bash
npm install
```

Playwright additionally needs a browser binary the first time:

```bash
npx playwright install --with-deps chromium
```

`--with-deps` installs the OS-level libraries Chromium needs. On some
Linux distros you may be prompted for `sudo`. If you only want the
browser binary without touching system packages, drop `--with-deps`.

---

## 2. Running the tests

### Everything

```bash
npm run test:all       # unit + integration, then e2e
```

### Unit and integration tests (Vitest)

```bash
npm run test           # single run
npm run test:watch     # watch mode, reruns on file change
npm run test:coverage  # single run + coverage report in coverage/
```

Run a single file or match a name:

```bash
npx vitest run tests/unit/rate-limit.test.ts
npx vitest run -t "escapes a malicious client name"
```

### End-to-end tests (Playwright)

```bash
npm run test:e2e       # headless, all browsers configured in playwright.config.ts
npm run test:e2e:ui    # interactive UI mode, useful for debugging locally
```

Playwright's `webServer` config runs `npm run build && npm run start`
automatically and waits for it to be ready, so you don't need a separate
terminal. That also means the first `npm run test:e2e` run takes a
minute or two longer than you might expect, since it builds the whole
app first. `playwright.config.ts` injects placeholder Supabase
credentials into that build/start process automatically, so `npm run
test:e2e` works out of the box even with no `.env.local` at all. Real
values from your shell or `.env.local` are used instead if present.

> **Why a production build instead of `next dev`:** dev mode compiles
> each route on its first request. With Playwright's parallel workers
> hitting several different not-yet-compiled routes at once, the dev
> compiler falls behind and `page.goto` can hang past its 30 second
> navigation timeout. That shows up as a timeout, not a real failed
> assertion. A production build serves prebuilt pages, so there is no
> per-route first-hit compile to contend with, and the suite runs both
> faster and more reliably.

> **Why this matters for proxy.ts:** route protection intentionally
> does nothing when Supabase env vars are missing, so a misconfigured
> environment does not accidentally lock every developer out of
> `/dashboard`. Without some value for these vars, the dashboard page
> loads unprotected and then crashes client-side trying to build a
> Supabase client with no credentials. That looks like a failed
> redirect in a test failure, but is actually just a missing env var.
> If you ever see `dashboard-protection.spec.ts` fail with a page crash
> instead of a redirect, check this first.

Run a single spec:

```bash
npx playwright test tests/e2e/login.spec.ts
```

View the last HTML report:

```bash
npx playwright show-report
```

---

## 3. Where tests live

```
tests/
├── setup.ts                        # Vitest global setup (jest-dom matchers)
├── unit/
│   ├── rate-limit.test.ts          # In-memory rate limiter
│   ├── email-templates.test.ts     # escapeHtml() + HTML/text email builders
│   ├── utils.test.ts               # cn() className helper
│   ├── logo-upload.test.ts         # Logo file validation
│   ├── env.test.ts                 # Env var sanitization helpers
│   └── button.test.tsx             # Button component (React Testing Library)
├── integration/
│   └── api-auth.test.ts            # requireUser(), the auth + rate limit gate
└── e2e/
    ├── homepage.spec.ts            # Marketing page smoke tests
    ├── login.spec.ts               # Login form smoke tests
    ├── signup.spec.ts              # Signup form smoke tests
    ├── not-found.spec.ts           # 404 page smoke tests
    └── dashboard-protection.spec.ts # proxy.ts route-protection redirects
```

Config files: `vitest.config.mts` (unit/integration) and
`playwright.config.ts` (e2e).

---

## 4. What's intentionally not covered

- **Authenticated flows that hit real Supabase, OpenAI, or Resend**
  (creating an invoice, sending an email, AI generation). These need a
  seeded test Supabase project and API keys, which don't belong in a
  public CI pipeline. If you want to extend coverage here, the standard
  approach is a dedicated Supabase test project with a `.env.test` file
  holding restricted-scope keys, wired up as GitHub Actions secrets.
  This isn't something to fake with mocks, since the real value of these
  tests is catching RLS policy mistakes and real API contract changes.
- **Visual regression.** No screenshot-diffing is configured. Playwright
  supports this (`toHaveScreenshot()`) if you want to add it later.

---

## 5. Adding a new test

- Pure function or logic: `tests/unit/*.test.ts`, plain Vitest.
- Component with user interaction: `tests/unit/*.test.tsx`, Vitest plus
  React Testing Library and `@testing-library/user-event`.
- Something that spans a module boundary, such as an API route's
  behavior with its external calls mocked: `tests/integration/`.
- Real browser navigation or a multi-page flow: `tests/e2e/`, Playwright.

Keep unit tests fast and free of network or browser dependencies. That's
what keeps `npm run test` running in seconds rather than minutes.
