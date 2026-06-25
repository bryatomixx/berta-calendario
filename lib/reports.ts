import type { Task } from './types';

export interface ReportRow {
  key: string;
  hours: number;
  taskCount: number;
}

function aggregate(tasks: Task[], keyOf: (t: Task) => string): ReportRow[] {
  const rows = new Map<string, ReportRow>();
  for (const t of tasks) {
    const key = keyOf(t);
    const row = rows.get(key) ?? { key, hours: 0, taskCount: 0 };
    row.hours += t.hours ?? 0;
    row.taskCount += 1;
    rows.set(key, row);
  }
  return [...rows.values()].sort((a, b) => b.hours - a.hours);
}

export function reportByCategory(tasks: Task[]): ReportRow[] {
  return aggregate(tasks, (t) => t.category);
}

export function reportByMember(tasks: Task[]): ReportRow[] {
  return aggregate(tasks, (t) => t.member_id ?? 'sin-responsable');
}

/** Inclusive range filter. Dates are 'YYYY-MM-DD' strings (lexically ordered). */
export function filterByDateRange(tasks: Task[], from: string, to: string): Task[] {
  return tasks.filter((t) => t.task_date >= from && t.task_date <= to);
}
