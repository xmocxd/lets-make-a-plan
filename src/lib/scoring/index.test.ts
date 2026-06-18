import { describe, it, expect } from 'vitest';
import {
  getCalorieStatus,
  scoreDietWeek,
  scoreExerciseWeek,
  isExerciseDayGood,
  getCombinedWeekScore,
  getWeekSummary,
  getProjectedWeekScore,
  isWeekComplete,
  getLetterGrade,
} from '../scoring';
import { getMondayWeekStart } from '../dates';
import type { DailyLog, ExerciseActivity, Settings } from '../../types/plan';

const settings: Settings = {
  calorieTarget: 2000,
  fatGoal: 65,
  sugarGoal: 50,
  fatTrackingEnabled: false,
  sugarTrackingEnabled: false,
  cheatDaysPerWeek: 1,
  dietCalorieExceedPctMax: 10,
  fatSugarExceedPctMax: 20,
  restDaysPerWeek: 1,
  exerciseMonthGoalPct: 90,
  destressPerWeekGoal: 2,
  autoBackupEnabled: true,
  driveBackupEnabled: true,
};

const activities: ExerciseActivity[] = [
  { id: '1', name: 'Walk', goalWeight: 'half' },
  { id: '2', name: 'Gym', goalWeight: 'full' },
];

const emptyLog = (date: string, patch: Partial<DailyLog> = {}): DailyLog => ({
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
  ...patch,
});

describe('scoring', () => {
  it('classifies calorie status', () => {
    expect(getCalorieStatus(2000, 2000, 10)).toBe('good');
    expect(getCalorieStatus(2100, 2000, 10)).toBe('yellow');
    expect(getCalorieStatus(2200, 2000, 10)).toBe('yellow');
    expect(getCalorieStatus(2201, 2000, 10)).toBe('bad');
    expect(getCalorieStatus(3200, 2000, 10)).toBe('bad');
  });

  it('exercise half + half = full day', () => {
    const log = emptyLog('2026-06-16', { exerciseActivityIds: ['1', '1'] });
    expect(isExerciseDayGood(log, activities)).toBe(true);
  });

  it('scores exercise week with rest day', () => {
    const weekStart = '2026-06-15';
    const logs: DailyLog[] = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(2026, 5, 15 + i);
      logs.push(emptyLog(d.toISOString().slice(0, 10), { exerciseActivityIds: ['2'] }));
    }
    logs.push(emptyLog('2026-06-21', { isRestDay: true }));
    const score = scoreExerciseWeek(logs, weekStart, activities, settings);
    expect(score.goalMet).toBe(true);
    expect(score.score).toBe(100);
  });

  it('scores diet week', () => {
    const weekStart = '2026-06-15';
    const logs: DailyLog[] = [
      emptyLog('2026-06-15', { calories: 2000, calorieEntries: [2000] }),
    ];
    const score = scoreDietWeek(logs, weekStart, settings);
    expect(score.good).toBeGreaterThanOrEqual(1);
  });

  it('starts week on Monday', () => {
    expect(getMondayWeekStart('2026-06-17')).toBe('2026-06-15');
    expect(getMondayWeekStart('2026-06-21')).toBe('2026-06-15');
    expect(getMondayWeekStart('2026-06-15')).toBe('2026-06-15');
  });

  it('treats allowed cheat day as good for week summary', () => {
    const logs = [
      emptyLog('2026-06-15', { isCheatDay: true, calories: 9999, calorieEntries: [9999] }),
    ];
    const summary = getWeekSummary(logs, '2026-06-17', activities, settings, '2026-06-15');
    expect(summary.diet.good).toBe(1);
    expect(summary.diet.bad).toBe(0);
  });

  it('treats extra cheat days as bad', () => {
    const logs = [
      emptyLog('2026-06-15', { isCheatDay: true }),
      emptyLog('2026-06-16', { isCheatDay: true }),
    ];
    const summary = getWeekSummary(logs, '2026-06-17', activities, settings, '2026-06-16');
    expect(summary.diet.good).toBe(1);
    expect(summary.diet.bad).toBe(1);
  });

  it('does not count future exercise days as none', () => {
    const logs = [emptyLog('2026-06-15', { exerciseActivityIds: ['2'] })];
    const summary = getWeekSummary(logs, '2026-06-15', activities, settings, '2026-06-15');
    expect(summary.exercise.full).toBe(1);
    expect(summary.exercise.none).toBe(0);
  });

  it('counts past unlogged exercise days as none', () => {
    const logs = [emptyLog('2026-06-15', { exerciseActivityIds: ['2'] })];
    const summary = getWeekSummary(logs, '2026-06-17', activities, settings, '2026-06-22');
    expect(summary.exercise.none).toBe(6);
  });

  it('diet good ok over sums to logged elapsed days', () => {
    const logs = [
      emptyLog('2026-06-15', { calories: 2000, calorieEntries: [2000] }),
      emptyLog('2026-06-16', { calories: 2100, calorieEntries: [2100] }),
    ];
    const summary = getWeekSummary(logs, '2026-06-17', activities, settings, '2026-06-17');
    const total = summary.diet.good + summary.diet.yellow + summary.diet.bad;
    expect(total).toBe(2);
  });

  it('skips current day in week metrics until something is logged', () => {
    const logs = [
      emptyLog('2026-06-15', { calories: 2000, calorieEntries: [2000], exerciseActivityIds: ['2'] }),
      emptyLog('2026-06-16', { calories: 2000, calorieEntries: [2000], exerciseActivityIds: ['2'] }),
    ];
    const summary = getWeekSummary(logs, '2026-06-17', activities, settings, '2026-06-17');
    expect(summary.diet.bad).toBe(0);
    expect(summary.exercise.none).toBe(0);
    expect(summary.diet.good).toBe(2);
    expect(summary.exercise.full).toBe(2);
  });

  it('hides week grade until Sunday is logged', () => {
    const logs = [emptyLog('2026-06-15', { calories: 2000, calorieEntries: [2000] })];
    expect(isWeekComplete(logs, '2026-06-17')).toBe(false);
    logs.push(emptyLog('2026-06-21', { calories: 2000, calorieEntries: [2000] }));
    expect(isWeekComplete(logs, '2026-06-17')).toBe(true);
  });

  it('assigns letter grades', () => {
    expect(getLetterGrade(95)).toBe('A');
    expect(getLetterGrade(85)).toBe('B');
    expect(getLetterGrade(75)).toBe('C');
    expect(getLetterGrade(65)).toBe('D');
    expect(getLetterGrade(50)).toBe('F');
  });

  it('computes combined week score', () => {
    const logs: DailyLog[] = [];
    const weekDates = ['2026-06-15', '2026-06-16', '2026-06-17', '2026-06-18', '2026-06-19', '2026-06-20', '2026-06-21'];
    for (const date of weekDates) {
      logs.push(
        emptyLog(date, {
          calories: 2000,
          calorieEntries: [2000],
          exerciseActivityIds: date === '2026-06-21' ? [] : ['2'],
          isRestDay: date === '2026-06-21',
        }),
      );
    }
    const { score, grade } = getCombinedWeekScore(logs, '2026-06-17', activities, settings);
    expect(score).toBeGreaterThan(0);
    expect(grade).toBeTruthy();
  });

  it('projected score normalizes elapsed days', () => {
    const logs = [
      emptyLog('2026-06-15', {
        calories: 2000,
        calorieEntries: [2000],
        exerciseActivityIds: ['2'],
        destressDone: true,
      }),
    ];
    const projected = getProjectedWeekScore(logs, '2026-06-15', activities, settings, '2026-06-15');
    expect(projected.score).toBeGreaterThan(50);
  });

  it('excludes current day from projected score until something is logged', () => {
    const weekStart = '2026-06-15';
    const today = '2026-06-17';
    const logs = [
      emptyLog('2026-06-15', {
        calories: 2000,
        calorieEntries: [2000],
        exerciseActivityIds: ['2'],
      }),
      emptyLog('2026-06-16', {
        calories: 2000,
        calorieEntries: [2000],
        exerciseActivityIds: ['2'],
      }),
    ];

    const withoutToday = getProjectedWeekScore(logs, weekStart, activities, settings, today);
    const throughYesterday = getProjectedWeekScore(
      logs,
      weekStart,
      activities,
      settings,
      '2026-06-16',
    );
    expect(withoutToday).toEqual(throughYesterday);

    expect(getProjectedWeekScore([], weekStart, activities, settings, weekStart)).toEqual({
      score: 0,
      grade: 'F',
    });

    logs.push(
      emptyLog(today, {
        calories: 5000,
        calorieEntries: [5000],
        exerciseActivityIds: ['2'],
      }),
    );
    const withBadToday = getProjectedWeekScore(logs, weekStart, activities, settings, today);
    expect(withBadToday.score).toBeLessThan(withoutToday.score);
  });

  it('partial exercise scores higher than no exercise', () => {
    const weekStart = '2026-06-15';
    const partialLogs = [
      emptyLog('2026-06-15', { exerciseActivityIds: ['1'] }),
      emptyLog('2026-06-16', { exerciseActivityIds: ['1'] }),
      emptyLog('2026-06-17', { exerciseActivityIds: ['1'] }),
      emptyLog('2026-06-18', { exerciseActivityIds: ['1'] }),
      emptyLog('2026-06-19', { exerciseActivityIds: ['1'] }),
      emptyLog('2026-06-20', { exerciseActivityIds: ['1'] }),
      emptyLog('2026-06-21', { isRestDay: true }),
    ];
    const noneLogs = [
      emptyLog('2026-06-15', { calories: 100, calorieEntries: [100] }),
      emptyLog('2026-06-16', { calories: 100, calorieEntries: [100] }),
      emptyLog('2026-06-17', { calories: 100, calorieEntries: [100] }),
      emptyLog('2026-06-18', { calories: 100, calorieEntries: [100] }),
      emptyLog('2026-06-19', { calories: 100, calorieEntries: [100] }),
      emptyLog('2026-06-20', { calories: 100, calorieEntries: [100] }),
      emptyLog('2026-06-21', { isRestDay: true }),
    ];
    const partialScore = scoreExerciseWeek(partialLogs, weekStart, activities, settings);
    const noneScore = scoreExerciseWeek(noneLogs, weekStart, activities, settings);
    expect(partialScore.score).toBeGreaterThan(noneScore.score);
  });
});
