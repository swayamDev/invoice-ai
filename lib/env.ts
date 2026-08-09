/**
 * Reads an env var defensively, guarding against a common copy-paste
 * mistake: pasting an entire ".env" line (`KEY=value`) into a hosting
 * platform's "value" field instead of just the value. When that happens,
 * process.env.KEY ends up literally containing "KEY=value", which then
 * gets used verbatim wherever the real value was expected, e.g. as the
 * From address of an outbound email, producing headers like
 * `utkal tech <RESEND_FROM_EMAIL=noreply@invoice.swayam.space>` instead of
 * `utkal tech <noreply@invoice.swayam.space>`.
 *
 * If the raw value starts with "`name`=", strips that prefix. Otherwise
 * returns the value unchanged. Doesn't attempt to detect every possible
 * misconfiguration, just this specific, easy-to-make-and-hard-to-notice
 * one.
 */
export function readEnvVar(name: string): string | undefined {
  const raw = process.env[name]
  if (!raw) return raw

  const accidentalPrefix = `${name}=`
  if (raw.startsWith(accidentalPrefix)) {
    return raw.slice(accidentalPrefix.length)
  }

  return raw
}

const EMAIL_RE = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/

/**
 * Same as readEnvVar, but additionally validates the result looks like an
 * email address. Falls back to `fallback` (and logs a warning naming the
 * exact env var) if the configured value is missing or malformed, so a
 * bad deployment config degrades to a known-safe default instead of
 * silently corrupting outbound email headers.
 */
export function readEmailEnvVar(name: string, fallback: string): string {
  const value = readEnvVar(name)
  if (value && EMAIL_RE.test(value)) return value

  if (value) {
    console.warn(
      `[env] ${name} is set but doesn't look like a valid email address ("${value}"), falling back to "${fallback}". Check this env var's value on your hosting platform: it should be just the email, not "${name}=...".`
    )
  }

  return fallback
}
