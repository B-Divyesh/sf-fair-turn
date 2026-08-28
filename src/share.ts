import type { BoardSnapshot, HouseholdData } from './types';

function encodeUtf8(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeUtf8(input: string): string {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(normalized);
  return new TextDecoder().decode(Uint8Array.from(binary, (character) => character.charCodeAt(0)));
}

export function makeSnapshot(data: HouseholdData): BoardSnapshot {
  const names = new Map(data.people.map((person) => [person.id, person.name]));
  return {
    v: 1,
    household: data.householdName,
    sharedAt: new Date().toISOString(),
    assignments: data.chores.map((chore) => ({
      chore: chore.title,
      person: chore.currentPersonId ? names.get(chore.currentPersonId) ?? 'Unavailable' : 'No one available',
      due: chore.nextDue,
    })),
  };
}

export function snapshotUrl(data: HouseholdData): string {
  const url = new URL(location.origin + location.pathname);
  url.hash = `board=${encodeUtf8(JSON.stringify(makeSnapshot(data)))}`;
  return url.toString();
}

export function readSnapshot(): BoardSnapshot | null {
  if (!location.hash.startsWith('#board=')) return null;
  try {
    const parsed = JSON.parse(decodeUtf8(location.hash.slice(7))) as BoardSnapshot;
    if (parsed.v !== 1 || !Array.isArray(parsed.assignments)) return null;
    return parsed;
  } catch {
    return null;
  }
}
