export const FREE_PEOPLE_LIMIT = 4;
export const FREE_CHORE_LIMIT = 6;
const SLUG = 'fair-turn';
const KEY = `sb_license:${SLUG}`;
const VERDICT_KEY = `${KEY}:verdict`;
const DAY = 86_400_000;

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
  localStorage.setItem(VERDICT_KEY, JSON.stringify({ valid: true, checkedAt: 0, reason: 'pending' } satisfies Verdict));
  return verifyLicense(true);
}

export async function verifyLicense(force = false): Promise<Verdict> {
  const token = getLicenseToken();
  if (!token) return { valid: false, checkedAt: Date.now(), reason: 'missing' };
  const cached = readVerdict();
  if (!force && cached && Date.now() - cached.checkedAt < DAY) return cached;
  try {
    const response = await fetch(`https://api.sociobot.in/api/v1/products/${SLUG}/verify?license=${encodeURIComponent(token)}`);
    if (!response.ok) throw new Error('Verification service unavailable');
    const result = await response.json() as { valid: boolean; reason?: string };
    const verdict = { valid: result.valid, reason: result.reason, checkedAt: Date.now() };
    localStorage.setItem(VERDICT_KEY, JSON.stringify(verdict));
    return verdict;
  } catch {
    return cached ?? { valid: false, checkedAt: 0, reason: 'offline' };
  }
}

export function removeLicense(): void {
  localStorage.removeItem(KEY);
  localStorage.removeItem(VERDICT_KEY);
}
