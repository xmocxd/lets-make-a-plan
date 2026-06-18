import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
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
import { formatDate, getMonthKey, getMonthsBack, getWeekDates, parseDate } from '../lib/dates';
import { getMonthCombinedScore, getMonthWeekBreakdown } from '../lib/scoring';
import { scoreBackgroundStyle, scoreGradeClass } from '../lib/scoring/colors';
import { MonthCalendar } from '../components/MonthCalendar';

export function ReportDetailPage() {
  const { plan } = usePlan();
  const [range, setRange] = useState<3 | 6 | 12>(6);
  const [viewMonth, setViewMonth] = useState(getMonthKey(formatDate()));

  const chartData = useMemo(() => {
    if (!plan) return [];
    const months = getMonthsBack(range);
    return months.map((month) => {
      const { score } = getMonthCombinedScore(plan, month);
      return {
        month,
        label: month.slice(5),
        combined: Math.round(score),
      };
    });
  }, [plan, range]);

  if (!plan) return null;

  return (
    <div className="page">
      <Link to="/report" className="btn-text back">
        ← Report
      </Link>
      <h1>Charts & calendar</h1>

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
        <h2>Score trend</h2>
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
            <Line type="monotone" dataKey="combined" stroke="#a855f7" name="Week avg score" />
          </LineChart>
        </ResponsiveContainer>
      </section>
    </div>
  );
}

export function ReportPage() {
  const { plan } = usePlan();
  const [monthKey, setMonthKey] = useState(getMonthKey(formatDate()));

  if (!plan) return null;

  const weeks = getMonthWeekBreakdown(plan, monthKey);
  const monthScore = getMonthCombinedScore(plan, monthKey);
  const monthStyle = scoreBackgroundStyle(monthScore.score);
  const last6Months = getMonthsBack(6).map((month) => ({
    month,
    ...getMonthCombinedScore(plan, month),
  }));

  return (
    <div className="page">
      <div className="page-header-row">
        <h1>Report</h1>
        <Link to="/report/detail" className="btn-text header-link">
          Charts & calendar →
        </Link>
      </div>

      <section className="card">
        <label className="month-picker-row">
          Month{' '}
          <input
            type="month"
            value={monthKey}
            onChange={(e) => setMonthKey(e.target.value)}
          />
        </label>

        <div
          className={`score-summary-box ${scoreGradeClass(monthScore.score)}`}
          style={monthStyle}
        >
          <span className="score-summary-label">Month score</span>
          <span className="score-summary-value">
            {Math.round(monthScore.score)} ({monthScore.grade})
          </span>
        </div>

        <h2 className="report-section-title">Weekly breakdown</h2>
        <ul className="week-score-list">
          {weeks.map((week) => {
            const style = scoreBackgroundStyle(week.score);
            const dates = getWeekDates(week.weekStart);
            const label = `${parseDate(dates[0]).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${parseDate(dates[6]).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
            return (
              <li
                key={week.weekStart}
                className={`week-score-item ${scoreGradeClass(week.score)}`}
                style={style}
              >
                <span>{label}</span>
                <span>
                  {Math.round(week.score)} ({week.grade})
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="card">
        <h2>Last 6 months</h2>
        <div className="month-score-grid">
          {last6Months.map(({ month, score, grade }) => {
            const style = scoreBackgroundStyle(score);
            return (
              <div
                key={month}
                className={`month-score-cell ${scoreGradeClass(score)}`}
                style={style}
                title={month}
              >
                <span className="month-score-month">{month.slice(5)}/{month.slice(2, 4)}</span>
                <span className="month-score-num">{Math.round(score)}</span>
                <span className="month-score-grade">{grade}</span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
