import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlan } from '../context/PlanContext';
import { getCalorieStatus, isExerciseDayGood } from '../lib/scoring';
import { formatDate } from '../lib/dates';
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
  const { plan, report, getTodayLog, setPlan } = usePlan();
  const navigate = useNavigate();
  const today = formatDate();
  const log = getTodayLog();

  const mantra = useMemo(() => {
    if (!plan) return null;
    return pickMantra(plan.mantras);
  }, [plan]);

  const handleMantraClick = async () => {
    if (!plan || !mantra) return;
    const mantras = plan.mantras.map((m) =>
      m.id === mantra.id ? { ...m, lastShownAt: new Date().toISOString() } : m,
    );
    await setPlan({ ...plan, mantras });
    navigate('/mantras');
  };

  if (!plan || !report) return null;

  const calStatus = getCalorieStatus(log.calories, plan.settings.calorieTarget);
  const exGood = isExerciseDayGood(log, plan.exerciseActivities);

  return (
    <div className="page">
      {mantra && (
        <button type="button" className="mantra-banner" onClick={handleMantraClick}>
          "{mantra.text}"
        </button>
      )}

      <h1>Today</h1>
      <p className="subtitle">{today}</p>

      <section className="card today-summary">
        <div className="today-row">
          <span>Diet</span>
          <span className={`badge ${calStatus}`}>
            {log.calories} / {plan.settings.calorieTarget} kcal
          </span>
        </div>
        <div className="today-row">
          <span>Exercise</span>
          <span className={`badge ${log.isRestDay ? 'yellow' : exGood ? 'good' : 'none'}`}>
            {log.isRestDay ? 'Rest day' : exGood ? 'Goal met' : 'In progress'}
          </span>
        </div>
        <div className="today-row">
          <span>De-stress</span>
          <span className={`badge ${log.destressDone ? 'good' : 'none'}`}>
            {log.destressDone ? 'Done' : 'Not yet'}
          </span>
        </div>
      </section>

      <section className="card">
        <h2>This week</h2>
        <ProgressBar
          label="Diet calories"
          value={report.dietCalories.week.score}
          goalMet={report.dietCalories.week.goalMet}
        />
        <ProgressBar
          label="Exercise"
          value={report.exercise.week.score}
          goalMet={report.exercise.week.goalMet}
        />
        <ProgressBar
          label="De-stress"
          value={report.destress.week.score}
          goalMet={report.destress.week.goalMet}
        />
      </section>

      <section className="card">
        <h2>This month</h2>
        <ProgressBar
          label="Diet"
          value={report.dietCalories.month.score}
          goalMet={report.dietCalories.month.goalMet}
        />
        <ProgressBar
          label="Exercise"
          value={report.exercise.month.score}
          goalMet={report.exercise.month.goalMet}
        />
        <ProgressBar
          label="De-stress"
          value={report.destress.month.score}
          goalMet={report.destress.month.goalMet}
        />
      </section>
    </div>
  );
}
