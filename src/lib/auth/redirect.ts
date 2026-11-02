/**
 * Validates and resolves safe post-authentication redirect URLs.
 * Prevents Open Redirect vulnerabilities (e.g. //attacker.com, javascript:).
 */
export function getSafeRedirectUrl(
  templateParam?: string | null,
  redirectParam?: string | null
): string {
  // 1. Template selection priority: routes to profile builder with pre-selected template
  if (templateParam && /^[a-zA-Z0-9_-]+$/.test(templateParam)) {
    return `/builder/new?template=${encodeURIComponent(templateParam)}`;
  }

  // 2. Relative redirect parameter (must start with / and not //)
  if (
    redirectParam &&
    redirectParam.startsWith('/') &&
    !redirectParam.startsWith('//') &&
    !redirectParam.includes('\\') &&
    !redirectParam.includes('\r') &&
    !redirectParam.includes('\n')
  ) {
    return redirectParam;
  }

  // 3. Default fallback
  return '/dashboard';
}

/**
 * Builds the query string to preserve template and redirect across auth forms.
 */
export function buildAuthQueryString(
  templateParam?: string | null,
  redirectParam?: string | null,
  extra?: Record<string, string>
): string {
  const params = new URLSearchParams();
  if (templateParam) params.set('template', templateParam);
  if (redirectParam) params.set('redirect', redirectParam);
  if (extra) {
    Object.entries(extra).forEach(([k, v]) => params.set(k, v));
  }
  const str = params.toString();
  return str ? `?${str}` : '';
}

