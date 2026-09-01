/**
 * Validates a `returnUrl` query parameter before it is used for navigation.
 *
 * The value arrives from the URL bar, so it is attacker-controlled: without a
 * check, `?returnUrl=https://evil.example` would turn our own login page into
 * an open redirect. Only same-origin *paths* are allowed — a leading single
 * slash, and never `//host` (protocol-relative) or a scheme.
 */
export function safeReturnUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!value.startsWith('/')) return null;
  if (value.startsWith('//')) return null;
  // Bounce anything trying to smuggle a scheme through, e.g. "/\evil.com".
  if (/^\/[\\]/.test(value)) return null;
  return value;
}
