import { useCallback, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { usePlan } from '../context/PlanContext';
import { formatDate } from '../lib/dates';
import { shuffleArray } from '../lib/shuffle';
import { ToggleButton } from '../components/ToggleButton';
import { ProgressBar } from '../components/ProgressBar';
import { DestressSuggestionScroller } from '../components/DestressSuggestionScroller';

export function DestressPage() {
  const { plan, report, getTodayLog, upsertDailyLog } = usePlan();
  const location = useLocation();
  const [shuffleKey, setShuffleKey] = useState(0);

  const displayItems = useMemo(() => {
    if (!plan) return [];
    return shuffleArray(plan.destressSuggestions);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- reshuffle on navigate / Shuffle tap
  }, [plan, location.key, shuffleKey]);

  const shuffle = useCallback(() => {
    setShuffleKey((k) => k + 1);
  }, []);

  if (!plan) return null;

  const today = formatDate();
  const log = getTodayLog();
  const weekGoal = plan.settings.destressPerWeekGoal;
  const weekCount = report?.destress.week.count ?? 0;
  const weekGoalMet = report?.destress.week.goalMet ?? false;

  return (
    <div className="page">
      <h1>Calm</h1>

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

      <section className="card destress-ideas-card">
        <div className="section-header-row">
          <h2>De-stress Ideas</h2>
          <Link to="/destress/list" className="btn-text header-link">
            Edit list
          </Link>
        </div>
        <DestressSuggestionScroller
          key={displayItems.map((i) => i.id).join(',')}
          items={displayItems}
        />
        {displayItems.length > 1 && (
          <button type="button" className="btn secondary destress-shuffle-btn" onClick={shuffle}>
            Shuffle
          </button>
        )}
      </section>
    </div>
  );
}
