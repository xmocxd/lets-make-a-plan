import type { CalorieStatus, DailyLog, ExerciseActivity } from '../../types/plan';
import { getCalorieTotal } from '../diet/calories';
import { getCalorieStatus } from './diet';
import {
  exerciseDayWeight,
  isExerciseDayGood,
} from './exercise';
import { hasAnyDayEntry, hasDietEntry, hasExerciseEntry } from './logs';

export type DayStatus = CalorieStatus;
export type BinaryDayStatus = 'good' | 'bad' | 'none';
export type DestressDayStatus = 'good' | 'none';
export type DietCalendarStatus = CalorieStatus | 'unset';

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

export function getDestressDayStatus(log: DailyLog): DestressDayStatus {
  return log.destressDone ? 'good' : 'none';
}

export function getDietDayStatus(
  log: DailyLog,
  target: number,
  exceedPctMax: number,
): DietCalendarStatus {
  if (!hasAnyDayEntry(log)) return 'none';
  if (!hasDietEntry(log)) return 'unset';
  return getCalorieStatus(getCalorieTotal(log), target, exceedPctMax);
}
