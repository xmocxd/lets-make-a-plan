import { useState } from 'react';
import type { PlanData } from '../types/plan';
import { parseDate } from '../lib/dates';
import { getPlanLabelsForDate } from '../lib/weekPlan';
import { LabelModal } from './LabelModal';

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface WeekPlanRowProps {
  plan: PlanData;
  dates: string[];
}

function truncate(text: string, max = 9): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

export function WeekPlanRow({ plan, dates }: WeekPlanRowProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <>
      <div className="week-row-label week-progress-pad">Plan</div>
      <div className="week-days-grid week-days-grid-plan">
        {dates.map((date, i) => {
          const labels = getPlanLabelsForDate(plan, date);
          const dayNum = parseDate(date).getDate();
          return (
            <div key={date} className="week-day-cell plan" title={date}>
              <span className="week-day-label">{WEEKDAY_LABELS[i]}</span>
              <span className="week-day-num">{dayNum}</span>
              <div className="plan-labels">
                {labels.length === 0 ? (
                  <span className="plan-label empty">—</span>
                ) : (
                  labels.map((label) => (
                    <button
                      key={label.id}
                      type="button"
                      className={`plan-label ${label.kind}${label.exerciseWeight ? ` ${label.exerciseWeight}` : ''}`}
                      onClick={() => setExpanded(label.text)}
                      title={label.text}
                    >
                      {truncate(label.text)}
                    </button>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
      {expanded && <LabelModal text={expanded} onClose={() => setExpanded(null)} />}
    </>
  );
}
