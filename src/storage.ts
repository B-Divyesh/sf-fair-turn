import type { HouseholdData } from './types';

const DATABASE = 'fair-turn';
const STORE = 'household';
const KEY = 'current';

export function emptyHousehold(): HouseholdData {
  const now = new Date().toISOString();
  return {
    version: 1,
    revision: 0,
    householdName: '',
    people: [],
    chores: [],
    absences: [],
    activity: [],
    createdAt: now,
    updatedAt: now,
  };
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Could not open local storage'));
  });
}

export async function loadHousehold(): Promise<HouseholdData> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE, 'readonly');
    const request = transaction.objectStore(STORE).get(KEY);
    request.onsuccess = () => resolve((request.result as HouseholdData | undefined) ?? emptyHousehold());
    request.onerror = () => reject(request.error ?? new Error('Could not read household data'));
    transaction.oncomplete = () => database.close();
  });
}

export async function saveHousehold(input: HouseholdData): Promise<HouseholdData> {
  const data = { ...input, revision: input.revision + 1, updatedAt: new Date().toISOString() };
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE, 'readwrite');
    transaction.objectStore(STORE).put(data, KEY);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('Could not save household data'));
  });
  database.close();
  return data;
}

export function validateImport(value: unknown): HouseholdData {
  if (!value || typeof value !== 'object') throw new Error('That file does not contain Fair Turn data.');
  const data = value as Partial<HouseholdData>;
  if (data.version !== 1 || typeof data.householdName !== 'string' || !Array.isArray(data.people)
    || !Array.isArray(data.chores) || !Array.isArray(data.absences) || !Array.isArray(data.activity)) {
    throw new Error('That file is not a supported Fair Turn export.');
  }
  return data as HouseholdData;
}
