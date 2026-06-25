import type { ReactNode } from 'react';
import type { ExerciseActivity } from '../types/plan';
import { ToggleButton } from './ToggleButton';

interface DayQuickTogglesProps {
  cheat: boolean;
  calm: boolean;
  rest: boolean;
  onCheat: () => void;
  onCalm: () => void;
  onRest: () => void;
}

/** Cheat / Calm / Rest toggles used on both Log and Plan screens. */
export function DayQuickToggles({
  cheat,
  calm,
  rest,
  onCheat,
  onCalm,
  onRest,
}: DayQuickTogglesProps) {
  return (
    <div className="plan-day-quick">
      <ToggleButton
        pressed={cheat}
        onPress={onCheat}
        pressedVariant="warning"
        iconOn="★"
        iconOff="○"
        className="compact-toggle"
      >
        Cheat
      </ToggleButton>
      <ToggleButton
        pressed={calm}
        onPress={onCalm}
        pressedVariant="good"
        iconOn="✓"
        iconOff="○"
        className="compact-toggle"
      >
        Calm
      </ToggleButton>
      <ToggleButton
        pressed={rest}
        onPress={onRest}
        pressedVariant="warning"
        iconOn="😴"
        iconOff="○"
        className="compact-toggle"
      >
        Rest
      </ToggleButton>
    </div>
  );
}

interface ExerciseToggleListProps {
  activities: ExerciseActivity[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  emptyHint?: ReactNode;
  showWeight?: boolean;
}

/** List of exercise activity toggle buttons. */
export function ExerciseToggleList({
  activities,
  selectedIds,
  onToggle,
  emptyHint,
  showWeight = false,
}: ExerciseToggleListProps) {
  if (activities.length === 0) {
    return emptyHint ? <p className="hint">{emptyHint}</p> : null;
  }

  return (
    <div className="toggle-row">
      {activities.map((a) => (
        <ToggleButton
          key={a.id}
          pressed={selectedIds.includes(a.id)}
          onPress={() => onToggle(a.id)}
          pressedVariant="good"
          iconOn="✓"
          iconOff="○"
        >
          {a.name}
          {showWeight && (
            <span className="muted-inline">
              {' '}
              ({a.goalWeight === 'full' ? 'full' : '½'})
            </span>
          )}
        </ToggleButton>
      ))}
    </div>
  );
}
