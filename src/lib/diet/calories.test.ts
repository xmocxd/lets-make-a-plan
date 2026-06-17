import { describe, it, expect } from 'vitest';
import { sumCalorieEntries, normalizeDailyCalories } from './calories';
import type { DailyLog } from '../../types/plan';

const base: DailyLog = {
  date: '2026-06-16',
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

describe('calorie entries', () => {
  it('sums entries', () => {
    expect(sumCalorieEntries([200, 350, 150])).toBe(700);
  });

  it('migrates legacy calories to single entry', () => {
    const normalized = normalizeDailyCalories({ ...base, calories: 1800 });
    expect(normalized.calorieEntries).toEqual([1800]);
    expect(normalized.calories).toBe(1800);
  });
});
