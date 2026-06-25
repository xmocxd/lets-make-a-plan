import type { DailyLog, Settings } from '../../types/plan';
import { getDaysInMonth, getMondayWeekStart, getWeekDates } from '../dates';
import { getLogForDate } from './logs';

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
  const weekStarts = new Set(days.map((d) => getMondayWeekStart(d)));
  const scores = [...weekStarts].map((ws) => scoreDestressWeek(logs, ws, settings));
  const avg = scores.length ? scores.reduce((s, w) => s + w.score, 0) / scores.length : 0;
  return { score: avg, goalMet: scores.every((s) => s.goalMet) };
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

export function scoreCalmElapsed(
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
