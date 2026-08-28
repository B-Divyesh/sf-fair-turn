import { describe, expect, it } from 'vitest';
import { addCadence, buildOutlook, chooseNext, isAway, reconcileChore } from '../src/rotation';
import type { HouseholdData } from '../src/types';

const people = [
  { id: 'a', name: 'Alex' },
  { id: 'b', name: 'Bo' },
  { id: 'c', name: 'Casey' },
];

describe('fair rotation', () => {
  it('moves round-robin from the previous person', () => {
    expect(chooseNext(['a', 'b', 'c'], 'a', '2026-08-28', [])).toBe('b');
    expect(chooseNext(['a', 'b', 'c'], 'c', '2026-08-28', [])).toBe('a');
  });

  it('skips people away on the due date without removing them', () => {
    const absences = [{ id: 'away', personId: 'b', start: '2026-08-27', end: '2026-08-30', note: '' }];
    expect(isAway('b', '2026-08-28', absences)).toBe(true);
    expect(chooseNext(['a', 'b', 'c'], 'a', '2026-08-28', absences)).toBe('c');
    expect(chooseNext(['a', 'b', 'c'], 'a', '2026-09-01', absences)).toBe('b');
  });

  it('returns no assignment when every eligible person is away', () => {
    const absences = people.map((person) => ({ id: person.id, personId: person.id, start: '2026-08-01', end: '2026-09-01', note: '' }));
    expect(chooseNext(people.map((person) => person.id), null, '2026-08-28', absences)).toBeNull();
  });

  it('reconciles an ineligible current assignment', () => {
    const chore = { id: 'x', title: 'Bins', cadenceValue: 1, cadenceUnit: 'weeks' as const, eligibleIds: ['a', 'c'], nextDue: '2026-08-28', currentPersonId: 'b', lastPersonId: 'a' };
    expect(reconcileChore(chore, []).currentPersonId).toBe('c');
  });

  it('preserves calendar cadence', () => {
    expect(addCadence('2026-08-28', 2, 'weeks')).toBe('2026-09-11');
    expect(addCadence('2026-01-15', 1, 'months')).toBe('2026-02-15');
  });

  it('builds a dated outlook in chronological order', () => {
    const data: HouseholdData = {
      version: 1, revision: 0, householdName: 'Test', people, absences: [], activity: [], createdAt: '', updatedAt: '',
      chores: [{ id: 'x', title: 'Bins', cadenceValue: 1, cadenceUnit: 'weeks', eligibleIds: ['a', 'b', 'c'], nextDue: new Date().toISOString().slice(0, 10), currentPersonId: 'a', lastPersonId: null }],
    };
    const outlook = buildOutlook(data, 3);
    expect(outlook.length).toBeGreaterThanOrEqual(3);
    expect(outlook.slice(0, 3).map((item) => item.personId)).toEqual(['a', 'b', 'c']);
  });
});
