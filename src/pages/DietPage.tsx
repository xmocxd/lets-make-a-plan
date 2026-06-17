import { usePlan } from '../context/PlanContext';
import { formatDate } from '../lib/dates';
import { getCalorieStatus } from '../lib/scoring';
import { StatusDot } from '../components/ProgressBar';

export function DietPage() {
  const { plan, getTodayLog, upsertDailyLog } = usePlan();
  if (!plan) return null;

  const today = formatDate();
  const log = getTodayLog();
  const status = getCalorieStatus(log.calories, plan.settings.calorieTarget);

  return (
    <div className="page">
      <h1>Diet</h1>
      <section className="card">
        <div className="field-row">
          <label htmlFor="calories">Calories today</label>
          <StatusDot status={status} />
        </div>
        <input
          id="calories"
          type="number"
          inputMode="numeric"
          className="input-lg"
          value={log.calories || ''}
          onChange={(e) =>
            upsertDailyLog(today, { calories: Number(e.target.value) || 0 })
          }
        />
        <p className="hint">
          Target: {plan.settings.calorieTarget} kcal · Green ≤105% · Yellow ≤150%
        </p>

        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={log.isCheatDay}
            onChange={(e) => upsertDailyLog(today, { isCheatDay: e.target.checked })}
          />
          Cheat day (max {plan.settings.cheatDaysPerWeek}/week)
        </label>
      </section>

      {plan.settings.fatTrackingEnabled && (
        <section className="card">
          <h2>Fat</h2>
          <input
            type="number"
            className="input-lg"
            placeholder="Fat (g)"
            value={log.fat || ''}
            onChange={(e) => upsertDailyLog(today, { fat: Number(e.target.value) || 0 })}
          />
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={log.fatOverGoal}
              onChange={(e) => upsertDailyLog(today, { fatOverGoal: e.target.checked })}
            />
            Exceeded fat goal ({plan.settings.fatGoal}g)
          </label>
        </section>
      )}

      {plan.settings.sugarTrackingEnabled && (
        <section className="card">
          <h2>Sugar</h2>
          <input
            type="number"
            className="input-lg"
            placeholder="Sugar (g)"
            value={log.sugar || ''}
            onChange={(e) => upsertDailyLog(today, { sugar: Number(e.target.value) || 0 })}
          />
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={log.sugarOverGoal}
              onChange={(e) => upsertDailyLog(today, { sugarOverGoal: e.target.checked })}
            />
            Exceeded sugar goal ({plan.settings.sugarGoal}g)
          </label>
        </section>
      )}

      {(plan.settings.fatTrackingEnabled || plan.settings.sugarTrackingEnabled) && (
        <section className="card">
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={log.fatSugarCheat}
              onChange={(e) => upsertDailyLog(today, { fatSugarCheat: e.target.checked })}
            />
            Fat/sugar cheat day (max {plan.settings.fatSugarCheatDaysPerMonth}/month)
          </label>
        </section>
      )}
    </div>
  );
}
