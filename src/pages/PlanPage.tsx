import { useMemo } from 'react';
import { usePlan } from '../context/PlanContext';
import { formatDate, getMondayWeekStart, getWeekDates, parseDate } from '../lib/dates';
import { scoreGradeClass } from '../lib/scoring/colors';
import { scorePlannedWeekExerciseCalm } from '../lib/weekPlan';
import { ToggleButton } from '../components/ToggleButton';
import { ProgressBar } from '../components/ProgressBar';

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function PlanPage() {
  const { plan, upsertDayPlan } = usePlan();
  const today = formatDate();

  const weekStart = useMemo(() => getMondayWeekStart(today), [today]);
  const dates = useMemo(() => getWeekDates(weekStart), [weekStart]);

  if (!plan) return null;

  const plannedScore = scorePlannedWeekExerciseCalm(
    plan.weekDayPlans,
    today,
    plan.exerciseActivities,
    plan.settings,
  );
  const gradeClass = scoreGradeClass(plannedScore);

  const toggleActivity = (date: string, id: string, currentIds: string[]) => {
    const ids = currentIds.includes(id)
      ? currentIds.filter((x) => x !== id)
      : [...currentIds, id];
    upsertDayPlan(date, { exerciseActivityIds: ids, isRestDay: false });
  };

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
            {dates.map((date, i) => {
              const entry = plan.weekDayPlans.find((p) => p.date === date) ?? {
                date,
                exerciseActivityIds: [],
                isRestDay: false,
                isCheatDay: false,
                destressPlanned: false,
              };
              const dayNum = parseDate(date).getDate();
              const isToday = date === today;
              return (
                <div key={date} className={`plan-day-block${isToday ? ' today' : ''}`}>
                  <div className="plan-day-header">
                    <span className="plan-day-title">
                      {WEEKDAY_LABELS[i]} {dayNum}
                      {isToday ? ' · Today' : ''}
                    </span>
                    <div className="plan-day-quick">
                      <ToggleButton
                        pressed={entry.isCheatDay}
                        onPress={() =>
                          upsertDayPlan(date, { isCheatDay: !entry.isCheatDay })
                        }
                        pressedVariant="warning"
                        iconOn="★"
                        iconOff="○"
                        className="compact-toggle"
                      >
                        Cheat
                      </ToggleButton>
                      <ToggleButton
                        pressed={entry.destressPlanned}
                        onPress={() =>
                          upsertDayPlan(date, {
                            destressPlanned: !entry.destressPlanned,
                          })
                        }
                        pressedVariant="good"
                        iconOn="✓"
                        iconOff="○"
                        className="compact-toggle"
                      >
                        Calm
                      </ToggleButton>
                      <ToggleButton
                        pressed={entry.isRestDay}
                        onPress={() =>
                          upsertDayPlan(date, {
                            isRestDay: !entry.isRestDay,
                            exerciseActivityIds: entry.isRestDay
                              ? entry.exerciseActivityIds
                              : [],
                          })
                        }
                        pressedVariant="warning"
                        iconOn="😴"
                        iconOff="○"
                        className="compact-toggle"
                      >
                        Rest
                      </ToggleButton>
                    </div>
                  </div>
                  {!entry.isRestDay && (
                    <div className="toggle-row">
                      {plan.exerciseActivities.length === 0 ? (
                        <p className="hint">Add exercise activities on the Log screen.</p>
                      ) : (
                        plan.exerciseActivities.map((a) => (
                          <ToggleButton
                            key={a.id}
                            pressed={entry.exerciseActivityIds.includes(a.id)}
                            onPress={() =>
                              toggleActivity(date, a.id, entry.exerciseActivityIds)
                            }
                            pressedVariant="good"
                            iconOn="✓"
                            iconOff="○"
                          >
                            {a.name}
                          </ToggleButton>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
