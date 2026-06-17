import { serializePlan, deserializePlan } from '../csv/serialize';
import type { PlanData } from '../../types/plan';
import { SCHEMA_VERSION } from '../../types/plan';
import { getAccessToken } from './auth';

const TAB_NAMES = ['Meta', 'Settings', 'DailyLog', 'ExerciseActivities', 'DestressSuggestions', 'Mantras'];

export async function createPlanSpreadsheet(title: string): Promise<string> {
  const token = getAccessToken();
  if (!token) throw new Error('Not authenticated');

  const res = await gapi.client.sheets.spreadsheets.create({
    resource: {
      properties: { title },
      sheets: TAB_NAMES.map((t) => ({ properties: { title: t } })),
    },
  });
  return res.result.spreadsheetId;
}

export async function pushPlanToSheet(plan: PlanData, spreadsheetId: string): Promise<void> {
  const csv = serializePlan(plan);
  const sections = csv.split(/### (\w+) ###/).filter(Boolean);
  const data: { range: string; values: string[][] }[] = [];

  for (let i = 0; i < sections.length; i += 2) {
    const tabName = sections[i];
    const content = sections[i + 1]?.trim();
    if (!content || !TAB_NAMES.includes(tabName)) continue;
    const rows = content.split('\n').map((line) => {
      const cells: string[] = [];
      let cur = '';
      let inQ = false;
      for (const c of line) {
        if (inQ) {
          if (c === '"') inQ = false;
          else cur += c;
        } else if (c === '"') inQ = true;
        else if (c === ',') {
          cells.push(cur);
          cur = '';
        } else cur += c;
      }
      cells.push(cur);
      return cells;
    });
    data.push({ range: `${tabName}!A1`, values: rows });
  }

  await gapi.client.sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    resource: {
      valueInputOption: 'RAW',
      data,
    },
  });
}

export async function pullPlanFromSheet(spreadsheetId: string): Promise<PlanData> {
  const res = await gapi.client.sheets.spreadsheets.values.batchGet({
    spreadsheetId,
    ranges: TAB_NAMES.map((t) => `${t}!A:Z`),
  });

  const parts: string[] = [];
  for (let i = 0; i < TAB_NAMES.length; i++) {
    const tab = TAB_NAMES[i];
    const values = res.result.valueRanges[i]?.values;
    parts.push(`### ${tab} ###`);
    if (values) {
      parts.push(...values.map((row) => row.join(',')));
    }
  }

  return deserializePlan(parts.join('\n'));
}

export async function getSheetModifiedTime(spreadsheetId: string): Promise<string | null> {
  try {
    const res = await gapi.client.drive.files.get({
      fileId: spreadsheetId,
      fields: 'modifiedTime',
    });
    return res.result.modifiedTime ?? null;
  } catch {
    return null;
  }
}

export async function validateSpreadsheet(spreadsheetId: string): Promise<boolean> {
  try {
    const plan = await pullPlanFromSheet(spreadsheetId);
    return plan.meta.schemaVersion >= 1;
  } catch {
    return false;
  }
}

export async function createBackupSpreadsheet(
  sourceId: string,
  title: string,
): Promise<string> {
  const res = await gapi.client.drive.files.copy({
    fileId: sourceId,
    resource: { name: title },
  });
  return res.result.id;
}

export async function overwriteBackupSpreadsheet(
  sourceId: string,
  backupId: string,
): Promise<void> {
  const plan = await pullPlanFromSheet(sourceId);
  await pushPlanToSheet(plan, backupId);
}

export function planFromCsvForNewSheet(plan: PlanData): PlanData {
  return {
    ...plan,
    meta: {
      ...plan.meta,
      schemaVersion: SCHEMA_VERSION,
      localModifiedAt: new Date().toISOString(),
    },
  };
}
