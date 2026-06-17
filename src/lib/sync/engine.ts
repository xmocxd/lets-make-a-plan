import type { PlanData } from '../../types/plan';
import { savePlan, importPlanCsv, exportPlanCsv } from '../csv/store';
import {
  pushPlanToSheet,
  pullPlanFromSheet,
  getSheetModifiedTime,
  createPlanSpreadsheet,
  planFromCsvForNewSheet,
} from '../google/sheets';
import { getAccessToken, requestAccessToken } from '../google/auth';

export type SyncConflict = {
  localModifiedAt: string;
  remoteModifiedAt: string;
};

export async function checkSyncConflict(
  plan: PlanData,
): Promise<SyncConflict | null> {
  if (!plan.meta.spreadsheetId || !getAccessToken()) return null;
  const remote = await getSheetModifiedTime(plan.meta.spreadsheetId);
  if (!remote) return null;
  const local = new Date(plan.meta.localModifiedAt);
  const remoteDate = new Date(remote);
  if (remoteDate > local) {
    return {
      localModifiedAt: plan.meta.localModifiedAt,
      remoteModifiedAt: remote,
    };
  }
  return null;
}

export async function syncPush(plan: PlanData): Promise<PlanData> {
  if (!plan.meta.spreadsheetId) throw new Error('No spreadsheet linked');
  if (!getAccessToken()) await requestAccessToken('');
  await pushPlanToSheet(plan, plan.meta.spreadsheetId);
  const updated: PlanData = {
    ...plan,
    meta: {
      ...plan.meta,
      lastSyncAt: new Date().toISOString(),
    },
  };
  await savePlan(updated);
  return updated;
}

export async function syncPull(plan: PlanData): Promise<PlanData> {
  if (!plan.meta.spreadsheetId) throw new Error('No spreadsheet linked');
  if (!getAccessToken()) await requestAccessToken('');
  const remote = await pullPlanFromSheet(plan.meta.spreadsheetId);
  remote.meta.spreadsheetId = plan.meta.spreadsheetId;
  remote.meta.backupSpreadsheetId = plan.meta.backupSpreadsheetId;
  remote.meta.googleConnected = true;
  remote.meta.onboarded = true;
  await savePlan(remote);
  return remote;
}

export async function createGooglePlan(plan: PlanData): Promise<PlanData> {
  if (!getAccessToken()) await requestAccessToken('consent');
  const id = await createPlanSpreadsheet("Let's Make a Plan");
  const ready = planFromCsvForNewSheet(plan);
  ready.meta.spreadsheetId = id;
  ready.meta.googleConnected = true;
  ready.meta.onboarded = true;
  await pushPlanToSheet(ready, id);
  await savePlan(ready);
  return ready;
}

export async function linkGooglePlan(spreadsheetId: string): Promise<PlanData> {
  if (!getAccessToken()) await requestAccessToken('');
  const remote = await pullPlanFromSheet(spreadsheetId);
  remote.meta.spreadsheetId = spreadsheetId;
  remote.meta.googleConnected = true;
  remote.meta.onboarded = true;
  await savePlan(remote);
  return remote;
}

export async function exportAndDownload(): Promise<void> {
  const csv = await exportPlanCsv();
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'plan.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export async function importFromFile(file: File): Promise<PlanData> {
  const text = await file.text();
  return importPlanCsv(text);
}

let syncTimer: ReturnType<typeof setTimeout> | null = null;

export function scheduleSyncPush(plan: PlanData, fn: (p: PlanData) => void): void {
  if (!plan.meta.googleConnected || !plan.meta.spreadsheetId) return;
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(async () => {
    try {
      if (getAccessToken()) {
        const updated = await syncPush(plan);
        fn(updated);
      }
    } catch (e) {
      console.warn('Background sync failed', e);
    }
  }, 3000);
}
