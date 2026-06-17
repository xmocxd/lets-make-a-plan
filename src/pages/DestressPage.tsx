import { useEffect, useState } from 'react';
import { v4 as uuid } from 'uuid';
import { usePlan } from '../context/PlanContext';
import { formatDate } from '../lib/dates';
import { ToggleButton } from '../components/ToggleButton';
import type { DestressSuggestion } from '../types/plan';

function pickSuggestion(items: DestressSuggestion[]): DestressSuggestion | null {
  if (!items.length) return null;
  const unseen = items.filter((i) => !i.lastShownAt);
  const pool = unseen.length ? unseen : items;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function DestressPage() {
  const { plan, getTodayLog, upsertDailyLog, setPlan } = usePlan();
  const [newText, setNewText] = useState('');
  const [suggestion, setSuggestion] = useState<DestressSuggestion | null>(null);

  const items = plan?.destressSuggestions ?? [];

  useEffect(() => {
    if (items.length) {
      setSuggestion((prev) => prev ?? pickSuggestion(items));
    }
  }, [items]);

  if (!plan) return null;

  const today = formatDate();
  const log = getTodayLog();

  const shuffle = async () => {
    const pick = pickSuggestion(items);
    if (!pick) return;
    setSuggestion(pick);
    const updated = plan.destressSuggestions.map((s) =>
      s.id === pick.id ? { ...s, lastShownAt: new Date().toISOString() } : s,
    );
    const allShown = updated.every((s) => s.lastShownAt);
    if (allShown) {
      await setPlan({
        ...plan,
        destressSuggestions: updated.map((s) => ({ ...s, lastShownAt: undefined })),
      });
    } else {
      await setPlan({ ...plan, destressSuggestions: updated });
    }
  };

  const addSuggestion = async () => {
    if (!newText.trim()) return;
    await setPlan({
      ...plan,
      destressSuggestions: [
        ...plan.destressSuggestions,
        { id: uuid(), text: newText.trim() },
      ],
    });
    setNewText('');
  };

  return (
    <div className="page">
      <h1>Calm</h1>
      <p className="subtitle">De-stress · {plan.settings.destressPerWeekGoal}× per week goal</p>

      <section className="card">
        <ToggleButton
          pressed={log.destressDone}
          onPress={() => upsertDailyLog(today, { destressDone: !log.destressDone })}
          pressedVariant="good"
          iconOn="✓"
          iconOff="○"
          className="toggle-btn-block"
        >
          Done a de-stress activity today
        </ToggleButton>
      </section>

      <section className="card">
        <h2>Suggestion</h2>
        {suggestion && <p className="suggestion-text">{suggestion.text}</p>}
        <button type="button" className="btn secondary" onClick={shuffle}>
          Shuffle idea
        </button>
      </section>

      <section className="card">
        <h2>Your list</h2>
        <ul className="simple-list">
          {plan.destressSuggestions.map((s) => (
            <li key={s.id}>{s.text}</li>
          ))}
        </ul>
        <div className="add-row">
          <input
            placeholder="Add activity"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
          />
          <button type="button" className="btn secondary" onClick={addSuggestion}>
            Add
          </button>
        </div>
      </section>
    </div>
  );
}
