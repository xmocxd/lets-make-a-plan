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
  const exceedPct = 10;

  it('diet none when no entries at all', () => {
    expect(getDietDayStatus(empty, 2000, exceedPct)).toBe('none');
  });

  it('diet unset when day logged but no calories', () => {
    expect(
      getDietDayStatus({ ...empty, exerciseActivityIds: ['2'] }, 2000, exceedPct),
    ).toBe('unset');
  });

  it('diet good when within target', () => {
    expect(getDietDayStatus({ ...empty, calories: 2000, calorieEntries: [2000] }, 2000, exceedPct)).toBe('good');
  });

  it('diet yellow when slightly over target', () => {
    expect(getDietDayStatus({ ...empty, calories: 2100, calorieEntries: [2100] }, 2000, exceedPct)).toBe('yellow');
  });

  it('diet bad when over exceed limit', () => {
    expect(getDietDayStatus({ ...empty, calories: 2300, calorieEntries: [2300] }, 2000, exceedPct)).toBe('bad');
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

  it('fat only when over', () => {
    expect(getFatDayStatus({ ...empty, fatOverGoal: true })).toBe('bad');
    expect(getFatDayStatus({ ...empty, calories: 100, calorieEntries: [100] })).toBe('none');
  });

  it('sugar only when over', () => {
    expect(getSugarDayStatus({ ...empty, sugarOverGoal: true })).toBe('bad');
    expect(getSugarDayStatus(empty)).toBe('none');
  });
});
