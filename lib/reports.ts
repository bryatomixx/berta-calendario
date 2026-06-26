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

export function reportByMember(tasks: Task[]): ReportRow[] {
  return aggregate(tasks, (t) => t.member_id ?? 'sin-responsable');
}

/** Horas y tareas agrupadas por cliente. Las internas caen en 'sin-cliente'. */
export function reportByClient(tasks: Task[]): ReportRow[] {
  return aggregate(tasks, (t) => t.client_id ?? 'sin-cliente');
}

/** Suma total de horas registradas en las tareas dadas. */
export function totalHours(tasks: Task[]): number {
  return tasks.reduce((sum, t) => sum + (t.hours ?? 0), 0);
}

/** Inclusive range filter. Dates are 'YYYY-MM-DD' strings (lexically ordered). */
export function filterByDateRange(tasks: Task[], from: string, to: string): Task[] {
  return tasks.filter((t) => t.task_date >= from && t.task_date <= to);
}
