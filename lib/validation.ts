import type { TaskInput } from './types';

export type ValidationErrors = Partial<Record<keyof TaskInput, string>>;

export function validateTask(input: Partial<TaskInput>): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!input.title || input.title.trim() === '') {
    errors.title = 'El título es obligatorio';
  }
  if (!input.member_id) errors.member_id = 'Selecciona un responsable';
  if (input.hours != null && input.hours < 0) {
    errors.hours = 'Las horas no pueden ser negativas';
  }

  return errors;
}
