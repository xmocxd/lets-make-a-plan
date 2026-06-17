import { useMemo } from 'react';
import type { PlanData } from '../types/plan';
import { getDaysInMonth, parseDate } from '../lib/dates';
import {
  getLogForDate,
  getDietDayStatus,
  getExerciseDayStatus,
  getDestressDayStatus,
  getFatDayStatus,
  getSugarDayStatus,
} from '../lib/scoring';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface MonthCalendarProps {
  plan: PlanData;
  monthKey: string;
}

export function MonthCalendar({ plan, monthKey }: MonthCalendarProps) {
  const trackFat = plan.settings.fatTrackingEnabled;
  const trackSugar = plan.settings.sugarTrackingEnabled;

  const cells = useMemo(() => {
    const days = getDaysInMonth(monthKey);
    const firstDow = parseDate(days[0]).getDay();
    const blanks = Array.from({ length: firstDow }, (_, i) => ({ type: 'blank' as const, key: `b${i}` }));
    const dayCells = days.map((date) => {
      const log = getLogForDate(plan.dailyLogs, date);
      return {
        type: 'day' as const,
        key: date,
        date,
        dayNum: parseDate(date).getDate(),
        isCheatDay: log.isCheatDay,
        isRestDay: log.isRestDay,
        diet: getDietDayStatus(
          log,
          plan.settings.calorieTarget,
          plan.settings.dietCalorieExceedPctMax,
        ),
        fat: getFatDayStatus(log),
        sugar: getSugarDayStatus(log),
        exercise: getExerciseDayStatus(log, plan.exerciseActivities),
        destress: getDestressDayStatus(log),
      };
    });
    return [...blanks, ...dayCells];
  }, [plan, monthKey]);

  return (
    <div className="month-calendar">
      <div className="calendar-weekdays">
        {WEEKDAYS.map((d) => (
          <span key={d} className="calendar-weekday">
            {d}
          </span>
        ))}
      </div>
      <div className="calendar-grid">
        {cells.map((cell) =>
          cell.type === 'blank' ? (
            <div key={cell.key} className="calendar-cell blank" aria-hidden />
          ) : (
            <div key={cell.key} className="calendar-cell" title={cell.date}>
              <span className="calendar-day-num">{cell.dayNum}</span>
              <div className="calendar-squares">
                {cell.isCheatDay ? (
                  <span className="cal-badge cheat" title="Cheat day" aria-label="Cheat day">
                    cheat
                  </span>
                ) : (
                  <>
                    {cell.diet !== 'unset' && (
                      <span
                        className={`cal-square diet ${cell.diet}`}
                        title={`Diet: ${cell.diet}`}
                        aria-label={`Diet ${cell.diet}`}
                      >
                        D
                      </span>
                    )}
                    {trackFat && cell.fat === 'bad' && (
                      <span
                        className="cal-square fat bad"
                        title="Fat over"
                        aria-label="Fat over"
                      >
                        F
                      </span>
                    )}
                    {trackSugar && cell.sugar === 'bad' && (
                      <span
                        className="cal-square sugar bad"
                        title="Sugar over"
                        aria-label="Sugar over"
                      >
                        S
                      </span>
                    )}
                  </>
                )}
                {cell.isRestDay ? (
                  <span className="cal-badge rest" title="Rest day" aria-label="Rest day">
                    rest
                  </span>
                ) : (
                  cell.exercise !== 'bad' && (
                    <span
                      className={`cal-square exercise ${cell.exercise}`}
                      title={`Exercise: ${cell.exercise}`}
                      aria-label={`Exercise ${cell.exercise}`}
                    >
                      E
                    </span>
                  )
                )}
                {cell.destress === 'good' && (
                  <span
                    className="cal-square destress good"
                    title="Calm: done"
                    aria-label="Calm done"
                  >
                    C
                  </span>
                )}
              </div>
            </div>
          ),
        )}
      </div>
      <div className="calendar-legend">
        <p className="legend-heading">
          D · Diet &nbsp; E · Exercise &nbsp; C · Calm
          {trackFat && <> &nbsp; F · Fat</>}
          {trackSugar && <> &nbsp; S · Sugar</>}
        </p>
        <div className="legend-row">
          <span className="legend-item">
            <span className="cal-square good">D</span> On goal
          </span>
          <span className="legend-item">
            <span className="cal-square yellow">D</span> Over (a bit)
          </span>
          <span className="legend-item">
            <span className="cal-square bad">D</span> Over goal
          </span>
          <span className="legend-item">
            <span className="cal-square none">D</span> Day skipped
          </span>
          <span className="legend-item">
            <span className="cal-square yellow">E</span> Half day
          </span>
          <span className="legend-item">
            <span className="cal-square none">E</span> Day skipped
          </span>
          {(trackFat || trackSugar) && (
            <span className="legend-item">
              <span className="cal-square bad">F</span> · <span className="cal-square bad">S</span> Over only
            </span>
          )}
          <span className="legend-item">
            <span className="cal-badge cheat">cheat</span> Cheat day
          </span>
          <span className="legend-item">
            <span className="cal-badge rest">rest</span> Rest day
          </span>
          <span className="legend-item">
            <span className="cal-square destress good">C</span> Calm done
          </span>
        </div>
      </div>
    </div>
  );
}
