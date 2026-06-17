import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePlan } from '../context/PlanContext';
import { formatDate } from '../lib/dates';
import { ToggleButton } from '../components/ToggleButton';
import { ProgressBar } from '../components/ProgressBar';
import type { DestressSuggestion } from '../types/plan';

function pickSuggestion(items: DestressSuggestion[]): DestressSuggestion | null {
  if (!items.length) return null;
  const unseen = items.filter((i) => !i.lastShownAt);
  const pool = unseen.length ? unseen : items;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function DestressPage() {
  const { plan, report, getTodayLog, upsertDailyLog, setPlan } = usePlan();
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
  const weekGoal = plan.settings.destressPerWeekGoal;
  const weekCount = report?.destress.week.count ?? 0;
  const weekGoalMet = report?.destress.week.goalMet ?? false;

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

  return (
    <div className="page">
      <h1>Calm</h1>
      <p className="subtitle">De-stress · {weekGoal}× per week goal</p>

      <section className="card">
        <ProgressBar
          label="This week"
          value={weekCount}
          max={weekGoal}
          goalMet={weekGoalMet}
          displayValue={`${weekCount}/${weekGoal} Done`}
          fillClass="destress"
          unit=""
        />
      </section>

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
        <div className="section-header-row">
          <h2>Suggestion</h2>
          <Link to="/destress/list" className="btn-text header-link">
            Your list
          </Link>
        </div>
        {suggestion && <p className="suggestion-text">{suggestion.text}</p>}
        <button type="button" className="btn secondary" onClick={shuffle}>
          Shuffle idea
        </button>
      </section>
    </div>
  );
}
