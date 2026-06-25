'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface HoursPromptProps {
  taskTitle: string;
  onConfirm: (hours: number) => void;
  onCancel: () => void;
}

export function HoursPrompt({ taskTitle, onConfirm, onCancel }: HoursPromptProps) {
  const [value, setValue] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-fade-in">
      <Card
        variant="default"
        padding="none"
        className="w-full max-w-sm shadow-modal animate-scale-in"
      >
        <div className="px-6 pt-5 pb-4">
          <h2 className="text-base font-bold text-[var(--color-text-primary)]">
            Cuantas horas tomo esta tarea?
          </h2>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)] truncate">{taskTitle}</p>

          <input
            type="number"
            min="0"
            step="0.25"
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Ej: 2.5"
            className={[
              'mt-4 w-full h-10 rounded-[var(--radius-md)]',
              'border border-[var(--color-border)] bg-white px-3 text-sm',
              'placeholder:text-[var(--color-text-disabled)]',
              'focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none',
              'transition-colors duration-[var(--duration-fast)]',
            ].join(' ')}
          />
          <p className="mt-2 text-xs text-[var(--color-text-muted)]">
            Puedes dejar en 0 si no aplica.
          </p>
        </div>

        <div className="flex justify-end gap-2 px-6 pb-5 pt-1 border-t border-[var(--color-border-soft)]">
          <Button variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={() => onConfirm(value === '' ? 0 : Number(value))}
          >
            Confirmar y mover
          </Button>
        </div>
      </Card>
    </div>
  );
}
