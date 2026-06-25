import type { PlanData } from '../../types/plan';
import { formatDate, getMondayWeekStart, getMonthKey } from '../dates';
import { scoreDestressMonth, scoreDestressWeek } from './calm';
import { scoreDietMonth, scoreDietWeek, scoreFatSugarMonth, type WeekDietScore } from './diet';
import { scoreExerciseMonth, scoreExerciseWeek, type WeekExerciseScore } from './exercise';

export type { WeekDietScore, WeekExerciseScore };

export interface ReportCardScores {
  dietCalories: { week: WeekDietScore; month: ReturnType<typeof scoreDietMonth> };
  fatSugar: ReturnType<typeof scoreFatSugarMonth>;
  exercise: { week: WeekExerciseScore; month: ReturnType<typeof scoreExerciseMonth> };
  destress: { week: ReturnType<typeof scoreDestressWeek>; month: ReturnType<typeof scoreDestressMonth> };
}

export function getReportCard(
  plan: PlanData,
  date: string = formatDate(),
): ReportCardScores {
  const weekStart = getMondayWeekStart(date);
  const monthKey = getMonthKey(date);
  return {
    dietCalories: {
      week: scoreDietWeek(plan.dailyLogs, weekStart, plan.settings),
      month: scoreDietMonth(plan.dailyLogs, monthKey, plan.settings),
    },
    fatSugar: scoreFatSugarMonth(plan.dailyLogs, monthKey, plan.settings),
    exercise: {
      week: scoreExerciseWeek(
        plan.dailyLogs,
        weekStart,
        plan.exerciseActivities,
        plan.settings,
      ),
      month: scoreExerciseMonth(
        plan.dailyLogs,
        monthKey,
        plan.exerciseActivities,
        plan.settings,
      ),
    },
    destress: {
      week: scoreDestressWeek(plan.dailyLogs, weekStart, plan.settings),
      month: scoreDestressMonth(plan.dailyLogs, monthKey, plan.settings),
    },
  };
}

export function getMonthlyTrend(
  plan: PlanData,
  monthKeys: string[],
): {
  month: string;
  diet: number;
  exercise: number;
  destress: number;
}[] {
  return monthKeys.map((month) => ({
    month,
    diet: scoreDietMonth(plan.dailyLogs, month, plan.settings).score,
    exercise: scoreExerciseMonth(
      plan.dailyLogs,
      month,
      plan.exerciseActivities,
      plan.settings,
    ).score,
    destress: scoreDestressMonth(plan.dailyLogs, month, plan.settings).score,
  }));
}
