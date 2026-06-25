import type { DailyLog } from '../../types/plan';
import { emptyDailyLog } from '../defaults';

export function getLogForDate(logs: DailyLog[], date: string): DailyLog {
  const found = logs.find((l) => l.date === date);
  if (found) {
    return {
      ...found,
      calorieEntries: found.calorieEntries ?? (found.calories > 0 ? [found.calories] : []),
    };
  }
  return emptyDailyLog(date);
}

export function hasDietEntry(log: DailyLog): boolean {
  const entries = log.calorieEntries?.length
    ? log.calorieEntries
    : log.calories > 0
      ? [log.calories]
      : [];
  return entries.length > 0;
}

export function hasExerciseEntry(log: DailyLog): boolean {
  return log.isRestDay || log.exerciseActivityIds.length > 0;
}

/** True when the user has logged at least one thing for this day. */
export function hasAnyDayEntry(log: DailyLog): boolean {
  return (
    hasDietEntry(log) ||
    hasExerciseEntry(log) ||
    log.destressDone ||
    log.isCheatDay ||
    log.fatOverGoal ||
    log.sugarOverGoal
  );
}
