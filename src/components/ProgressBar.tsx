interface ProgressBarProps {
  label: string;
  value: number;
  max?: number;
  goalMet?: boolean;
  unit?: string;
  displayValue?: string;
  fillClass?: 'good' | 'destress' | string;
  fillGradeClass?: string;
}

export function ProgressBar({
  label,
  value,
  max = 100,
  goalMet,
  unit = '%',
  displayValue,
  fillClass,
  fillGradeClass,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const valueClass =
    fillClass === 'destress'
      ? goalMet
        ? 'destress'
        : ''
      : goalMet === true
        ? 'good'
        : goalMet === false
          ? 'bad'
          : '';
  const fillVariant = fillGradeClass ?? fillClass ?? (goalMet ? 'good' : '');

  return (
    <div className="progress-block">
      <div className="progress-header">
        <span>{label}</span>
        <span className={valueClass}>
          {displayValue ?? `${value.toFixed(0)}${unit}`}
        </span>
      </div>
      <div className="progress-track">
        <div
          className={`progress-fill ${fillVariant}`.trim()}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function StatusDot({ status }: { status: 'good' | 'yellow' | 'bad' | 'none' }) {
  return <span className={`status-dot ${status}`} aria-label={status} />;
}
