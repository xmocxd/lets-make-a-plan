import type { ReactNode } from 'react';

type ToggleVariant = 'default' | 'good' | 'warning' | 'danger';

interface ToggleButtonProps {
  pressed: boolean;
  onPress: () => void;
  children: ReactNode;
  /** Visual style when pressed */
  pressedVariant?: ToggleVariant;
  iconOn?: string;
  iconOff?: string;
  className?: string;
  'aria-label'?: string;
}

export function ToggleButton({
  pressed,
  onPress,
  children,
  pressedVariant = 'good',
  iconOn = '✓',
  iconOff = '○',
  className = '',
  'aria-label': ariaLabel,
}: ToggleButtonProps) {
  return (
    <button
      type="button"
      className={`toggle-btn ${pressed ? `on ${pressedVariant}` : 'off'} ${className}`}
      onClick={onPress}
      aria-pressed={pressed}
      aria-label={ariaLabel}
    >
      <span className="toggle-icon" aria-hidden>
        {pressed ? iconOn : iconOff}
      </span>
      <span className="toggle-label">{children}</span>
    </button>
  );
}
