import type { CalorieStatus, DailyLog, ExerciseActivity, PlanData, Settings } from '../../types/plan';
import { getCalorieTotal } from '../diet/calories';
import {
  formatDate,
  getDaysInMonth,
  getMonthKey,
  getWeekDates,
  getWeekStart,
} from '../dates';

export function getCalorieStatus(calories: number, target: number): CalorieStatus {
  if (calories <= 0) return 'none';
  const ratio = calories / target;
  if (ratio <= 1.05) return 'good';
  if (ratio <= 1.5) return 'yellow';
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
    fatSugarCheat: false,
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

export function isExerciseDayGood(
  log: DailyLog,
  activities: ExerciseActivity[],
): boolean {
  return exerciseDayWeight(log, activities) >= 1;
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
    const status = getCalorieStatus(dayCalories, settings.calorieTarget);
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
  let cheatUsed = 0;
  let tracked = 0;

  for (const date of days) {
    const log = getLogForDate(logs, date);
    if (log.fatSugarCheat) cheatUsed++;
    const fatOver = settings.fatTrackingEnabled && log.fatOverGoal;
    const sugarOver = settings.sugarTrackingEnabled && log.sugarOverGoal;
    if (fatOver || sugarOver) {
      if (!log.fatSugarCheat) overDays++;
      tracked++;
    } else if (getCalorieTotal(log) > 0 || log.destressDone || log.exerciseActivityIds.length) {
      tracked++;
    }
  }

  const eligible = Math.max(tracked - cheatUsed, 1);
  const overPct = (overDays / eligible) * 100;
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
  let restDaysUsed = 0;

  for (const date of dates) {
    const log = getLogForDate(logs, date);
    if (log.isRestDay) restDaysUsed++;
    else if (isExerciseDayGood(log, activities)) fullDays++;
  }

  const idealFull = 7 - settings.restDaysPerWeek;
  const fullPct = (fullDays / idealFull) * 100;
  let penalty = 0;
  if (restDaysUsed < settings.restDaysPerWeek) {
    penalty = (settings.restDaysPerWeek - restDaysUsed) * 15;
  }
  const score = Math.max(0, Math.min(100, fullPct - penalty + (restDaysUsed >= settings.restDaysPerWeek ? 0 : 0)));
  const perfect = fullDays >= idealFull && restDaysUsed >= settings.restDaysPerWeek;

  return {
    fullDays,
    restDaysUsed,
    score: perfect ? 100 : Math.max(0, score),
    goalMet: fullDays >= idealFull && restDaysUsed >= settings.restDaysPerWeek,
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
