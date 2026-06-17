import { getCalorieStatus } from '../lib/scoring';

interface CalorieRingProps {
  total: number;
  target: number;
}

const SIZE = 140;
const STROKE = 10;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;

export function CalorieRing({ total, target }: CalorieRingProps) {
  const status = getCalorieStatus(total, target);
  const pct = target > 0 ? (total / target) * 100 : 0;
  const ringPct = Math.min(pct, 100);
  const offset = C - (ringPct / 100) * C;

  const strokeColor =
    status === 'good'
      ? 'var(--good)'
      : status === 'yellow'
        ? 'var(--yellow)'
        : status === 'bad'
          ? 'var(--bad)'
          : 'var(--muted)';

  const textColor =
    status === 'none' ? 'var(--muted)' : strokeColor;

  return (
    <div className="calorie-ring" role="img" aria-label={`${total} of ${target} calories, ${pct.toFixed(0)} percent`}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke="var(--surface2)"
          strokeWidth={STROKE}
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke={strokeColor}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          className="calorie-ring-progress"
        />
      </svg>
      <div className="calorie-ring-center">
        <span className="calorie-ring-total" style={{ color: textColor }}>
          {total}
        </span>
        <span className="calorie-ring-label">kcal</span>
        <span className="calorie-ring-pct" style={{ color: textColor }}>
          {total > 0 ? `${pct.toFixed(0)}%` : '—'}
        </span>
        <span className="calorie-ring-goal">of {target}</span>
      </div>
    </div>
  );
}
