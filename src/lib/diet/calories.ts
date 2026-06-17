import type { DailyLog } from '../../types/plan';

export function sumCalorieEntries(entries: number[]): number {
  return entries.reduce((s, n) => s + n, 0);
}

/** Normalize log so `calories` always matches entry sum. Migrates legacy single-total rows. */
export function normalizeDailyCalories(log: DailyLog): DailyLog {
  const entries =
    log.calorieEntries?.length > 0
      ? log.calorieEntries
      : log.calories > 0
        ? [log.calories]
        : [];
  const calories = sumCalorieEntries(entries);
  return { ...log, calorieEntries: entries, calories };
}

export function getCalorieTotal(log: DailyLog): number {
  if (log.calorieEntries?.length) return sumCalorieEntries(log.calorieEntries);
  return log.calories;
}
