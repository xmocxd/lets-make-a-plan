import type { DailyLog, DayPlan, ExerciseActivity, GoalWeight, PlanData, Settings } from '../types/plan';
import { WEEK_SCORE_WEIGHTS } from './constants';
import { emptyDayPlan } from './defaults';
import { getMondayWeekStart, getWeekDates } from './dates';
import { scoreCalmComponentWeek, scoreExerciseComponentWeek } from './scoring';

const EXERCISE_CALM_WEIGHT = WEEK_SCORE_WEIGHTS.exercise + WEEK_SCORE_WEIGHTS.calm;

export function getDayPlan(plans: DayPlan[], date: string): DayPlan {
  return plans.find((p) => p.date === date) ?? emptyDayPlan(date);
}

export function dayPlanToLog(plan: DayPlan): DailyLog {
  return {
    date: plan.date,
    calories: 0,
    calorieEntries: [],
    fat: 0,
    sugar: 0,
    isCheatDay: plan.isCheatDay,
    fatOverGoal: false,
    sugarOverGoal: false,
    destressDone: plan.destressPlanned,
    isRestDay: plan.isRestDay,
    exerciseActivityIds: plan.exerciseActivityIds,
  };
}

export function plansToLogs(plans: DayPlan[], dates: string[]): DailyLog[] {
  return dates.map((date) => dayPlanToLog(getDayPlan(plans, date)));
}

export function scorePlannedWeekExerciseCalm(
  plans: DayPlan[],
  referenceDate: string,
  activities: ExerciseActivity[],
  settings: Settings,
): number {
  const weekStart = getMondayWeekStart(referenceDate);
  const dates = getWeekDates(weekStart);
  const logs = plansToLogs(plans, dates);
  const exercise = scoreExerciseComponentWeek(logs, weekStart, activities, settings);
  const calm = scoreCalmComponentWeek(logs, weekStart, settings);
  const weighted = exercise * WEEK_SCORE_WEIGHTS.exercise + calm * WEEK_SCORE_WEIGHTS.calm;
  if (EXERCISE_CALM_WEIGHT <= 0) return 0;
  return Math.max(0, Math.min(100, weighted / EXERCISE_CALM_WEIGHT));
}

export function getWeekDayPlans(plan: PlanData, referenceDate: string): DayPlan[] {
  const dates = getWeekDates(getMondayWeekStart(referenceDate));
  return dates.map((date) => getDayPlan(plan.weekDayPlans, date));
}

export interface PlanDayLabel {
  id: string;
  text: string;
  kind: 'exercise' | 'calm' | 'cheat' | 'rest';
  exerciseWeight?: GoalWeight;
}

export function getPlanLabelsForDate(
  plan: PlanData,
  date: string,
): PlanDayLabel[] {
  const day = getDayPlan(plan.weekDayPlans, date);
  const labels: PlanDayLabel[] = [];

  if (day.isCheatDay) {
    labels.push({ id: `${date}-cheat`, text: 'Cheat', kind: 'cheat' });
  }
  if (day.isRestDay) {
    labels.push({ id: `${date}-rest`, text: 'Rest', kind: 'rest' });
  }
  if (day.destressPlanned) {
    labels.push({ id: `${date}-calm`, text: 'Calm', kind: 'calm' });
  }
  for (const activityId of day.exerciseActivityIds) {
    const activity = plan.exerciseActivities.find((a) => a.id === activityId);
    if (activity) {
      labels.push({
        id: `${date}-ex-${activityId}`,
        text: activity.name,
        kind: 'exercise',
        exerciseWeight: activity.goalWeight,
      });
    }
  }
  return labels;
}
