import { DAYS_IN_WEEK } from '../lib/constants';

interface StackedRingProps {
  label: string;
  scoreLabel: string;
  segments: { value: number; color: string }[];
}

export function StackedRing({ label, scoreLabel, segments }: StackedRingProps) {
  let cursor = 0;
  const stops: string[] = [];
  for (const seg of segments) {
    if (seg.value <= 0) continue;
    const start = (cursor / DAYS_IN_WEEK) * 360;
    cursor += seg.value;
    const end = (cursor / DAYS_IN_WEEK) * 360;
    stops.push(`${seg.color} ${start}deg ${end}deg`);
  }
  if (cursor < DAYS_IN_WEEK) {
    stops.push(`var(--surface2) ${(cursor / DAYS_IN_WEEK) * 360}deg 360deg`);
  }
  const background = stops.length > 0 ? `conic-gradient(${stops.join(', ')})` : 'var(--surface2)';

  return (
    <div className="stacked-ring-metric">
      <div className="stacked-ring" style={{ background }} aria-hidden>
        <div className="stacked-ring-inner">
          <span className="stacked-ring-score">{scoreLabel}</span>
        </div>
      </div>
      <span className="stacked-ring-label">{label}</span>
    </div>
  );
}

interface CalmRingProps {
  value: number;
  total: number;
  label: string;
}

export function CalmRing({ value, total, label }: CalmRingProps) {
  const filled = total > 0 ? Math.min(1, value / total) : 0;
  const filledDeg = filled * 360;
  const background =
    filledDeg > 0
      ? `conic-gradient(#a855f7 0deg ${filledDeg}deg, color-mix(in srgb, #a855f7 22%, var(--surface2)) ${filledDeg}deg 360deg)`
      : 'color-mix(in srgb, #a855f7 22%, var(--surface2))';

  return (
    <div className="stacked-ring-metric calm">
      <div className="stacked-ring" style={{ background }} aria-hidden>
        <div className="stacked-ring-inner">
          <span className="stacked-ring-score">
            {value}/{total}
          </span>
        </div>
      </div>
      <span className="stacked-ring-label">{label}</span>
    </div>
  );
}
