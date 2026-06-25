import type { DailyLog, ExerciseActivity, PlanData, Settings } from '../../types/plan';
import { WEEK_SCORE_WEIGHTS } from '../constants';
import { formatDate, getMondayWeekStart, getMondayWeekStartsInMonth, getWeekDates } from '../dates';
import { scoreCalmComponentWeek, scoreCalmElapsed } from './calm';
import { getEffectiveDietDayStatus, scoreDietComponentWeek, scoreDietElapsed } from './diet';
import { getExerciseTier, scoreExerciseComponentWeek, scoreExerciseElapsed } from './exercise';
import { getLogForDate, hasAnyDayEntry } from './logs';

export type LetterGrade = 'A' | 'B' | 'C' | 'D' | 'F';

export { WEEK_SCORE_WEIGHTS };

export function getLetterGrade(score: number): LetterGrade {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

function combineWeekScore(diet: number, exercise: number, calm: number): number {
  return (
    diet * WEEK_SCORE_WEIGHTS.diet +
    exercise * WEEK_SCORE_WEIGHTS.exercise +
    calm * WEEK_SCORE_WEIGHTS.calm
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

export function isWeekComplete(
  logs: DailyLog[],
  referenceDate: string,
  asOfDate: string = formatDate(),
): boolean {
  const weekStart = getMondayWeekStart(referenceDate);
  const sunday = getWeekDates(weekStart)[6];
  if (sunday > asOfDate) return false;
  if (sunday < asOfDate) return true;
  return hasAnyDayEntry(getLogForDate(logs, sunday));
}

export function getWeekScoreForReport(
  plan: PlanData,
  weekStartMonday: string,
  asOfDate: string = formatDate(),
): { score: number; grade: LetterGrade } {
  const complete = isWeekComplete(plan.dailyLogs, weekStartMonday, asOfDate);
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
