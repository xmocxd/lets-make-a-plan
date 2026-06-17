import { useState } from 'react';
import { Link } from 'react-router-dom';
import { v4 as uuid } from 'uuid';
import { usePlan } from '../context/PlanContext';
import type { GoalWeight } from '../types/plan';

export function ActivitiesPage() {
  const { plan, setPlan } = usePlan();
  const [newName, setNewName] = useState('');
  const [newWeight, setNewWeight] = useState<GoalWeight>('half');

  if (!plan) return null;

  const addActivity = async () => {
    if (!newName.trim()) return;
    await setPlan({
      ...plan,
      exerciseActivities: [
        ...plan.exerciseActivities,
        { id: uuid(), name: newName.trim(), goalWeight: newWeight },
      ],
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
      <Link to="/" className="btn-text back">
        ← Today
      </Link>
      <h1>Activities</h1>
      <p className="subtitle">Exercise catalog — half or full day credit</p>

      <section className="card">
        {plan.exerciseActivities.length === 0 ? (
          <p className="hint">No activities yet. Add your first below.</p>
        ) : (
          plan.exerciseActivities.map((a) => (
            <div key={a.id} className="list-row">
              <span>
                {a.name}
                <span className="muted-inline">
                  {' '}
                  — {a.goalWeight === 'full' ? 'Full day' : 'Half day'}
                </span>
              </span>
              <button type="button" className="btn-text" onClick={() => removeActivity(a.id)}>
                Remove
              </button>
            </div>
          ))
        )}
        <div className="add-row">
          <input
            placeholder="New activity"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addActivity()}
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
