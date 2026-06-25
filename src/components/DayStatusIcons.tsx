import type { PlanData } from '../types/plan';
import { formatDate } from '../lib/dates';
import {
  getDietDayStatus,
  getExerciseDayStatus,
  getDestressDayStatus,
  getFatDayStatus,
  getSugarDayStatus,
  getLogForDate,
  hasAnyDayEntry,
} from '../lib/scoring';

interface DayStatusIconsProps {
  plan: PlanData;
  date: string;
  asOfDate?: string;
}

export function DayStatusIcons({ plan, date, asOfDate = formatDate() }: DayStatusIconsProps) {
  const trackFat = plan.settings.fatTrackingEnabled;
  const trackSugar = plan.settings.sugarTrackingEnabled;
  const log = getLogForDate(plan.dailyLogs, date);
  const isFuture = date > asOfDate;
  const isTodayEmpty = date === asOfDate && !hasAnyDayEntry(log);
  const isPastEmpty = date < asOfDate && !hasAnyDayEntry(log);

  if (isFuture || isTodayEmpty) {
    return <div className="calendar-squares" />;
  }

  const diet = isPastEmpty
    ? 'bad'
    : getDietDayStatus(
        log,
        plan.settings.calorieTarget,
        plan.settings.dietCalorieExceedPctMax,
      );
  const fat = getFatDayStatus(log);
  const sugar = getSugarDayStatus(log);
  const exercise = isPastEmpty ? 'bad' : getExerciseDayStatus(log, plan.exerciseActivities);
  const destress = getDestressDayStatus(log);

  return (
    <div className="calendar-squares">
      {log.isCheatDay ? (
        <span className="cal-badge cheat" title="Cheat day" aria-label="Cheat day">
          cheat
        </span>
      ) : (
        <>
          {diet !== 'unset' && diet !== 'none' && (
            <span
              className={`cal-square diet ${diet}`}
              title={`Diet: ${diet}`}
              aria-label={`Diet ${diet}`}
            >
              D
            </span>
          )}
          {trackFat && fat === 'bad' && (
            <span className="cal-square fat bad" title="Fat over" aria-label="Fat over">
              F
            </span>
          )}
          {trackSugar && sugar === 'bad' && (
            <span className="cal-square sugar bad" title="Sugar over" aria-label="Sugar over">
              S
            </span>
          )}
        </>
      )}
      {log.isRestDay ? (
        <span className="cal-badge rest" title="Rest day" aria-label="Rest day">
          rest
        </span>
      ) : (
        exercise !== 'none' && (
          <span
            className={`cal-square exercise ${exercise}`}
            title={`Exercise: ${exercise}`}
            aria-label={`Exercise ${exercise}`}
          >
            E
          </span>
        )
      )}
      {destress === 'good' && (
        <span className="cal-square destress good" title="Calm: done" aria-label="Calm done">
          C
        </span>
      )}
    </div>
  );
}
