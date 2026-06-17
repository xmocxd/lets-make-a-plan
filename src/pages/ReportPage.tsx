import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { usePlan } from '../context/PlanContext';
import { formatDate, getMonthKey, getMonthsBack } from '../lib/dates';
import { getMonthlyTrend } from '../lib/scoring';
import { ProgressBar } from '../components/ProgressBar';
import { MonthCalendar } from '../components/MonthCalendar';

export function ReportPage() {
  const { plan, report } = usePlan();
  const [range, setRange] = useState<3 | 6 | 12>(6);
  const [viewMonth, setViewMonth] = useState(getMonthKey(formatDate()));

  const chartData = useMemo(() => {
    if (!plan) return [];
    const months = getMonthsBack(range);
    return getMonthlyTrend(plan, months).map((d) => ({
      ...d,
      label: d.month.slice(5),
    }));
  }, [plan, range]);

  if (!plan || !report) return null;

  return (
    <div className="page">
      <h1>Report card</h1>

      <section className="card">
        <h2>Month calendar</h2>
        <label className="month-picker-row">
          Month{' '}
          <input
            type="month"
            value={viewMonth}
            onChange={(e) => setViewMonth(e.target.value)}
          />
        </label>
        <MonthCalendar plan={plan} monthKey={viewMonth} />
      </section>

      <section className="card">
        <h2>Goals vs scores</h2>
        <ProgressBar
          label="Diet (month)"
          value={report.dietCalories.month.score}
          goalMet={report.dietCalories.month.goalMet}
        />
        {(plan.settings.fatTrackingEnabled || plan.settings.sugarTrackingEnabled) && (
          <ProgressBar
            label="Fat/sugar over days"
            value={report.fatSugar.overPct}
            max={100}
            goalMet={report.fatSugar.goalMet}
            unit={`% (goal <${plan.settings.fatSugarExceedPctMax}%)`}
          />
        )}
        <ProgressBar
          label="Exercise (month)"
          value={report.exercise.month.score}
          goalMet={report.exercise.month.goalMet}
        />
        <ProgressBar
          label="De-stress (month)"
          value={report.destress.month.score}
          goalMet={report.destress.month.goalMet}
        />
      </section>

      <section className="card">
        <div className="range-tabs">
          {([3, 6, 12] as const).map((r) => (
            <button
              key={r}
              type="button"
              className={range === r ? 'tab active' : 'tab'}
              onClick={() => setRange(r)}
            >
              {r} mo
            </button>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="diet" stroke="#22c55e" name="Diet" />
            <Line type="monotone" dataKey="exercise" stroke="#3b82f6" name="Exercise" />
            <Line type="monotone" dataKey="destress" stroke="#a855f7" name="De-stress" />
          </LineChart>
        </ResponsiveContainer>
      </section>
    </div>
  );
}
