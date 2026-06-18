import { useMemo } from 'react';
import type { PlanData } from '../types/plan';
import { formatDate, parseDate } from '../lib/dates';
import {
  getCombinedWeekScore,
  getProjectedWeekScore,
  getWeekSummary,
  isWeekComplete,
} from '../lib/scoring';
import { DayStatusIcons } from './DayStatusIcons';
import { WeekPlanRow } from './WeekPlanRow';

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAYS_IN_WEEK = 7;

interface WeekProgressChartProps {
  plan: PlanData;
  referenceDate: string;
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

function StackedRing({
  label,
  scoreLabel,
  segments,
}: {
  label: string;
  scoreLabel: string;
  segments: { value: number; color: string }[];
}) {
  let cursor = 0;
  const stops: string[] = [];
  for (const seg of segments) {
    if (seg.value <= 0) continue;
    const start = (cursor / DAYS_IN_WEEK) * 360;
    cursor += seg.value;
    const end = (cursor / DAYS_IN_WEEK) * 360;
    stops.push(`${seg.color} ${start}deg ${end}deg`);
  }
  if (cursor < DAYS_IN_WEEK) {
    stops.push(`var(--surface2) ${(cursor / DAYS_IN_WEEK) * 360}deg 360deg`);
  }
  const background = stops.length > 0 ? `conic-gradient(${stops.join(', ')})` : 'var(--surface2)';

  return (
    <div className="stacked-ring-metric">
      <div className="stacked-ring" style={{ background }} aria-hidden>
        <div className="stacked-ring-inner">
          <span className="stacked-ring-score">{scoreLabel}</span>
        </div>
      </div>
      <span className="stacked-ring-label">{label}</span>
    </div>
  );
}

function CalmRing({ value, total, label }: { value: number; total: number; label: string }) {
  const filled = total > 0 ? Math.min(1, value / total) : 0;
  const filledDeg = filled * 360;
  const background =
    filledDeg > 0
      ? `conic-gradient(#a855f7 0deg ${filledDeg}deg, color-mix(in srgb, #a855f7 22%, var(--surface2)) ${filledDeg}deg 360deg)`
      : 'color-mix(in srgb, #a855f7 22%, var(--surface2))';

  return (
    <div className="stacked-ring-metric calm">
      <div className="stacked-ring" style={{ background }} aria-hidden>
        <div className="stacked-ring-inner">
          <span className="stacked-ring-score">
            {value}/{total}
          </span>
        </div>
      </div>
      <span className="stacked-ring-label">{label}</span>
    </div>
  );
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
  referenceDate,
  selectedDate,
  onSelectDate,
}: WeekProgressChartProps) {
  const today = formatDate();

  const summary = useMemo(
    () =>
      getWeekSummary(
        plan.dailyLogs,
        referenceDate,
        plan.exerciseActivities,
        plan.settings,
        today,
      ),
    [plan, referenceDate, today],
  );

  const complete = useMemo(
    () => isWeekComplete(plan.dailyLogs, referenceDate),
    [plan.dailyLogs, referenceDate],
  );

  const score = useMemo(() => {
    if (complete) {
      return getCombinedWeekScore(
        plan.dailyLogs,
        referenceDate,
        plan.exerciseActivities,
        plan.settings,
      );
    }
    return getProjectedWeekScore(
      plan.dailyLogs,
      referenceDate,
      plan.exerciseActivities,
      plan.settings,
      today,
    );
  }, [plan, referenceDate, today, complete]);

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
                  <DayStatusIcons plan={plan} date={date} />
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
                <DayStatusIcons plan={plan} date={date} />
              </button>
            );
          })}
        </div>

        <WeekPlanRow plan={plan} dates={summary.dates} />
      </div>
    </section>
  );
}
