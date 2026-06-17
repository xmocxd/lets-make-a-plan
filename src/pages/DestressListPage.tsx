import { useState } from 'react';
import { Link } from 'react-router-dom';
import { v4 as uuid } from 'uuid';
import { usePlan } from '../context/PlanContext';

export function DestressListPage() {
  const { plan, setPlan } = usePlan();
  const [newText, setNewText] = useState('');

  if (!plan) return null;

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

  const removeSuggestion = async (id: string) => {
    await setPlan({
      ...plan,
      destressSuggestions: plan.destressSuggestions.filter((s) => s.id !== id),
    });
  };

  return (
    <div className="page">
      <Link to="/destress" className="btn-text back">
        ← Calm
      </Link>
      <h1>Your list</h1>
      <p className="subtitle">De-stress ideas for shuffle suggestions</p>

      <section className="card">
        {plan.destressSuggestions.length === 0 ? (
          <p className="hint">No ideas yet. Add your first below.</p>
        ) : (
          plan.destressSuggestions.map((s) => (
            <div key={s.id} className="list-row">
              <span>{s.text}</span>
              <button type="button" className="btn-text" onClick={() => removeSuggestion(s.id)}>
                Remove
              </button>
            </div>
          ))
        )}
        <div className="add-row">
          <input
            placeholder="Add activity"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addSuggestion()}
          />
          <button type="button" className="btn secondary" onClick={addSuggestion}>
            Add
          </button>
        </div>
      </section>
    </div>
  );
}
