import type { CalorieStatus, DailyLog, ExerciseActivity, PlanData, Settings } from '../../types/plan';
import { getCalorieTotal } from '../diet/calories';
import {
  formatDate,
  getDaysInMonth,
  getMondayWeekStart,
  getMondayWeekStartsInMonth,
  getMonthKey,
  getWeekDates,
  getWeekStart,
} from '../dates';

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

export function getLogForDate(logs: DailyLog[], date: string): DailyLog {
  const found = logs.find((l) => l.date === date);
  if (found) {
    return {
      ...found,
      calorieEntries: found.calorieEntries ?? (found.calories > 0 ? [found.calories] : []),
    };
  }
  return {
    date,
    calories: 0,
    calorieEntries: [],
    fat: 0,
    sugar: 0,
    isCheatDay: false,
    fatOverGoal: false,
    sugarOverGoal: false,
    destressDone: false,
    isRestDay: false,
    exerciseActivityIds: [],
  };
}

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

export type DayStatus = CalorieStatus;

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

export type BinaryDayStatus = 'good' | 'bad' | 'none';

export function getFatDayStatus(log: DailyLog): BinaryDayStatus {
  return log.fatOverGoal ? 'bad' : 'none';
}

export function getSugarDayStatus(log: DailyLog): BinaryDayStatus {
  return log.sugarOverGoal ? 'bad' : 'none';
}

export function getExerciseDayStatus(
  log: DailyLog,
  activities: ExerciseActivity[],
): DayStatus {
  if (!hasExerciseEntry(log)) {
    return hasAnyDayEntry(log) ? 'bad' : 'none';
  }
  if (log.isRestDay || isExerciseDayGood(log, activities)) return 'good';
  const weight = exerciseDayWeight(log, activities);
  if (weight > 0) return 'yellow';
  return 'bad';
}

export type DestressDayStatus = 'good' | 'none';

export function getDestressDayStatus(log: DailyLog): DestressDayStatus {
  return log.destressDone ? 'good' : 'none';
}

export type DietCalendarStatus = CalorieStatus | 'unset';

export function getDietDayStatus(
  log: DailyLog,
  target: number,
  exceedPctMax: number,
): DietCalendarStatus {
  if (!hasAnyDayEntry(log)) return 'none';
  if (!hasDietEntry(log)) return 'unset';
  return getCalorieStatus(getCalorieTotal(log), target, exceedPctMax);
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
  const weekStarts = new Set(days.map((d) => getWeekStart(d)));
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
  const weekStarts = new Set(days.map((d) => getWeekStart(d)));
  const scores = [...weekStarts].map((ws) =>
    scoreExerciseWeek(logs, ws, activities, settings),
  );
  const avg = scores.length ? scores.reduce((s, w) => s + w.score, 0) / scores.length : 0;
  return { score: avg, goalMet: avg >= settings.exerciseMonthGoalPct };
}

export function scoreDestressWeek(
  logs: DailyLog[],
  weekStart: string,
  settings: Settings,
): { count: number; goalMet: boolean; score: number } {
  const dates = getWeekDates(weekStart);
  let count = 0;
  for (const date of dates) {
    if (getLogForDate(logs, date).destressDone) count++;
  }
  const score = Math.min(100, (count / settings.destressPerWeekGoal) * 100);
  return { count, goalMet: count >= settings.destressPerWeekGoal, score };
}

export function scoreDestressMonth(
  logs: DailyLog[],
  monthKey: string,
  settings: Settings,
): { score: number; goalMet: boolean } {
  const days = getDaysInMonth(monthKey);
  const weekStarts = new Set(days.map((d) => getWeekStart(d)));
  const scores = [...weekStarts].map((ws) => scoreDestressWeek(logs, ws, settings));
  const avg = scores.length ? scores.reduce((s, w) => s + w.score, 0) / scores.length : 0;
  return { score: avg, goalMet: scores.every((s) => s.goalMet) };
}

export interface ReportCardScores {
  dietCalories: { week: WeekDietScore; month: ReturnType<typeof scoreDietMonth> };
  fatSugar: ReturnType<typeof scoreFatSugarMonth>;
  exercise: { week: WeekExerciseScore; month: ReturnType<typeof scoreExerciseMonth> };
  destress: { week: ReturnType<typeof scoreDestressWeek>; month: ReturnType<typeof scoreDestressMonth> };
}

export function getReportCard(
  plan: PlanData,
  date: string = formatDate(),
): ReportCardScores {
  const weekStart = getWeekStart(date);
  const monthKey = getMonthKey(date);
  return {
    dietCalories: {
      week: scoreDietWeek(plan.dailyLogs, weekStart, plan.settings),
      month: scoreDietMonth(plan.dailyLogs, monthKey, plan.settings),
    },
    fatSugar: scoreFatSugarMonth(plan.dailyLogs, monthKey, plan.settings),
    exercise: {
      week: scoreExerciseWeek(
        plan.dailyLogs,
        weekStart,
        plan.exerciseActivities,
        plan.settings,
      ),
      month: scoreExerciseMonth(
        plan.dailyLogs,
        monthKey,
        plan.exerciseActivities,
        plan.settings,
      ),
    },
    destress: {
      week: scoreDestressWeek(plan.dailyLogs, weekStart, plan.settings),
      month: scoreDestressMonth(plan.dailyLogs, monthKey, plan.settings),
    },
  };
}

export function getMonthlyTrend(
  plan: PlanData,
  monthKeys: string[],
): {
  month: string;
  diet: number;
  exercise: number;
  destress: number;
}[] {
  return monthKeys.map((month) => ({
    month,
    diet: scoreDietMonth(plan.dailyLogs, month, plan.settings).score,
    exercise: scoreExerciseMonth(
      plan.dailyLogs,
      month,
      plan.exerciseActivities,
      plan.settings,
    ).score,
    destress: scoreDestressMonth(plan.dailyLogs, month, plan.settings).score,
  }));
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

export interface WeekSummary {
  weekStart: string;
  dates: string[];
  diet: { good: number; yellow: number; bad: number };
  exercise: { full: number; partial: number; none: number };
  cheatDaysUsed: number;
  cheatDaysAllowed: number;
  restDaysUsed: number;
  restDaysAllowed: number;
  calmDays: number;
  calmGoal: number;
}

export function getWeekSummary(
  logs: DailyLog[],
  referenceDate: string,
  activities: ExerciseActivity[],
  settings: Settings,
  asOfDate: string = formatDate(),
): WeekSummary {
  const weekStart = getMondayWeekStart(referenceDate);
  const dates = getWeekDates(weekStart);
  let good = 0;
  let yellow = 0;
  let bad = 0;
  let full = 0;
  let partial = 0;
  let none = 0;
  let cheatDaysUsed = 0;
  let restDaysUsed = 0;
  let calmDays = 0;
  let allowedCheatUsed = 0;

  for (const date of dates) {
    const isFuture = date > asOfDate;
    const log = getLogForDate(logs, date);
    if (date === asOfDate && !hasAnyDayEntry(log)) {
      continue;
    }
    if (log.isCheatDay) cheatDaysUsed++;
    if (log.isRestDay) restDaysUsed++;
    if (log.destressDone) calmDays++;

    const dietStatus = getEffectiveDietDayStatus(log, settings, allowedCheatUsed);
    if (log.isCheatDay && allowedCheatUsed < settings.cheatDaysPerWeek) {
      allowedCheatUsed++;
    }
    if (dietStatus === 'good') good++;
    else if (dietStatus === 'yellow') yellow++;
    else if (dietStatus === 'bad') bad++;
    else if (!isFuture) bad++;

    if (!log.isRestDay) {
      const tier = getExerciseTier(log, activities);
      if (tier === 'full') full++;
      else if (tier === 'partial') partial++;
      else if (!isFuture) none++;
    }
  }

  return {
    weekStart,
    dates,
    diet: { good, yellow, bad },
    exercise: { full, partial, none },
    cheatDaysUsed,
    cheatDaysAllowed: settings.cheatDaysPerWeek,
    restDaysUsed,
    restDaysAllowed: settings.restDaysPerWeek,
    calmDays,
    calmGoal: settings.destressPerWeekGoal,
  };
}

const REST_DAY_SCORE_PENALTY = 5;

export const WEEK_SCORE_WEIGHTS = {
  diet: 0.5,
  exercise: 0.48,
  calm: 0.02,
} as const;

function combineWeekScore(diet: number, exercise: number, calm: number): number {
  return (
    diet * WEEK_SCORE_WEIGHTS.diet +
    exercise * WEEK_SCORE_WEIGHTS.exercise +
    calm * WEEK_SCORE_WEIGHTS.calm
  );
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

export function scoreCalmComponentWeek(
  logs: DailyLog[],
  weekStartMonday: string,
  settings: Settings,
): number {
  const dates = getWeekDates(weekStartMonday);
  let count = 0;
  for (const date of dates) {
    if (getLogForDate(logs, date).destressDone) count++;
  }
  if (settings.destressPerWeekGoal <= 0) return 100;
  return Math.min(100, (count / settings.destressPerWeekGoal) * 100);
}

export type LetterGrade = 'A' | 'B' | 'C' | 'D' | 'F';

export function getLetterGrade(score: number): LetterGrade {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

export function getCombinedWeekScore(
  logs: DailyLog[],
  referenceDate: string,
  activities: ExerciseActivity[],
  settings: Settings,
): { score: number; grade: LetterGrade } {
  const weekStart = getMondayWeekStart(referenceDate);
  const diet = scoreDietComponentWeek(logs, weekStart, settings);
  const exercise = scoreExerciseComponentWeek(logs, weekStart, activities, settings);
  const calm = scoreCalmComponentWeek(logs, weekStart, settings);
  const score = combineWeekScore(diet, exercise, calm);
  return { score, grade: getLetterGrade(score) };
}

function scoreDietElapsed(
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

function scoreExerciseElapsed(
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

function scoreCalmElapsed(
  logs: DailyLog[],
  dates: string[],
  settings: Settings,
): number {
  if (settings.destressPerWeekGoal <= 0) return 100;
  let calmDays = 0;
  for (const date of dates) {
    if (getLogForDate(logs, date).destressDone) calmDays++;
  }
  if (dates.length === 0) return 0;
  const projectedCalmCount = (calmDays / dates.length) * 7;
  return Math.min(100, (projectedCalmCount / settings.destressPerWeekGoal) * 100);
}

export function getProjectedWeekScore(
  logs: DailyLog[],
  referenceDate: string,
  activities: ExerciseActivity[],
  settings: Settings,
  asOfDate: string = formatDate(),
): { score: number; grade: LetterGrade } {
  const weekStart = getMondayWeekStart(referenceDate);
  const dates = getWeekDates(weekStart);
  const elapsedDates = dates.filter((d) => {
    if (d > asOfDate) return false;
    if (d === asOfDate && !hasAnyDayEntry(getLogForDate(logs, d))) return false;
    return true;
  });
  const elapsedDays = elapsedDates.length;

  if (elapsedDays === 0) {
    return { score: 0, grade: 'F' };
  }

  const daysRemaining = 7 - elapsedDays;
  const diet = scoreDietElapsed(logs, elapsedDates, settings);
  const exercise = scoreExerciseElapsed(
    logs,
    elapsedDates,
    activities,
    settings,
    daysRemaining,
  );
  const calm = scoreCalmElapsed(logs, elapsedDates, settings);
  const score = combineWeekScore(diet, exercise, calm);
  return { score, grade: getLetterGrade(score) };
}

export function isWeekComplete(logs: DailyLog[], referenceDate: string): boolean {
  const weekStart = getMondayWeekStart(referenceDate);
  const dates = getWeekDates(weekStart);
  const sunday = dates[6];
  return hasAnyDayEntry(getLogForDate(logs, sunday));
}

export function getWeekScoreForReport(
  plan: PlanData,
  weekStartMonday: string,
  asOfDate: string = formatDate(),
): { score: number; grade: LetterGrade } {
  const complete = isWeekComplete(plan.dailyLogs, weekStartMonday);
  if (complete) {
    return getCombinedWeekScore(
      plan.dailyLogs,
      weekStartMonday,
      plan.exerciseActivities,
      plan.settings,
    );
  }
  const weekStart = getMondayWeekStart(weekStartMonday);
  if (weekStart > getMondayWeekStart(asOfDate)) {
    return { score: 0, grade: 'F' };
  }
  return getProjectedWeekScore(
    plan.dailyLogs,
    weekStartMonday,
    plan.exerciseActivities,
    plan.settings,
    asOfDate,
  );
}

export function getMonthWeekBreakdown(
  plan: PlanData,
  monthKey: string,
  asOfDate: string = formatDate(),
): { weekStart: string; score: number; grade: LetterGrade }[] {
  const weekStarts = getMondayWeekStartsInMonth(monthKey);
  return weekStarts.map((weekStart) => {
    const result = getWeekScoreForReport(plan, weekStart, asOfDate);
    return { weekStart, score: result.score, grade: result.grade };
  });
}

export function averageScores(scores: number[]): number {
  if (!scores.length) return 0;
  return scores.reduce((sum, s) => sum + s, 0) / scores.length;
}

export function getMonthCombinedScore(
  plan: PlanData,
  monthKey: string,
  asOfDate: string = formatDate(),
): { score: number; grade: LetterGrade } {
  const weeks = getMonthWeekBreakdown(plan, monthKey, asOfDate);
  const score = averageScores(weeks.map((w) => w.score));
  return { score, grade: getLetterGrade(score) };
}
