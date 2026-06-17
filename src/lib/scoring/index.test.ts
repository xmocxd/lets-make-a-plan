import { describe, it, expect } from 'vitest';
import {
  getCalorieStatus,
  scoreDietWeek,
  scoreExerciseWeek,
  isExerciseDayGood,
} from '../scoring';
import type { DailyLog, ExerciseActivity, Settings } from '../../types/plan';

const settings: Settings = {
  calorieTarget: 2000,
  fatGoal: 65,
  sugarGoal: 50,
  fatTrackingEnabled: false,
  sugarTrackingEnabled: false,
  cheatDaysPerWeek: 1,
  fatSugarCheatDaysPerMonth: 1,
  dietCalorieExceedPctMax: 10,
  fatSugarExceedPctMax: 20,
  restDaysPerWeek: 1,
  exerciseMonthGoalPct: 90,
  destressPerWeekGoal: 3,
  autoBackupEnabled: true,
  driveBackupEnabled: true,
};

const activities: ExerciseActivity[] = [
  { id: '1', name: 'Walk', goalWeight: 'half' },
  { id: '2', name: 'Gym', goalWeight: 'full' },
];

describe('scoring', () => {
  it('classifies calorie status', () => {
    expect(getCalorieStatus(2000, 2000)).toBe('good');
    expect(getCalorieStatus(2100, 2000)).toBe('good');
    expect(getCalorieStatus(2500, 2000)).toBe('yellow');
    expect(getCalorieStatus(3200, 2000)).toBe('bad');
  });

  it('exercise half + half = full day', () => {
    const log: DailyLog = {
      date: '2026-06-16',
      calories: 0,
      fat: 0,
      sugar: 0,
      isCheatDay: false,
      fatOverGoal: false,
      sugarOverGoal: false,
      fatSugarCheat: false,
      destressDone: false,
      isRestDay: false,
      exerciseActivityIds: ['1', '1'],
    };
    expect(isExerciseDayGood(log, activities)).toBe(true);
  });

  it('scores exercise week with rest day', () => {
    const weekStart = '2026-06-15';
    const logs: DailyLog[] = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(2026, 5, 15 + i);
      logs.push({
        date: d.toISOString().slice(0, 10),
        calories: 0,
        fat: 0,
        sugar: 0,
        isCheatDay: false,
        fatOverGoal: false,
        sugarOverGoal: false,
        fatSugarCheat: false,
        destressDone: false,
        isRestDay: false,
        exerciseActivityIds: ['2'],
      });
    }
    logs.push({
      date: '2026-06-21',
      calories: 0,
      fat: 0,
      sugar: 0,
      isCheatDay: false,
      fatOverGoal: false,
      sugarOverGoal: false,
      fatSugarCheat: false,
      destressDone: false,
      isRestDay: true,
      exerciseActivityIds: [],
    });
    const score = scoreExerciseWeek(logs, weekStart, activities, settings);
    expect(score.goalMet).toBe(true);
    expect(score.score).toBe(100);
  });

  it('scores diet week', () => {
    const weekStart = '2026-06-15';
    const logs: DailyLog[] = [
      {
        date: '2026-06-15',
        calories: 2000,
        fat: 0,
        sugar: 0,
        isCheatDay: false,
        fatOverGoal: false,
        sugarOverGoal: false,
        fatSugarCheat: false,
        destressDone: false,
        isRestDay: false,
        exerciseActivityIds: [],
      },
    ];
    const score = scoreDietWeek(logs, weekStart, settings);
    expect(score.good).toBeGreaterThanOrEqual(1);
  });
});
