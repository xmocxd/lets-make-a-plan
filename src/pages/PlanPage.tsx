import { useMemo } from 'react';
import { usePlan } from '../context/PlanContext';
import { formatDate, getMondayWeekStart, getWeekDates } from '../lib/dates';
import { getDayPlan, scorePlannedWeekExerciseCalm } from '../lib/weekPlan';
import { scoreGradeClass } from '../lib/scoring/colors';
import { ProgressBar } from '../components/ProgressBar';
import { PlanDayBlock } from '../components/PlanDayBlock';

export function PlanPage() {
  const { plan, upsertDayPlan } = usePlan();
  const today = formatDate();

  const dates = useMemo(() => getWeekDates(getMondayWeekStart(today)), [today]);

  if (!plan) return null;

  const plannedScore = scorePlannedWeekExerciseCalm(
    plan.weekDayPlans,
    today,
    plan.exerciseActivities,
    plan.settings,
  );
  const gradeClass = scoreGradeClass(plannedScore);

  return (
    <div className="page plan-page">
      <h1>Plan</h1>
      <p className="subtitle plan-subtitle">Pre-plan exercise, calm, and cheat days</p>

      <section className="card plan-score-card">
        <div className={`plan-score-block ${gradeClass}`}>
          <div className="plan-score-header">
            <span className="plan-score-value">{Math.round(plannedScore)}</span>
            <span className="plan-score-sub">planned week score</span>
          </div>
          <ProgressBar
            label="Exercise + calm"
            value={plannedScore}
            displayValue={`${Math.round(plannedScore)}`}
            unit=""
            fillGradeClass={gradeClass}
          />
        </div>
      </section>

      <div className="plan-page-scroll">
        <section className="card plan-week-card">
          <h2>This week</h2>
          <div className="plan-days-list">
            {dates.map((date, i) => (
              <PlanDayBlock
                key={date}
                date={date}
                dayIndex={i}
                entry={getDayPlan(plan.weekDayPlans, date)}
                activities={plan.exerciseActivities}
                isToday={date === today}
                onUpdate={(patch) => upsertDayPlan(date, patch)}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
