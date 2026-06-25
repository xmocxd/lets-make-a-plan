import type { DailyLog, DayPlan } from '../types/plan';

/** Blank log for a day that has not been saved yet. */
export function emptyDailyLog(date: string): DailyLog {
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

/** Blank plan entry for a day that has not been planned yet. */
export function emptyDayPlan(date: string): DayPlan {
  return {
    date,
    exerciseActivityIds: [],
    isRestDay: false,
    isCheatDay: false,
    destressPlanned: false,
  };
}
