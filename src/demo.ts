import { addCadence, todayISO } from './rotation';
import type { HouseholdData } from './types';

function isoAtOffset(days: number): string {
  return addCadence(todayISO(), days, 'days');
}

export function sampleHousehold(): HouseholdData {
  const now = new Date().toISOString();
  const people = [
    { id: 'demo-avery', name: 'Avery' },
    { id: 'demo-morgan', name: 'Morgan' },
    { id: 'demo-riley', name: 'Riley' },
  ];
  return {
    version: 1,
    revision: 0,
    householdName: 'Juniper House',
    people,
    absences: [{ id: 'demo-away', personId: 'demo-morgan', start: isoAtOffset(-1), end: isoAtOffset(2), note: 'Visiting family' }],
    chores: [
      { id: 'demo-bins', title: 'Take bins out', cadenceValue: 1, cadenceUnit: 'weeks', eligibleIds: people.map(({ id }) => id), nextDue: todayISO(), currentPersonId: 'demo-avery', lastPersonId: 'demo-riley' },
      { id: 'demo-bathroom', title: 'Clean the bathroom', cadenceValue: 2, cadenceUnit: 'weeks', eligibleIds: people.map(({ id }) => id), nextDue: isoAtOffset(2), currentPersonId: 'demo-riley', lastPersonId: 'demo-morgan' },
      { id: 'demo-plants', title: 'Water shared plants', cadenceValue: 5, cadenceUnit: 'days', eligibleIds: ['demo-avery', 'demo-morgan'], nextDue: isoAtOffset(4), currentPersonId: 'demo-avery', lastPersonId: 'demo-morgan' },
    ],
    activity: [
      { id: 'demo-activity-1', at: new Date(Date.now() - 86_400_000).toISOString(), type: 'swapped', choreId: 'demo-bathroom', choreTitle: 'Clean the bathroom', fromPersonName: 'Avery', toPersonName: 'Riley', due: isoAtOffset(2), note: 'Swapped for the school run' },
      { id: 'demo-activity-2', at: new Date(Date.now() - 172_800_000).toISOString(), type: 'completed', choreId: 'demo-bins', choreTitle: 'Take bins out', personId: 'demo-riley', personName: 'Riley', due: isoAtOffset(-7) },
      { id: 'demo-activity-3', at: new Date(Date.now() - 259_200_000).toISOString(), type: 'absence_skip', choreId: 'demo-bathroom', choreTitle: 'Clean the bathroom', fromPersonName: 'Morgan', toPersonName: 'Riley', due: isoAtOffset(2), note: 'Morgan is away' },
    ],
    createdAt: now,
    updatedAt: now,
  };
}
