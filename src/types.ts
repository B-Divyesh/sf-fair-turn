export type CadenceUnit = 'days' | 'weeks' | 'months';

export interface Person {
  id: string;
  name: string;
}

export interface Absence {
  id: string;
  personId: string;
  start: string;
  end: string;
  note: string;
}

export interface Chore {
  id: string;
  title: string;
  cadenceValue: number;
  cadenceUnit: CadenceUnit;
  eligibleIds: string[];
  nextDue: string;
  currentPersonId: string | null;
  lastPersonId: string | null;
}

export type ActivityType = 'created' | 'completed' | 'swapped' | 'absence_skip' | 'deleted' | 'restored';

export interface Activity {
  id: string;
  at: string;
  type: ActivityType;
  choreId?: string;
  choreTitle?: string;
  personId?: string;
  personName?: string;
  fromPersonName?: string;
  toPersonName?: string;
  due?: string;
  note?: string;
}

export interface HouseholdData {
  version: 1;
  revision: number;
  householdName: string;
  people: Person[];
  chores: Chore[];
  absences: Absence[];
  activity: Activity[];
  createdAt: string;
  updatedAt: string;
}

export interface BoardSnapshot {
  v: 1;
  household: string;
  sharedAt: string;
  assignments: Array<{ chore: string; person: string; due: string }>;
}

export interface OutlookItem {
  choreId: string;
  choreTitle: string;
  personId: string | null;
  personName: string;
  due: string;
}
