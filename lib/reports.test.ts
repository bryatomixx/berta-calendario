import { describe, it, expect } from 'vitest';
import { filterByDateRange, reportByCategory, reportByMember } from './reports';
import type { Task } from './types';

function task(overrides: Partial<Task>): Task {
  return {
    id: 'x',
    title: 't',
    description: null,
    category: 'Contabilidad',
    status: 'hecho',
    priority: 'media',
    member_id: 'm1',
    hours: 2,
    task_date: '2026-05-10',
    position: 0,
    project_id: null,
    created_at: '',
    updated_at: '',
    ...overrides,
  };
}

const tasks: Task[] = [
  task({ id: 'a', category: 'Contabilidad', member_id: 'm1', hours: 2, status: 'hecho' }),
  task({ id: 'b', category: 'Impuestos', member_id: 'm2', hours: 3, status: 'pendiente' }),
  task({ id: 'c', category: 'Contabilidad', member_id: 'm1', hours: null, status: 'en_proceso' }),
];

describe('reportByCategory', () => {
  it('sums hours per category', () => {
    const rows = reportByCategory(tasks);
    const cont = rows.find((r) => r.key === 'Contabilidad')!;
    expect(cont.hours).toBe(2);
    expect(cont.taskCount).toBe(2);
  });
});

describe('reportByMember', () => {
  it('sums hours per member', () => {
    const rows = reportByMember(tasks);
    expect(rows.find((r) => r.key === 'm1')!.hours).toBe(2);
    expect(rows.find((r) => r.key === 'm2')!.hours).toBe(3);
  });
});

describe('filterByDateRange', () => {
  it('keeps only tasks within the inclusive range', () => {
    const wide = [
      task({ id: 'old', task_date: '2026-01-01' }),
      task({ id: 'in', task_date: '2026-05-10' }),
      task({ id: 'new', task_date: '2026-12-31' }),
    ];
    const result = filterByDateRange(wide, '2026-05-01', '2026-05-31');
    expect(result.map((t) => t.id)).toEqual(['in']);
  });
});
