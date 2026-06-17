import { useState } from 'react';
import { v4 as uuid } from 'uuid';
import { useNavigate } from 'react-router-dom';
import { usePlan } from '../context/PlanContext';

export function MantrasPage() {
  const { plan, setPlan } = usePlan();
  const navigate = useNavigate();
  const [text, setText] = useState('');

  if (!plan) return null;

  const add = async () => {
    if (!text.trim()) return;
    await setPlan({
      ...plan,
      mantras: [...plan.mantras, { id: uuid(), text: text.trim(), isDefault: false }],
    });
    setText('');
  };

  const remove = async (id: string) => {
    await setPlan({
      ...plan,
      mantras: plan.mantras.filter((m) => m.id !== id),
    });
  };

  return (
    <div className="page">
      <button type="button" className="btn-text back" onClick={() => navigate('/')}>
        ← Back
      </button>
      <h1>Mantras</h1>
      <ul className="mantra-list">
        {plan.mantras.map((m) => (
          <li key={m.id}>
            <span>{m.text}</span>
            {!m.isDefault && (
              <button type="button" className="btn-text" onClick={() => remove(m.id)}>
                Remove
              </button>
            )}
          </li>
        ))}
      </ul>
      <div className="add-row">
        <input
          placeholder="New mantra"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="button" className="btn secondary" onClick={add}>
          Add
        </button>
      </div>
    </div>
  );
}
