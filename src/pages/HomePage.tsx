import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePlan } from '../context/PlanContext';
import { getCalorieStatus, getLogForDate, isExerciseDayGood } from '../lib/scoring';
import { addDays, formatDate, parseDate } from '../lib/dates';
import { getCalorieTotal, normalizeDailyCalories, sumCalorieEntries } from '../lib/diet/calories';
import { CalorieRing } from '../components/CalorieRing';
import { ExerciseToggleList } from '../components/DayToggles';
import { ToggleButton } from '../components/ToggleButton';
import { WeekProgressChart } from '../components/WeekProgressChart';
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

function formatDisplayDate(dateStr: string): string {
  return parseDate(dateStr).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function HomePage() {
  const { plan, getTodayLog, upsertDailyLog, setPlan } = usePlan();
  const navigate = useNavigate();
  const [entryInput, setEntryInput] = useState('');

  const today = formatDate();
  const [selectedDate, setSelectedDate] = useState(today);

  const rawLog = useMemo(() => {
    if (!plan) return getTodayLog();
    return getLogForDate(plan.dailyLogs, selectedDate);
  }, [plan, selectedDate, getTodayLog]);

  const log = normalizeDailyCalories(rawLog);

  const mantra = useMemo(() => {
    if (!plan) return null;
    return pickMantra(plan.mantras);
  }, [plan]);

  if (!plan) return null;

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
    upsertDailyLog(selectedDate, {
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
    upsertDailyLog(selectedDate, { exerciseActivityIds: ids, isRestDay: false });
  };

  const exerciseStatus = log.isRestDay ? 'warning' : exGood ? 'good' : 'default';
  const isToday = selectedDate === today;

  return (
    <div className="page">
      {mantra && (
        <button type="button" className="mantra-banner" onClick={handleMantraClick}>
          "{mantra.text}"
        </button>
      )}

      <div className="page-header-row">
        <div>
          <h1>Log</h1>
          <div className="day-nav">
            <button
              type="button"
              className="day-nav-btn"
              onClick={() => setSelectedDate(addDays(selectedDate, -1))}
              aria-label="Previous day"
            >
              ←
            </button>
            <p className="subtitle">
              {isToday ? 'Today' : formatDisplayDate(selectedDate)}
              {!isToday && <span className="day-nav-date">{selectedDate}</span>}
            </p>
            <button
              type="button"
              className="day-nav-btn"
              disabled={isToday}
              onClick={() => {
                const next = addDays(selectedDate, 1);
                if (next <= today) setSelectedDate(next);
              }}
              aria-label="Next day"
            >
              →
            </button>
          </div>
        </div>
      </div>

      <section className="card today-unified">
        <div className="today-status-strip">
          <span className={`status-pill ${calStatus}`}>
            {total} kcal
          </span>
          <span className={`status-pill ${exerciseStatus}`}>
            {log.isRestDay ? 'Rest' : exGood ? 'Exercise ✓' : 'Exercise'}
          </span>
          {log.destressDone && (
            <span className="status-pill good">Calm ✓</span>
          )}
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
            onPress={() => upsertDailyLog(selectedDate, { isCheatDay: !log.isCheatDay })}
            pressedVariant="warning"
            iconOn="★"
            iconOff="○"
          >
            Cheat day
          </ToggleButton>

          {plan.settings.fatTrackingEnabled && (
            <ToggleButton
              pressed={log.fatOverGoal}
              onPress={() => upsertDailyLog(selectedDate, { fatOverGoal: !log.fatOverGoal })}
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
              onPress={() => upsertDailyLog(selectedDate, { sugarOverGoal: !log.sugarOverGoal })}
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
            <h2 className="section-title-with-action">
              Exercise
              <Link to="/activities" className="section-title-icon" aria-label="Edit activities">
                ✏️
              </Link>
            </h2>
            <ToggleButton
              pressed={log.isRestDay}
              onPress={() =>
                upsertDailyLog(selectedDate, {
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
            <ExerciseToggleList
              activities={plan.exerciseActivities}
              selectedIds={log.exerciseActivityIds}
              onToggle={toggleActivity}
              showWeight
              emptyHint="Add activities to log exercise."
            />
          )}
        </div>

        <hr className="section-divider" />

        <div className="calm-today">
          <h2>Calm</h2>
          <ToggleButton
            pressed={log.destressDone}
            onPress={() => upsertDailyLog(selectedDate, { destressDone: !log.destressDone })}
            pressedVariant="good"
            iconOn="✓"
            iconOff="○"
          >
            De-stress
          </ToggleButton>
        </div>
      </section>

      <WeekProgressChart
        plan={plan}
        selectedDate={selectedDate}
        onSelectDate={(date) => {
          if (date <= today) setSelectedDate(date);
        }}
      />
    </div>
  );
}
