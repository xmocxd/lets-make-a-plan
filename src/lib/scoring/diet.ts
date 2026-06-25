import type { CalorieStatus, DailyLog, Settings } from '../../types/plan';
import { getCalorieTotal } from '../diet/calories';
import { getDaysInMonth, getMondayWeekStart, getWeekDates } from '../dates';
import { getLogForDate, hasAnyDayEntry, hasDietEntry } from './logs';

export function getCalorieStatus(
  calories: number,
  target: number,
  exceedPctMax: number = 10,
): CalorieStatus {
  if (calories <= 0) return 'none';
  if (calories <= target) return 'good';
  const exceedPct = ((calories - target) / target) * 100;
  if (exceedPct <= exceedPctMax) return 'yellow';
  return 'bad';
}

export function getEffectiveDietDayStatus(
  log: DailyLog,
  settings: Settings,
  allowedCheatDaysUsed: number,
): CalorieStatus | 'none' {
  if (!hasAnyDayEntry(log) && !log.isCheatDay) return 'none';

  if (log.isCheatDay) {
    return allowedCheatDaysUsed < settings.cheatDaysPerWeek ? 'good' : 'bad';
  }

  if (!hasDietEntry(log)) return 'none';

  const fatBad = settings.fatTrackingEnabled && log.fatOverGoal;
  const sugarBad = settings.sugarTrackingEnabled && log.sugarOverGoal;
  if (fatBad || sugarBad) return 'bad';

  return getCalorieStatus(
    getCalorieTotal(log),
    settings.calorieTarget,
    settings.dietCalorieExceedPctMax,
  );
}

export interface WeekDietScore {
  good: number;
  yellow: number;
  bad: number;
  cheatDaysUsed: number;
  exceedPct: number;
  score: number;
  goalMet: boolean;
}

export function scoreDietWeek(
  logs: DailyLog[],
  weekStart: string,
  settings: Settings,
): WeekDietScore {
  const dates = getWeekDates(weekStart);
  let good = 0;
  let yellow = 0;
  let bad = 0;
  let cheatDaysUsed = 0;
  let exceedTotal = 0;
  let countedDays = 0;

  for (const date of dates) {
    const log = getLogForDate(logs, date);
    if (log.isCheatDay) cheatDaysUsed++;
    const dayCalories = getCalorieTotal(log);
    const status = getCalorieStatus(
      dayCalories,
      settings.calorieTarget,
      settings.dietCalorieExceedPctMax,
    );
    if (status === 'good') good++;
    else if (status === 'yellow') yellow++;
    else if (status === 'bad') bad++;

    if (!log.isCheatDay && dayCalories > settings.calorieTarget) {
      exceedTotal += ((dayCalories - settings.calorieTarget) / settings.calorieTarget) * 100;
      countedDays++;
    }
  }

  const exceedPct = countedDays > 0 ? exceedTotal / countedDays : 0;
  const cheatPenalty = Math.max(0, cheatDaysUsed - settings.cheatDaysPerWeek) * 10;
  const statusScore = ((good * 100 + yellow * 50) / 7) - cheatPenalty;
  const goalMet = exceedPct < settings.dietCalorieExceedPctMax && cheatDaysUsed <= settings.cheatDaysPerWeek;

  return {
    good,
    yellow,
    bad,
    cheatDaysUsed,
    exceedPct,
    score: Math.max(0, Math.min(100, statusScore)),
    goalMet,
  };
}

export function scoreDietMonth(
  logs: DailyLog[],
  monthKey: string,
  settings: Settings,
): { score: number; goalMet: boolean; exceedPct: number } {
  const days = getDaysInMonth(monthKey);
  const weekStarts = new Set(days.map((d) => getMondayWeekStart(d)));
  const weekScores = [...weekStarts].map((ws) => scoreDietWeek(logs, ws, settings));
  const avgScore = weekScores.length
    ? weekScores.reduce((s, w) => s + w.score, 0) / weekScores.length
    : 0;
  const avgExceed = weekScores.length
    ? weekScores.reduce((s, w) => s + w.exceedPct, 0) / weekScores.length
    : 0;
  return {
    score: avgScore,
    exceedPct: avgExceed,
    goalMet: avgExceed < settings.dietCalorieExceedPctMax,
  };
}

export function scoreFatSugarMonth(
  logs: DailyLog[],
  monthKey: string,
  settings: Settings,
): { overPct: number; goalMet: boolean } {
  if (!settings.fatTrackingEnabled && !settings.sugarTrackingEnabled) {
    return { overPct: 0, goalMet: true };
  }
  const days = getDaysInMonth(monthKey);
  let overDays = 0;
  let eligible = 0;

  for (const date of days) {
    const log = getLogForDate(logs, date);
    if (log.isCheatDay) continue;
    const hasActivity =
      hasDietEntry(log) ||
      log.exerciseActivityIds.length > 0 ||
      log.destressDone ||
      log.isRestDay;
    if (!hasActivity) continue;
    eligible++;
    const fatOver = settings.fatTrackingEnabled && log.fatOverGoal;
    const sugarOver = settings.sugarTrackingEnabled && log.sugarOverGoal;
    if (fatOver || sugarOver) overDays++;
  }

  const overPct = eligible > 0 ? (overDays / eligible) * 100 : 0;
  return {
    overPct,
    goalMet: overPct < settings.fatSugarExceedPctMax,
  };
}

export function scoreDietComponentWeek(
  logs: DailyLog[],
  weekStartMonday: string,
  settings: Settings,
): number {
  const dates = getWeekDates(weekStartMonday);
  let points = 0;
  let allowedCheatUsed = 0;

  for (const date of dates) {
    const log = getLogForDate(logs, date);
    const status = getEffectiveDietDayStatus(log, settings, allowedCheatUsed);
    if (log.isCheatDay && allowedCheatUsed < settings.cheatDaysPerWeek) {
      allowedCheatUsed++;
    }
    if (status === 'good') points += 100;
    else if (status === 'yellow') points += 50;
  }

  return points / 7;
}

export function scoreDietElapsed(
  logs: DailyLog[],
  dates: string[],
  settings: Settings,
): number {
  let points = 0;
  let allowedCheatUsed = 0;
  for (const date of dates) {
    const log = getLogForDate(logs, date);
    const status = getEffectiveDietDayStatus(log, settings, allowedCheatUsed);
    if (log.isCheatDay && allowedCheatUsed < settings.cheatDaysPerWeek) {
      allowedCheatUsed++;
    }
    if (status === 'good') points += 100;
    else if (status === 'yellow') points += 50;
  }
  return dates.length > 0 ? points / dates.length : 0;
}
