import { useState } from 'react';
import { v4 as uuid } from 'uuid';
import { usePlan } from '../context/PlanContext';
import { formatDate } from '../lib/dates';
import { isExerciseDayGood } from '../lib/scoring';
import type { GoalWeight } from '../types/plan';

export function ExercisePage() {
  const { plan, getTodayLog, upsertDailyLog, setPlan } = usePlan();
  const [newName, setNewName] = useState('');
  const [newWeight, setNewWeight] = useState<GoalWeight>('half');

  if (!plan) return null;

  const today = formatDate();
  const log = getTodayLog();
  const good = isExerciseDayGood(log, plan.exerciseActivities);

  const toggleActivity = (id: string) => {
    const ids = log.exerciseActivityIds.includes(id)
      ? log.exerciseActivityIds.filter((x) => x !== id)
      : [...log.exerciseActivityIds, id];
    upsertDailyLog(today, { exerciseActivityIds: ids, isRestDay: false });
  };

  const addActivity = async () => {
    if (!newName.trim()) return;
    const activity = { id: uuid(), name: newName.trim(), goalWeight: newWeight };
    await setPlan({
      ...plan,
      exerciseActivities: [...plan.exerciseActivities, activity],
    });
    setNewName('');
  };

  const removeActivity = async (id: string) => {
    await setPlan({
      ...plan,
      exerciseActivities: plan.exerciseActivities.filter((a) => a.id !== id),
    });
  };

  return (
    <div className="page">
      <h1>Exercise</h1>

      <section className="card">
        <div className="today-row">
          <span>Today</span>
          <span className={`badge ${log.isRestDay ? 'yellow' : good ? 'good' : 'none'}`}>
            {log.isRestDay ? 'Rest day' : good ? 'Full day goal met' : 'Add activities'}
          </span>
        </div>

        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={log.isRestDay}
            onChange={(e) =>
              upsertDailyLog(today, {
                isRestDay: e.target.checked,
                exerciseActivityIds: e.target.checked ? [] : log.exerciseActivityIds,
              })
            }
          />
          Rest day ({plan.settings.restDaysPerWeek}/week recommended)
        </label>

        {!log.isRestDay &&
          plan.exerciseActivities.map((a) => (
            <label key={a.id} className="checkbox-row pill">
              <input
                type="checkbox"
                checked={log.exerciseActivityIds.includes(a.id)}
                onChange={() => toggleActivity(a.id)}
              />
              {a.name} ({a.goalWeight === 'full' ? 'full' : '½'} day)
            </label>
          ))}
      </section>

      <section className="card">
        <h2>Activity catalog</h2>
        {plan.exerciseActivities.map((a) => (
          <div key={a.id} className="list-row">
            <span>
              {a.name} — {a.goalWeight === 'full' ? 'Full day' : 'Half day'}
            </span>
            <button type="button" className="btn-text" onClick={() => removeActivity(a.id)}>
              Remove
            </button>
          </div>
        ))}
        <div className="add-row">
          <input
            placeholder="New activity"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <select value={newWeight} onChange={(e) => setNewWeight(e.target.value as GoalWeight)}>
            <option value="half">Half day</option>
            <option value="full">Full day</option>
          </select>
          <button type="button" className="btn secondary" onClick={addActivity}>
            Add
          </button>
        </div>
      </section>
    </div>
  );
}
