export const PORTAL_LOGO_EXPIRY_SECONDS = 24 * 60 * 60;
const cache = new Map<string, { url: string; expiresAt: number }>();

export async function getPortalLogoUrl(
  userId: string,
  storedUrl: string,
  sign: (path: string, seconds: number) => Promise<string | null>,
  now = Date.now(),
): Promise<string | null> {
  const marker = "/tenant-logos/";
  let path: string;
  try {
    path = decodeURIComponent((storedUrl.includes(marker) ? storedUrl.split(marker)[1] : storedUrl).split("?")[0]);
  } catch { return null; }
  const key = `${userId}:${path}`;
  const cached = cache.get(key);
  if (cached && cached.expiresAt > now + 60_000) return cached.url;
  const url = await sign(path, PORTAL_LOGO_EXPIRY_SECONDS);
  if (url) cache.set(key, { url, expiresAt: now + PORTAL_LOGO_EXPIRY_SECONDS * 1000 });
  else cache.delete(key);
  return url;
}