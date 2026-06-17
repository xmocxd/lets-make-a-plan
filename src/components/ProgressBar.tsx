interface ProgressBarProps {
  label: string;
  value: number;
  max?: number;
  goalMet?: boolean;
  unit?: string;
}

export function ProgressBar({
  label,
  value,
  max = 100,
  goalMet,
  unit = '%',
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="progress-block">
      <div className="progress-header">
        <span>{label}</span>
        <span className={goalMet === true ? 'good' : goalMet === false ? 'bad' : ''}>
          {value.toFixed(0)}
          {unit}
        </span>
      </div>
      <div className="progress-track">
        <div
          className={`progress-fill ${goalMet ? 'good' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function StatusDot({ status }: { status: 'good' | 'yellow' | 'bad' | 'none' }) {
  return <span className={`status-dot ${status}`} aria-label={status} />;
}
