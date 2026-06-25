import { Link } from 'react-router-dom';
import type { DayPlan, ExerciseActivity } from '../types/plan';
import { WEEKDAY_LABELS } from '../lib/constants';
import { parseDate } from '../lib/dates';
import { DayQuickToggles, ExerciseToggleList } from './DayToggles';

interface PlanDayBlockProps {
  date: string;
  dayIndex: number;
  entry: DayPlan;
  activities: ExerciseActivity[];
  isToday: boolean;
  onUpdate: (patch: Partial<DayPlan>) => void;
}

/** One day row on the Plan page. */
export function PlanDayBlock({
  date,
  dayIndex,
  entry,
  activities,
  isToday,
  onUpdate,
}: PlanDayBlockProps) {
  const dayNum = parseDate(date).getDate();

  const toggleActivity = (id: string) => {
    const ids = entry.exerciseActivityIds.includes(id)
      ? entry.exerciseActivityIds.filter((x) => x !== id)
      : [...entry.exerciseActivityIds, id];
    onUpdate({ exerciseActivityIds: ids, isRestDay: false });
  };

  return (
    <div className={`plan-day-block${isToday ? ' today' : ''}`}>
      <div className="plan-day-header">
        <span className="plan-day-title">
          {WEEKDAY_LABELS[dayIndex]} {dayNum}
          {isToday ? ' · Today' : ''}
        </span>
        <DayQuickToggles
          cheat={entry.isCheatDay}
          calm={entry.destressPlanned}
          rest={entry.isRestDay}
          onCheat={() => onUpdate({ isCheatDay: !entry.isCheatDay })}
          onCalm={() => onUpdate({ destressPlanned: !entry.destressPlanned })}
          onRest={() =>
            onUpdate({
              isRestDay: !entry.isRestDay,
              exerciseActivityIds: entry.isRestDay ? entry.exerciseActivityIds : [],
            })
          }
        />
      </div>
      {!entry.isRestDay && (
        <ExerciseToggleList
          activities={activities}
          selectedIds={entry.exerciseActivityIds}
          onToggle={toggleActivity}
          emptyHint={
            <>
              <Link to="/activities">Add activities</Link> to plan exercise.
            </>
          }
        />
      )}
    </div>
  );
}
