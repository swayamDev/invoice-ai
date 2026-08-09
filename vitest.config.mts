import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.test.{ts,tsx}', 'tests/integration/**/*.test.{ts,tsx}'],
    // Playwright e2e specs live under tests/e2e and run through
    // `playwright test`, not vitest — exclude them here.
    exclude: ['tests/e2e/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      // Written to coverage/ — gitignored, see .gitignore.
      reporter: ['text', 'html', 'lcov'],
      include: ['lib/**/*.ts', 'components/**/*.tsx'],
      exclude: [
        'lib/database.types.ts',
        'lib/supabase/**',
        'components/ui/**', // vendored shadcn primitives, not app logic
      ],
    },
  },
})
