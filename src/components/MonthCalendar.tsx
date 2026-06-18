import { useMemo } from 'react';
import type { PlanData } from '../types/plan';
import { getDaysInMonth, parseDate } from '../lib/dates';
import { DayStatusIcons } from './DayStatusIcons';

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
    const dayCells = days.map((date) => ({
      type: 'day' as const,
      key: date,
      date,
      dayNum: parseDate(date).getDate(),
    }));
    return [...blanks, ...dayCells];
  }, [monthKey]);

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
              <DayStatusIcons plan={plan} date={cell.date} />
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
