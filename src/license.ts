export const FREE_PEOPLE_LIMIT = 4;
export const FREE_CHORE_LIMIT = 6;
const SLUG = 'fair-turn';
const KEY = `sb_license:${SLUG}`;
const VERDICT_KEY = `${KEY}:verdict`;
const DAY = 86_400_000;
let verificationInFlight: Promise<Verdict> | null = null;
let retryAfterUntil = 0;

interface Verdict { valid: boolean; checkedAt: number; reason?: string }

export function checkoutUrl(): string {
  return `https://api.sociobot.in/api/v1/products/${SLUG}/checkout`;
}

export function getLicenseToken(): string | null {
  return localStorage.getItem(KEY);
}

function readVerdict(): Verdict | null {
  try { return JSON.parse(localStorage.getItem(VERDICT_KEY) ?? 'null') as Verdict | null; }
  catch { return null; }
}

export function isUnlocked(): boolean {
  return Boolean(getLicenseToken() && readVerdict()?.valid);
}

export function acceptLicenseFromUrl(): boolean {
  const url = new URL(location.href);
  const token = url.searchParams.get('license');
  if (!token) return false;
  localStorage.setItem(KEY, token);
  localStorage.setItem(VERDICT_KEY, JSON.stringify({ valid: true, checkedAt: 0, reason: 'pending' } satisfies Verdict));
  url.searchParams.delete('license');
  history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
  return true;
}

export async function storeAndVerify(token: string): Promise<Verdict> {
  localStorage.setItem(KEY, token.trim());
  // A token returned directly from checkout is optimistically unlocked by
  // acceptLicenseFromUrl. A manually pasted token has no trusted provenance,
  // so it remains locked until the billing service confirms it.
  localStorage.setItem(VERDICT_KEY, JSON.stringify({ valid: false, checkedAt: 0, reason: 'pending' } satisfies Verdict));
  return verifyLicense(true);
}

async function requestVerification(force: boolean): Promise<Verdict> {
  const token = getLicenseToken();
  if (!token) return { valid: false, checkedAt: Date.now(), reason: 'missing' };
  const cached = readVerdict();
  if (!force && cached && Date.now() - cached.checkedAt < DAY) return cached;
  if (Date.now() < retryAfterUntil) return cached ?? { valid: false, checkedAt: 0, reason: 'rate_limited' };
  try {
    const response = await fetch(`https://api.sociobot.in/api/v1/products/${SLUG}/verify?license=${encodeURIComponent(token)}`);
    if (response.status === 429) {
      const seconds = Number(response.headers.get('Retry-After'));
      retryAfterUntil = Date.now() + (Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : 60_000);
      return cached ?? { valid: false, checkedAt: 0, reason: 'rate_limited' };
    }
    if (!response.ok) throw new Error('Verification service unavailable');
    const result = await response.json() as { valid: boolean; reason?: string };
    const verdict = { valid: result.valid, reason: result.reason, checkedAt: Date.now() };
    localStorage.setItem(VERDICT_KEY, JSON.stringify(verdict));
    return verdict;
  } catch {
    return cached ?? { valid: false, checkedAt: 0, reason: 'offline' };
  }
}

export function verifyLicense(force = false): Promise<Verdict> {
  if (verificationInFlight) return verificationInFlight;
  verificationInFlight = requestVerification(force).finally(() => { verificationInFlight = null; });
  return verificationInFlight;
}

export function removeLicense(): void {
  localStorage.removeItem(KEY);
  localStorage.removeItem(VERDICT_KEY);
}
