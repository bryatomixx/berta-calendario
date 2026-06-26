import { describe, it, expect } from 'vitest';
import { needsHoursPrompt, reorderTasks } from './board';
import type { Task } from './types';

function task(overrides: Partial<Task>): Task {
  return {
    id: 'x',
    title: 't',
    description: null,
    status: 'pendiente',
    priority: 'media',
    member_id: 'm1',
    client_id: null,
    hours: null,
    task_date: '2026-05-21',
    position: 0,
    project_id: null,
    created_at: '',
    updated_at: '',
    ...overrides,
  };
}

describe('needsHoursPrompt', () => {
  it('asks for hours when moving to hecho with no hours', () => {
    expect(needsHoursPrompt(task({ hours: null }), 'hecho')).toBe(true);
  });

  it('asks for hours when moving to hecho with zero hours', () => {
    expect(needsHoursPrompt(task({ hours: 0 }), 'hecho')).toBe(true);
  });

  it('does not ask when hours are already set', () => {
    expect(needsHoursPrompt(task({ hours: 3 }), 'hecho')).toBe(false);
  });

  it('does not ask when the target column is not hecho', () => {
    expect(needsHoursPrompt(task({ hours: null }), 'en_proceso')).toBe(false);
  });
});

describe('reorderTasks', () => {
  it('moves a task to a new column and updates its status', () => {
    const tasks = [
      task({ id: 'a', status: 'pendiente', position: 0 }),
      task({ id: 'b', status: 'en_proceso', position: 0 }),
    ];
    const result = reorderTasks(tasks, 'a', 'en_proceso', 0);
    const a = result.find((t) => t.id === 'a')!;
    expect(a.status).toBe('en_proceso');
  });

  it('assigns sequential positions within the destination column', () => {
    const tasks = [
      task({ id: 'a', status: 'pendiente', position: 0 }),
      task({ id: 'b', status: 'en_proceso', position: 0 }),
      task({ id: 'c', status: 'en_proceso', position: 1 }),
    ];
    const result = reorderTasks(tasks, 'a', 'en_proceso', 1);
    const col = result
      .filter((t) => t.status === 'en_proceso')
      .sort((x, y) => x.position - y.position)
      .map((t) => t.id);
    expect(col).toEqual(['b', 'a', 'c']);
  });

  it('returns the list unchanged when the task id is unknown', () => {
    const tasks = [task({ id: 'a' })];
    expect(reorderTasks(tasks, 'missing', 'hecho', 0)).toEqual(tasks);
  });
});
