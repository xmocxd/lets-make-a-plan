import type { DailyLog, ExerciseActivity, Settings } from '../../types/plan';
import { getDaysInMonth, getMondayWeekStart, getWeekDates } from '../dates';
import { getLogForDate } from './logs';

export function exerciseDayWeight(
  log: DailyLog,
  activities: ExerciseActivity[],
): number {
  if (log.isRestDay) return 0;
  let weight = 0;
  for (const id of log.exerciseActivityIds) {
    const a = activities.find((x) => x.id === id);
    if (a) weight += a.goalWeight === 'full' ? 1 : 0.5;
  }
  return weight;
}

/** Full-day credit: 1 for full, 0.5 for partial, 0 for none/rest. */
export function exerciseDayEquivalent(
  log: DailyLog,
  activities: ExerciseActivity[],
): number {
  if (log.isRestDay) return 0;
  const weight = exerciseDayWeight(log, activities);
  if (weight >= 1) return 1;
  if (weight > 0) return 0.5;
  return 0;
}

export function isExerciseDayGood(
  log: DailyLog,
  activities: ExerciseActivity[],
): boolean {
  return exerciseDayWeight(log, activities) >= 1;
}

export type ExerciseTier = 'full' | 'partial' | 'none';

export function getExerciseTier(
  log: DailyLog,
  activities: ExerciseActivity[],
): ExerciseTier {
  if (log.isRestDay) return 'none';
  const weight = exerciseDayWeight(log, activities);
  if (weight >= 1) return 'full';
  if (weight > 0) return 'partial';
  return 'none';
}

export interface WeekExerciseScore {
  fullDays: number;
  restDaysUsed: number;
  score: number;
  goalMet: boolean;
}

export function scoreExerciseWeek(
  logs: DailyLog[],
  weekStart: string,
  activities: ExerciseActivity[],
  settings: Settings,
): WeekExerciseScore {
  const dates = getWeekDates(weekStart);
  let fullDays = 0;
  let fullEquivalent = 0;
  let restDaysUsed = 0;

  for (const date of dates) {
    const log = getLogForDate(logs, date);
    if (log.isRestDay) restDaysUsed++;
    else {
      const eq = exerciseDayEquivalent(log, activities);
      fullEquivalent += eq;
      if (eq >= 1) fullDays++;
    }
  }

  const idealFull = 7 - settings.restDaysPerWeek;
  const fullPct = idealFull > 0 ? (fullEquivalent / idealFull) * 100 : 0;
  let penalty = 0;
  if (restDaysUsed < settings.restDaysPerWeek) {
    penalty = (settings.restDaysPerWeek - restDaysUsed) * 15;
  }
  const score = Math.max(0, Math.min(100, fullPct - penalty));
  const perfect = fullEquivalent >= idealFull && restDaysUsed >= settings.restDaysPerWeek;

  return {
    fullDays,
    restDaysUsed,
    score: perfect ? 100 : score,
    goalMet: fullEquivalent >= idealFull && restDaysUsed >= settings.restDaysPerWeek,
  };
}

export function scoreExerciseMonth(
  logs: DailyLog[],
  monthKey: string,
  activities: ExerciseActivity[],
  settings: Settings,
): { score: number; goalMet: boolean } {
  const days = getDaysInMonth(monthKey);
  const weekStarts = new Set(days.map((d) => getMondayWeekStart(d)));
  const scores = [...weekStarts].map((ws) =>
    scoreExerciseWeek(logs, ws, activities, settings),
  );
  const avg = scores.length ? scores.reduce((s, w) => s + w.score, 0) / scores.length : 0;
  return { score: avg, goalMet: avg >= settings.exerciseMonthGoalPct };
}

const REST_DAY_SCORE_PENALTY = 5;

export function scoreExerciseComponentWeek(
  logs: DailyLog[],
  weekStartMonday: string,
  activities: ExerciseActivity[],
  settings: Settings,
): number {
  const dates = getWeekDates(weekStartMonday);
  let fullEquivalent = 0;
  let restDaysUsed = 0;

  for (const date of dates) {
    const log = getLogForDate(logs, date);
    if (log.isRestDay) restDaysUsed++;
    else fullEquivalent += exerciseDayEquivalent(log, activities);
  }

  const idealFull = 7 - settings.restDaysPerWeek;
  let score = idealFull > 0 ? (fullEquivalent / idealFull) * 100 : 0;
  if (restDaysUsed < settings.restDaysPerWeek) {
    score -= (settings.restDaysPerWeek - restDaysUsed) * REST_DAY_SCORE_PENALTY;
  }
  return Math.max(0, Math.min(100, score));
}

export function scoreExerciseElapsed(
  logs: DailyLog[],
  dates: string[],
  activities: ExerciseActivity[],
  settings: Settings,
  daysRemaining: number,
): number {
  let fullEquivalent = 0;
  let restDaysUsed = 0;

  for (const date of dates) {
    const log = getLogForDate(logs, date);
    if (log.isRestDay) restDaysUsed++;
    else fullEquivalent += exerciseDayEquivalent(log, activities);
  }

  const restStillNeeded = Math.max(0, settings.restDaysPerWeek - restDaysUsed);
  const projectedRestUsed = restDaysUsed + Math.min(restStillNeeded, daysRemaining);

  const idealFull = 7 - settings.restDaysPerWeek;
  const elapsedExerciseDays = dates.length - restDaysUsed;
  let score = 0;
  if (idealFull > 0 && elapsedExerciseDays > 0) {
    const rate = fullEquivalent / elapsedExerciseDays;
    score = rate * 100;
  }
  if (projectedRestUsed < settings.restDaysPerWeek) {
    score -= (settings.restDaysPerWeek - projectedRestUsed) * REST_DAY_SCORE_PENALTY;
  }
  return Math.max(0, Math.min(100, score));
}
