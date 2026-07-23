/**
 * Public origin used in auth redirect emails (invite / password reset).
 * Prefer the live browser origin so preview deployments keep working;
 * fall back to the production URL for native / SSR contexts.
 */
export function getAppUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return process.env.EXPO_PUBLIC_APP_URL ?? 'https://o-tnotes.vercel.app';
}

export function getSetPasswordUrl(): string {
  return `${getAppUrl()}/set-password`;
}
