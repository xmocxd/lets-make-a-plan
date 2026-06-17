export function formatDate(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function getWeekStart(dateStr: string): string {
  const d = parseDate(dateStr);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return formatDate(d);
}

export function getWeekDates(weekStart: string): string[] {
  const start = parseDate(weekStart);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return formatDate(d);
  });
}

export function getMonthKey(dateStr: string): string {
  return dateStr.slice(0, 7);
}

export function getDaysInMonth(monthKey: string): string[] {
  const [y, m] = monthKey.split('-').map(Number);
  const days: string[] = [];
  const last = new Date(y, m, 0).getDate();
  for (let d = 1; d <= last; d++) {
    days.push(`${monthKey}-${String(d).padStart(2, '0')}`);
  }
  return days;
}

export function getLastSunday3AM(before: Date = new Date()): Date {
  const d = new Date(before);
  d.setHours(3, 0, 0, 0);
  const day = d.getDay();
  if (day !== 0) {
    d.setDate(d.getDate() - day);
  }
  if (d > before) {
    d.setDate(d.getDate() - 7);
  }
  return d;
}

export function getMonthsBack(count: number, from: Date = new Date()): string[] {
  const months: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(from.getFullYear(), from.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return months;
}
