import { describe, it, expect } from 'vitest';
import { filterByDateRange, reportByClient, reportByMember, totalHours } from './reports';
import type { Task } from './types';

function task(overrides: Partial<Task>): Task {
  return {
    id: 'x',
    title: 't',
    description: null,
    status: 'hecho',
    priority: 'media',
    member_id: 'm1',
    client_id: null,
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
  task({ id: 'a', client_id: 'c1', member_id: 'm1', hours: 2, status: 'hecho' }),
  task({ id: 'b', client_id: 'c2', member_id: 'm2', hours: 3, status: 'pendiente' }),
  task({ id: 'c', client_id: 'c1', member_id: 'm1', hours: null, status: 'en_proceso' }),
  task({ id: 'd', client_id: null, member_id: 'm1', hours: 4, status: 'hecho' }),
];

describe('reportByClient', () => {
  it('sums hours and task count per client', () => {
    const rows = reportByClient(tasks);
    const c1 = rows.find((r) => r.key === 'c1')!;
    expect(c1.hours).toBe(2);
    expect(c1.taskCount).toBe(2);
  });

  it('groups tasks with no client under sin-cliente', () => {
    const rows = reportByClient(tasks);
    expect(rows.find((r) => r.key === 'sin-cliente')!.hours).toBe(4);
  });
});

describe('reportByMember', () => {
  it('sums hours per member, treating null hours as zero', () => {
    const rows = reportByMember(tasks);
    expect(rows.find((r) => r.key === 'm1')!.hours).toBe(6);
    expect(rows.find((r) => r.key === 'm2')!.hours).toBe(3);
  });
});

describe('totalHours', () => {
  it('sums all recorded hours, treating null as zero', () => {
    expect(totalHours(tasks)).toBe(9);
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
