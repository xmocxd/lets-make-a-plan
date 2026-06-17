import { getLastSunday3AM } from '../dates';
import type { PlanData } from '../../types/plan';
import { rotateLocalBackups, savePlan } from '../csv/store';
import {
  createBackupSpreadsheet,
  overwriteBackupSpreadsheet,
  pushPlanToSheet,
} from '../google/sheets';
import { getAccessToken } from '../google/auth';

export function checkBackupDue(plan: PlanData): boolean {
  const lastSunday = getLastSunday3AM();
  const lastBackup = plan.meta.lastLocalBackupAt
    ? new Date(plan.meta.lastLocalBackupAt)
    : new Date(0);
  return lastSunday > lastBackup;
}

export async function updateBackupDueFlag(plan: PlanData): Promise<PlanData> {
  const due = checkBackupDue(plan);
  if (due === plan.meta.backupDue) return plan;
  const updated = { ...plan, meta: { ...plan.meta, backupDue: due } };
  await savePlan(updated);
  return updated;
}

export interface BackupResult {
  local: boolean;
  drive: boolean;
  error?: string;
}

export async function runBackup(
  plan: PlanData,
  onProgress?: (msg: string) => void,
): Promise<{ plan: PlanData; result: BackupResult }> {
  const result: BackupResult = { local: false, drive: false };
  let updated = { ...plan };

  try {
    onProgress?.('Saving local backup…');
    await rotateLocalBackups();
    updated = {
      ...updated,
      meta: {
        ...updated.meta,
        lastLocalBackupAt: new Date().toISOString(),
        backupDue: false,
      },
    };
    result.local = true;
  } catch (e) {
    result.error = e instanceof Error ? e.message : 'Local backup failed';
  }

  if (
    updated.settings.driveBackupEnabled &&
    updated.meta.googleConnected &&
    updated.meta.spreadsheetId &&
    getAccessToken()
  ) {
    const spreadsheetId = updated.meta.spreadsheetId;
    try {
      onProgress?.('Backing up to Google Drive…');
      let backupId = updated.meta.backupSpreadsheetId;
      if (!backupId) {
        backupId = await createBackupSpreadsheet(
          spreadsheetId,
          "Let's Make a Plan (Backup)",
        );
        updated = {
          ...updated,
          meta: { ...updated.meta, backupSpreadsheetId: backupId },
        };
      } else {
        await overwriteBackupSpreadsheet(spreadsheetId, backupId);
      }
      await pushPlanToSheet(updated, spreadsheetId);
      updated = {
        ...updated,
        meta: {
          ...updated.meta,
          lastDriveBackupAt: new Date().toISOString(),
        },
      };
      result.drive = true;
    } catch (e) {
      result.error = e instanceof Error ? e.message : 'Drive backup failed';
    }
  }

  await savePlan(updated);
  return { plan: updated, result };
}

export async function runBackupIfDue(
  plan: PlanData,
  onProgress?: (msg: string) => void,
): Promise<{ plan: PlanData; ran: boolean; result?: BackupResult }> {
  const withFlag = await updateBackupDueFlag(plan);
  if (!withFlag.meta.backupDue || !withFlag.settings.autoBackupEnabled) {
    return { plan: withFlag, ran: false };
  }
  const { plan: updated, result } = await runBackup(withFlag, onProgress);
  return { plan: updated, ran: true, result };
}
