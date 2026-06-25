/** Short labels for Mon–Sun columns in week grids. */
export const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

export const DAYS_IN_WEEK = 7;

/** How much each area counts toward the combined week score. */
export const WEEK_SCORE_WEIGHTS = {
  diet: 0.5,
  exercise: 0.48,
  calm: 0.02,
} as const;
