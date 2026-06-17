import { describe, it, expect } from 'vitest';
import {
  getDietDayStatus,
  getExerciseDayStatus,
  getDestressDayStatus,
  getFatDayStatus,
  getSugarDayStatus,
} from '../scoring';
import type { DailyLog, ExerciseActivity } from '../../types/plan';

const activities: ExerciseActivity[] = [
  { id: '1', name: 'Walk', goalWeight: 'half' },
  { id: '2', name: 'Gym', goalWeight: 'full' },
];

const empty: DailyLog = {
  date: '2026-06-10',
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

describe('day status for calendar', () => {
  it('diet none when no entries', () => {
    expect(getDietDayStatus(empty, 2000)).toBe('none');
  });

  it('diet good when within target', () => {
    expect(getDietDayStatus({ ...empty, calories: 2000, calorieEntries: [2000] }, 2000)).toBe('good');
  });

  it('exercise none when day fully skipped', () => {
    expect(getExerciseDayStatus(empty, activities)).toBe('none');
  });

  it('exercise bad when day logged but no exercise', () => {
    expect(
      getExerciseDayStatus({ ...empty, calories: 1800, calorieEntries: [1800] }, activities),
    ).toBe('bad');
  });

  it('exercise good on full day', () => {
    expect(
      getExerciseDayStatus({ ...empty, exerciseActivityIds: ['2'] }, activities),
    ).toBe('good');
  });

  it('exercise good on rest day', () => {
    expect(getExerciseDayStatus({ ...empty, isRestDay: true }, activities)).toBe('good');
  });

  it('exercise yellow on partial', () => {
    expect(
      getExerciseDayStatus({ ...empty, exerciseActivityIds: ['1'] }, activities),
    ).toBe('yellow');
  });

  it('destress purple when done', () => {
    expect(getDestressDayStatus({ ...empty, destressDone: true })).toBe('good');
    expect(getDestressDayStatus(empty)).toBe('none');
  });

  it('fat red when over, green when ok', () => {
    expect(getFatDayStatus({ ...empty, fatOverGoal: true })).toBe('bad');
    expect(getFatDayStatus({ ...empty, calories: 100, calorieEntries: [100] })).toBe('good');
  });

  it('sugar red when over', () => {
    expect(getSugarDayStatus({ ...empty, sugarOverGoal: true })).toBe('bad');
  });
});
