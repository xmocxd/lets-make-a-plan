import type { PlanData } from '../../types/plan';
import { PlanDataSchema } from '../../types/plan';

const SECTION = (name: string) => `### ${name} ###`;

function escapeCell(v: string): string {
  if (v.includes(',') || v.includes('"') || v.includes('\n')) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

function row(cells: (string | number | boolean)[]): string {
  return cells.map((c) => escapeCell(String(c))).join(',');
}

export function serializePlan(data: PlanData): string {
  const lines: string[] = [];
  const m = data.meta;
  lines.push(SECTION('Meta'));
  lines.push('key,value');
  lines.push(row(['schemaVersion', m.schemaVersion]));
  lines.push(row(['localModifiedAt', m.localModifiedAt]));
  if (m.lastSyncAt) lines.push(row(['lastSyncAt', m.lastSyncAt]));
  lines.push(row(['backupDue', m.backupDue]));
  if (m.lastLocalBackupAt) lines.push(row(['lastLocalBackupAt', m.lastLocalBackupAt]));
  if (m.lastDriveBackupAt) lines.push(row(['lastDriveBackupAt', m.lastDriveBackupAt]));
  if (m.spreadsheetId) lines.push(row(['spreadsheetId', m.spreadsheetId]));
  if (m.backupSpreadsheetId) lines.push(row(['backupSpreadsheetId', m.backupSpreadsheetId]));
  lines.push(row(['googleConnected', m.googleConnected]));
  lines.push(row(['onboarded', m.onboarded]));

  lines.push(SECTION('Settings'));
  lines.push('key,value');
  for (const [k, v] of Object.entries(data.settings)) {
    lines.push(row([k, v]));
  }

  lines.push(SECTION('DailyLog'));
  lines.push('date,calories,fat,sugar,isCheatDay,fatOverGoal,sugarOverGoal,fatSugarCheat,destressDone,isRestDay,exerciseActivityIds');
  for (const log of data.dailyLogs) {
    lines.push(row([
      log.date, log.calories, log.fat, log.sugar,
      log.isCheatDay, log.fatOverGoal, log.sugarOverGoal, log.fatSugarCheat,
      log.destressDone, log.isRestDay, log.exerciseActivityIds.join('|'),
    ]));
  }

  lines.push(SECTION('ExerciseActivities'));
  lines.push('id,name,goalWeight');
  for (const a of data.exerciseActivities) {
    lines.push(row([a.id, a.name, a.goalWeight]));
  }

  lines.push(SECTION('DestressSuggestions'));
  lines.push('id,text,lastShownAt');
  for (const s of data.destressSuggestions) {
    lines.push(row([s.id, s.text, s.lastShownAt ?? '']));
  }

  lines.push(SECTION('Mantras'));
  lines.push('id,text,isDefault,lastShownAt');
  for (const m of data.mantras) {
    lines.push(row([m.id, m.text, m.isDefault, m.lastShownAt ?? '']));
  }

  return lines.join('\n');
}

function parseSection(lines: string[], start: number): { headers: string[]; rows: string[][]; end: number } {
  let i = start;
  if (i >= lines.length) return { headers: [], rows: [], end: i };
  const headers = lines[i].split(',').map((h) => h.trim());
  i++;
  const rows: string[][] = [];
  while (i < lines.length && !lines[i].startsWith('###')) {
    if (lines[i].trim()) {
      rows.push(parseCsvLine(lines[i]));
    }
    i++;
  }
  return { headers, rows, end: i };
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      result.push(cur);
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur);
  return result;
}

function kvSection(rows: string[][]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const r of rows) {
    if (r.length >= 2) out[r[0]] = r[1];
  }
  return out;
}

export function deserializePlan(csv: string): PlanData {
  const lines = csv.split('\n');
  let i = 0;
  const metaKv: Record<string, string> = {};
  const settingsKv: Record<string, string> = {};
  const dailyLogs: PlanData['dailyLogs'] = [];
  const exerciseActivities: PlanData['exerciseActivities'] = [];
  const destressSuggestions: PlanData['destressSuggestions'] = [];
  const mantras: PlanData['mantras'] = [];

  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith('### Meta ###')) {
      const sec = parseSection(lines, i + 1);
      Object.assign(metaKv, kvSection(sec.rows));
      i = sec.end;
    } else if (line.startsWith('### Settings ###')) {
      const sec = parseSection(lines, i + 1);
      Object.assign(settingsKv, kvSection(sec.rows));
      i = sec.end;
    } else if (line.startsWith('### DailyLog ###')) {
      const sec = parseSection(lines, i + 1);
      for (const r of sec.rows) {
        dailyLogs.push({
          date: r[0],
          calories: Number(r[1]) || 0,
          fat: Number(r[2]) || 0,
          sugar: Number(r[3]) || 0,
          isCheatDay: r[4] === 'true',
          fatOverGoal: r[5] === 'true',
          sugarOverGoal: r[6] === 'true',
          fatSugarCheat: r[7] === 'true',
          destressDone: r[8] === 'true',
          isRestDay: r[9] === 'true',
          exerciseActivityIds: r[10] ? r[10].split('|').filter(Boolean) : [],
        });
      }
      i = sec.end;
    } else if (line.startsWith('### ExerciseActivities ###')) {
      const sec = parseSection(lines, i + 1);
      for (const r of sec.rows) {
        exerciseActivities.push({
          id: r[0],
          name: r[1],
          goalWeight: r[2] as 'half' | 'full',
        });
      }
      i = sec.end;
    } else if (line.startsWith('### DestressSuggestions ###')) {
      const sec = parseSection(lines, i + 1);
      for (const r of sec.rows) {
        destressSuggestions.push({
          id: r[0],
          text: r[1],
          lastShownAt: r[2] || undefined,
        });
      }
      i = sec.end;
    } else if (line.startsWith('### Mantras ###')) {
      const sec = parseSection(lines, i + 1);
      for (const r of sec.rows) {
        mantras.push({
          id: r[0],
          text: r[1],
          isDefault: r[2] === 'true',
          lastShownAt: r[3] || undefined,
        });
      }
      i = sec.end;
    } else {
      i++;
    }
  }

  const bool = (v: string | undefined) => v === 'true';
  const num = (v: string | undefined, def: number) => (v !== undefined && v !== '' ? Number(v) : def);

  const data: PlanData = {
    meta: {
      schemaVersion: num(metaKv.schemaVersion, 1),
      localModifiedAt: metaKv.localModifiedAt ?? new Date().toISOString(),
      lastSyncAt: metaKv.lastSyncAt,
      backupDue: bool(metaKv.backupDue),
      lastLocalBackupAt: metaKv.lastLocalBackupAt,
      lastDriveBackupAt: metaKv.lastDriveBackupAt,
      spreadsheetId: metaKv.spreadsheetId,
      backupSpreadsheetId: metaKv.backupSpreadsheetId,
      googleConnected: bool(metaKv.googleConnected),
      onboarded: bool(metaKv.onboarded),
    },
    settings: {
      calorieTarget: num(settingsKv.calorieTarget, 2000),
      fatGoal: num(settingsKv.fatGoal, 65),
      sugarGoal: num(settingsKv.sugarGoal, 50),
      fatTrackingEnabled: bool(settingsKv.fatTrackingEnabled),
      sugarTrackingEnabled: bool(settingsKv.sugarTrackingEnabled),
      cheatDaysPerWeek: num(settingsKv.cheatDaysPerWeek, 1),
      fatSugarCheatDaysPerMonth: num(settingsKv.fatSugarCheatDaysPerMonth, 1),
      dietCalorieExceedPctMax: num(settingsKv.dietCalorieExceedPctMax, 10),
      fatSugarExceedPctMax: num(settingsKv.fatSugarExceedPctMax, 20),
      restDaysPerWeek: num(settingsKv.restDaysPerWeek, 1),
      exerciseMonthGoalPct: num(settingsKv.exerciseMonthGoalPct, 90),
      destressPerWeekGoal: num(settingsKv.destressPerWeekGoal, 3),
      autoBackupEnabled: settingsKv.autoBackupEnabled !== 'false',
      driveBackupEnabled: settingsKv.driveBackupEnabled !== 'false',
    },
    dailyLogs,
    exerciseActivities,
    destressSuggestions,
    mantras,
  };

  return PlanDataSchema.parse(data);
}
