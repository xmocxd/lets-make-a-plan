import { useMemo } from 'react';
import type { PlanData } from '../types/plan';
import { WEEKDAY_LABELS } from '../lib/constants';
import { formatDate, parseDate } from '../lib/dates';
import {
  getCombinedWeekScore,
  getProjectedWeekScore,
  getWeekSummary,
  isWeekComplete,
} from '../lib/scoring';
import { CalmRing, StackedRing } from './WeekMetricRings';
import { DayStatusIcons } from './DayStatusIcons';
import { WeekPlanRow } from './WeekPlanRow';

interface WeekProgressChartProps {
  plan: PlanData;
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

function formatWeekRange(dates: string[]): string {
  const start = parseDate(dates[0]);
  const end = parseDate(dates[6]);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const startStr = start.toLocaleDateString(undefined, opts);
  const endStr = end.toLocaleDateString(undefined, {
    ...opts,
    year: start.getFullYear() !== end.getFullYear() ? 'numeric' : undefined,
  });
  return `${startStr} – ${endStr}`;
}

export function WeekProgressChart({
  plan,
  selectedDate,
  onSelectDate,
}: WeekProgressChartProps) {
  const today = formatDate();

  const summary = useMemo(
    () =>
      getWeekSummary(
        plan.dailyLogs,
        today,
        plan.exerciseActivities,
        plan.settings,
        today,
      ),
    [plan, today],
  );

  const complete = useMemo(
    () => isWeekComplete(plan.dailyLogs, today, today),
    [plan.dailyLogs, today],
  );

  const score = useMemo(() => {
    if (complete) {
      return getCombinedWeekScore(
        plan.dailyLogs,
        today,
        plan.exerciseActivities,
        plan.settings,
      );
    }
    return getProjectedWeekScore(
      plan.dailyLogs,
      today,
      plan.exerciseActivities,
      plan.settings,
      today,
    );
  }, [plan, today, complete]);

  const dietScoreLabel = `${summary.diet.good}/${summary.diet.yellow}/${summary.diet.bad}`;
  const exerciseScoreLabel = `${summary.exercise.full}/${summary.exercise.partial}/${summary.exercise.none}`;
  const restGoalMet = summary.restDaysUsed >= summary.restDaysAllowed;

  return (
    <section className="card week-progress week-progress-flush">
      <div className="week-progress-header week-progress-pad">
        <h2>Week</h2>
        <span className="week-range">{formatWeekRange(summary.dates)}</span>
      </div>

      <div className={`week-score-projected week-progress-pad grade-${score.grade.toLowerCase()}`}>
        <p className="week-score-main">
          <span className="week-score-prefix">Score: </span>
          <span className="week-score-grade">{score.grade}</span>
          <span className="week-score-value"> ({Math.round(score.score)})</span>
        </p>
        {complete ? (
          <span className="week-score-tag final">✓ Final</span>
        ) : (
          <span className="week-score-tag">Projected</span>
        )}
      </div>

      <div className="week-metrics-row week-progress-pad">
        <StackedRing
          label="Calories"
          scoreLabel={dietScoreLabel}
          segments={[
            { value: summary.diet.good, color: 'var(--good)' },
            { value: summary.diet.yellow, color: 'var(--yellow)' },
            { value: summary.diet.bad, color: 'var(--bad)' },
          ]}
        />
        <StackedRing
          label="Exercise"
          scoreLabel={exerciseScoreLabel}
          segments={[
            { value: summary.exercise.full, color: 'var(--good)' },
            { value: summary.exercise.partial, color: 'var(--yellow)' },
            { value: summary.exercise.none, color: 'var(--bad)' },
          ]}
        />
        <CalmRing value={summary.calmDays} total={summary.calmGoal} label="Calm" />
      </div>

      <div className={`week-rest-status week-progress-pad${restGoalMet ? ' met' : ''}`}>
        <span>Rest Day(s) Taken</span>
        <span className="week-rest-icon" aria-label={restGoalMet ? 'Goal met' : 'Goal not met'}>
          {restGoalMet ? '✓' : '✗'}
        </span>
      </div>

      <div className="week-rows-block">
        <div className="week-row-label week-progress-pad">Log</div>
        <div className="week-days-grid">
          {summary.dates.map((date, i) => {
            const dayNum = parseDate(date).getDate();
            const isSelected = date === selectedDate;
            const isToday = date === today;
            const isFuture = date > today;
            const className = `week-day-cell${isSelected ? ' selected' : ''}${isToday ? ' today' : ''}${isFuture ? ' future' : ''}`;

            if (isFuture) {
              return (
                <div key={date} className={className} title={date} aria-disabled>
                  <span className="week-day-label">{WEEKDAY_LABELS[i]}</span>
                  <span className="week-day-num">{dayNum}</span>
                  <DayStatusIcons plan={plan} date={date} asOfDate={today} />
                </div>
              );
            }

            return (
              <button
                key={date}
                type="button"
                className={className}
                title={date}
                onClick={() => onSelectDate(date)}
              >
                <span className="week-day-label">{WEEKDAY_LABELS[i]}</span>
                <span className="week-day-num">{dayNum}</span>
                <DayStatusIcons plan={plan} date={date} asOfDate={today} />
              </button>
            );
          })}
        </div>

        <WeekPlanRow plan={plan} dates={summary.dates} />
      </div>
    </section>
  );
}
