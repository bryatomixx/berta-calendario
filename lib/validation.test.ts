import { describe, it, expect } from 'vitest';
import { validateTask } from './validation';
import type { TaskInput } from './types';

const valid: TaskInput = {
  title: 'Conciliación bancaria',
  description: '',
  status: 'pendiente',
  priority: 'media',
  member_id: 'm1',
  client_id: null,
  hours: null,
  task_date: '2026-05-21',
  position: 0,
  project_id: null,
};

describe('validateTask', () => {
  it('returns no errors for a valid task', () => {
    expect(validateTask(valid)).toEqual({});
  });

  it('flags a blank title', () => {
    expect(validateTask({ ...valid, title: '   ' }).title).toBeDefined();
  });

  it('flags a missing member', () => {
    expect(validateTask({ ...valid, member_id: '' }).member_id).toBeDefined();
  });

  it('flags negative hours', () => {
    expect(validateTask({ ...valid, hours: -2 }).hours).toBeDefined();
  });

  it('accepts null hours', () => {
    expect(validateTask({ ...valid, hours: null }).hours).toBeUndefined();
  });
});
