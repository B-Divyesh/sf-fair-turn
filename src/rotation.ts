import type { Absence, Chore, HouseholdData, OutlookItem, Person } from './types';

export function todayISO(date = new Date()): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

export function addCadence(date: string, value: number, unit: Chore['cadenceUnit']): string {
  const result = new Date(`${date}T12:00:00`);
  if (unit === 'days') result.setDate(result.getDate() + value);
  if (unit === 'weeks') result.setDate(result.getDate() + value * 7);
  if (unit === 'months') result.setMonth(result.getMonth() + value);
  return todayISO(result);
}

export function isAway(personId: string, due: string, absences: Absence[]): boolean {
  return absences.some((absence) => absence.personId === personId && absence.start <= due && absence.end >= due);
}

export function chooseNext(
  eligibleIds: string[],
  previousId: string | null,
  due: string,
  absences: Absence[],
): string | null {
  if (!eligibleIds.length) return null;
  const previousIndex = previousId ? eligibleIds.indexOf(previousId) : -1;
  for (let offset = 1; offset <= eligibleIds.length; offset += 1) {
    const candidate = eligibleIds[(previousIndex + offset) % eligibleIds.length];
    if (!isAway(candidate, due, absences)) return candidate;
  }
  return null;
}

export function reconcileChore(chore: Chore, absences: Absence[]): Chore {
  const currentIsEligible = chore.currentPersonId && chore.eligibleIds.includes(chore.currentPersonId);
  if (currentIsEligible && !isAway(chore.currentPersonId!, chore.nextDue, absences)) return chore;
  const previous = currentIsEligible ? chore.currentPersonId : chore.lastPersonId;
  return {
    ...chore,
    currentPersonId: chooseNext(chore.eligibleIds, previous, chore.nextDue, absences),
  };
}

export function buildOutlook(data: HouseholdData, weeks = 8): OutlookItem[] {
  const horizon = new Date();
  horizon.setDate(horizon.getDate() + weeks * 7);
  const horizonISO = todayISO(horizon);
  const names = new Map<string, Person>(data.people.map((person) => [person.id, person]));
  const output: OutlookItem[] = [];
  for (const source of data.chores) {
    let due = source.nextDue;
    let personId = source.currentPersonId;
    let previousId = source.lastPersonId;
    let guard = 0;
    while (due <= horizonISO && guard < 100) {
      const selected = personId && !isAway(personId, due, data.absences)
        ? personId
        : chooseNext(source.eligibleIds, previousId, due, data.absences);
      output.push({
        choreId: source.id,
        choreTitle: source.title,
        personId: selected,
        personName: selected ? names.get(selected)?.name ?? 'Unavailable' : 'No one available',
        due,
      });
      previousId = selected;
      personId = null;
      due = addCadence(due, source.cadenceValue, source.cadenceUnit);
      guard += 1;
    }
  }
  return output.sort((a, b) => a.due.localeCompare(b.due) || a.choreTitle.localeCompare(b.choreTitle));
}

export function dueLabel(due: string, now = todayISO()): { text: string; status: 'overdue' | 'today' | 'upcoming' } {
  if (due < now) return { text: `Overdue · ${formatDate(due)}`, status: 'overdue' };
  if (due === now) return { text: 'Due today', status: 'today' };
  return { text: `Due ${formatDate(due)}`, status: 'upcoming' };
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    .format(new Date(`${value}T12:00:00`));
}
