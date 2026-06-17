import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePlan } from '../context/PlanContext';
import { getCalorieStatus, isExerciseDayGood } from '../lib/scoring';
import { formatDate } from '../lib/dates';
import { getCalorieTotal, normalizeDailyCalories, sumCalorieEntries } from '../lib/diet/calories';
import { CalorieRing } from '../components/CalorieRing';
import { ToggleButton } from '../components/ToggleButton';
import { ProgressBar } from '../components/ProgressBar';
import type { Mantra } from '../types/plan';

function pickMantra(mantras: Mantra[]): Mantra | null {
  if (!mantras.length) return null;
  const sorted = [...mantras].sort((a, b) => {
    const ta = a.lastShownAt ? new Date(a.lastShownAt).getTime() : 0;
    const tb = b.lastShownAt ? new Date(b.lastShownAt).getTime() : 0;
    return ta - tb;
  });
  return sorted[0];
}

export function HomePage() {
  const { plan, report, getTodayLog, upsertDailyLog, setPlan } = usePlan();
  const navigate = useNavigate();
  const [entryInput, setEntryInput] = useState('');

  const today = formatDate();
  const rawLog = getTodayLog();
  const log = normalizeDailyCalories(rawLog);

  const mantra = useMemo(() => {
    if (!plan) return null;
    return pickMantra(plan.mantras);
  }, [plan]);

  if (!plan || !report) return null;

  const target = plan.settings.calorieTarget;
  const total = getCalorieTotal(log);
  const entries = log.calorieEntries ?? [];
  const calStatus = getCalorieStatus(total, target, plan.settings.dietCalorieExceedPctMax);
  const exGood = isExerciseDayGood(log, plan.exerciseActivities);

  const handleMantraClick = async () => {
    if (!mantra) return;
    const mantras = plan.mantras.map((m) =>
      m.id === mantra.id ? { ...m, lastShownAt: new Date().toISOString() } : m,
    );
    await setPlan({ ...plan, mantras });
    navigate('/mantras');
  };

  const saveEntries = (next: number[]) => {
    upsertDailyLog(today, {
      calorieEntries: next,
      calories: sumCalorieEntries(next),
    });
  };

  const addEntry = () => {
    const value = Number(entryInput);
    if (!value || value <= 0) return;
    saveEntries([...entries, value]);
    setEntryInput('');
  };

  const addQuickCalories = (value: number) => {
    saveEntries([...entries, value]);
  };

  const toggleActivity = (id: string) => {
    const ids = log.exerciseActivityIds.includes(id)
      ? log.exerciseActivityIds.filter((x) => x !== id)
      : [...log.exerciseActivityIds, id];
    upsertDailyLog(today, { exerciseActivityIds: ids, isRestDay: false });
  };

  const exerciseStatus = log.isRestDay ? 'warning' : exGood ? 'good' : 'default';

  return (
    <div className="page">
      {mantra && (
        <button type="button" className="mantra-banner" onClick={handleMantraClick}>
          "{mantra.text}"
        </button>
      )}

      <div className="page-header-row">
        <div>
          <h1>Today</h1>
          <p className="subtitle">{today}</p>
        </div>
        <Link to="/activities" className="btn-text header-link">
          Activities →
        </Link>
      </div>

      <section className="card today-unified">
        <div className="today-status-strip">
          <span className={`status-pill ${calStatus}`}>
            {total} kcal
          </span>
          <span className={`status-pill ${exerciseStatus}`}>
            {log.isRestDay ? 'Rest' : exGood ? 'Exercise ✓' : 'Exercise'}
          </span>
        </div>

        <div className="calorie-row">
          <CalorieRing
            total={total}
            target={target}
            exceedPctMax={plan.settings.dietCalorieExceedPctMax}
          />
          <div className="calorie-side">
            <div className="add-row calorie-add-row compact">
              <input
                type="number"
                inputMode="numeric"
                placeholder="Add kcal"
                className="input-lg compact-input"
                value={entryInput}
                onChange={(e) => setEntryInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addEntry()}
              />
              <button type="button" className="btn primary calorie-add-btn" onClick={addEntry}>
                +
              </button>
            </div>
            <div className="calorie-quick-row">
              <button
                type="button"
                className="btn secondary calorie-quick-btn"
                onClick={() => addQuickCalories(target)}
              >
                Calories OK
              </button>
              <button
                type="button"
                className="btn secondary calorie-quick-btn danger"
                onClick={() => addQuickCalories(9999)}
              >
                Calories Over
              </button>
            </div>
            {entries.length > 0 && (
              <ul className="calorie-entry-list compact">
                {entries.map((amount, index) => (
                  <li key={`${index}-${amount}`} className="calorie-entry-item">
                    <span>{amount}</span>
                    <button
                      type="button"
                      className="btn-text small"
                      onClick={() => saveEntries(entries.filter((_, i) => i !== index))}
                      aria-label={`Remove ${amount}`}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="toggle-row">
          <ToggleButton
            pressed={log.isCheatDay}
            onPress={() => upsertDailyLog(today, { isCheatDay: !log.isCheatDay })}
            pressedVariant="warning"
            iconOn="★"
            iconOff="○"
          >
            Cheat day
          </ToggleButton>

          {plan.settings.fatTrackingEnabled && (
            <ToggleButton
              pressed={log.fatOverGoal}
              onPress={() => upsertDailyLog(today, { fatOverGoal: !log.fatOverGoal })}
              pressedVariant="danger"
              iconOn="!"
              iconOff="○"
            >
              Fat over
            </ToggleButton>
          )}

          {plan.settings.sugarTrackingEnabled && (
            <ToggleButton
              pressed={log.sugarOverGoal}
              onPress={() => upsertDailyLog(today, { sugarOverGoal: !log.sugarOverGoal })}
              pressedVariant="danger"
              iconOn="!"
              iconOff="○"
            >
              Sugar over
            </ToggleButton>
          )}

        </div>

        <hr className="section-divider" />

        <div className="exercise-today">
          <div className="section-label-row">
            <h2>Exercise</h2>
            <ToggleButton
              pressed={log.isRestDay}
              onPress={() =>
                upsertDailyLog(today, {
                  isRestDay: !log.isRestDay,
                  exerciseActivityIds: log.isRestDay ? log.exerciseActivityIds : [],
                })
              }
              pressedVariant="warning"
              iconOn="😴"
              iconOff="○"
              className="compact-toggle"
            >
              Rest day
            </ToggleButton>
          </div>

          {!log.isRestDay && (
            <div className="toggle-row">
              {plan.exerciseActivities.length === 0 ? (
                <p className="hint">
                  <Link to="/activities">Add activities</Link> to log exercise.
                </p>
              ) : (
                plan.exerciseActivities.map((a) => (
                  <ToggleButton
                    key={a.id}
                    pressed={log.exerciseActivityIds.includes(a.id)}
                    onPress={() => toggleActivity(a.id)}
                    pressedVariant="good"
                    iconOn="✓"
                    iconOff="○"
                  >
                    {a.name}
                    <span className="muted-inline">
                      {' '}
                      ({a.goalWeight === 'full' ? 'full' : '½'})
                    </span>
                  </ToggleButton>
                ))
              )}
            </div>
          )}
        </div>
      </section>

      <section className="card progress-compact">
        <h2>Progress</h2>
        <ProgressBar
          label="Diet · week"
          value={report.dietCalories.week.score}
          goalMet={report.dietCalories.week.goalMet}
        />
        <ProgressBar
          label="Exercise · week"
          value={report.exercise.week.score}
          goalMet={report.exercise.week.goalMet}
        />
        <ProgressBar
          label="Diet · month"
          value={report.dietCalories.month.score}
          goalMet={report.dietCalories.month.goalMet}
        />
        <ProgressBar
          label="Exercise · month"
          value={report.exercise.month.score}
          goalMet={report.exercise.month.goalMet}
        />
      </section>
    </div>
  );
}
