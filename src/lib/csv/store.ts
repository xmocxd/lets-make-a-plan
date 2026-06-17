import { openDB, type IDBPDatabase } from 'idb';
import type { PlanData } from '../../types/plan';
import { createDefaultPlan } from '../../types/plan';
import { deserializePlan, serializePlan } from './serialize';

const DB_NAME = 'lets-make-a-plan';
const STORE = 'csv';
const LIVE_KEY = 'plan.csv';
const BACKUP_PREFIX = 'plan.csv.backup.';

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE);
        }
      },
    });
  }
  return dbPromise;
}

export async function loadPlan(): Promise<PlanData | null> {
  const db = await getDb();
  const csv = await db.get(STORE, LIVE_KEY);
  if (!csv || typeof csv !== 'string') return null;
  return deserializePlan(csv);
}

export async function savePlan(data: PlanData): Promise<void> {
  const updated = {
    ...data,
    meta: { ...data.meta, localModifiedAt: new Date().toISOString() },
  };
  const db = await getDb();
  await db.put(STORE, serializePlan(updated), LIVE_KEY);
}

export async function initPlan(): Promise<PlanData> {
  const plan = createDefaultPlan();
  plan.meta.onboarded = true;
  await savePlan(plan);
  return plan;
}

export async function exportPlanCsv(): Promise<string> {
  const plan = await loadPlan();
  if (!plan) return serializePlan(createDefaultPlan());
  return serializePlan(plan);
}

export async function importPlanCsv(csv: string): Promise<PlanData> {
  const data = deserializePlan(csv);
  await savePlan(data);
  return data;
}

export async function rotateLocalBackups(): Promise<void> {
  const db = await getDb();
  const live = await db.get(STORE, LIVE_KEY);
  if (!live) return;

  const b1 = await db.get(STORE, `${BACKUP_PREFIX}0`);
  const b2 = await db.get(STORE, `${BACKUP_PREFIX}1`);

  if (b2) await db.put(STORE, b2, `${BACKUP_PREFIX}2`);
  if (b1) await db.put(STORE, b1, `${BACKUP_PREFIX}1`);
  await db.put(STORE, live, `${BACKUP_PREFIX}0`);
}

export async function listLocalBackups(): Promise<{ slot: number; date?: string }[]> {
  const db = await getDb();
  const result: { slot: number; date?: string }[] = [];
  for (let slot = 0; slot < 3; slot++) {
    const csv = await db.get(STORE, `${BACKUP_PREFIX}${slot}`);
    if (csv && typeof csv === 'string') {
      try {
        const plan = deserializePlan(csv);
        result.push({ slot, date: plan.meta.localModifiedAt });
      } catch {
        result.push({ slot });
      }
    }
  }
  return result;
}

export async function restoreLocalBackup(slot: number): Promise<PlanData> {
  const db = await getDb();
  const csv = await db.get(STORE, `${BACKUP_PREFIX}${slot}`);
  if (!csv || typeof csv !== 'string') {
    throw new Error('Backup not found');
  }
  const data = deserializePlan(csv);
  await savePlan(data);
  return data;
}

export async function clearPlanStore(): Promise<void> {
  const db = await getDb();
  await db.delete(STORE, LIVE_KEY);
  for (let slot = 0; slot < 3; slot++) {
    await db.delete(STORE, `${BACKUP_PREFIX}${slot}`);
  }
}

export function downloadCsv(csv: string, filename = 'plan.csv'): void {
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
