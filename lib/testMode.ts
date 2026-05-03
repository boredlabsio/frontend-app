const HOST_ALLOW_LIST = ['localhost', '127.0.0.1', '0.0.0.0'];

export function hostnameAllowsTestMode(hostname?: string | null) {
  if (!hostname) return false;
  const host = hostname.toLowerCase();
  if (!host) return false;
  if (HOST_ALLOW_LIST.includes(host)) return true;
  if (host.endsWith('.localhost')) return true;
  return false;
}
