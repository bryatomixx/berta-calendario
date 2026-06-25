import { PRIORITY_LABELS, PRIORITY_STYLES } from '@/lib/constants';
import type { Priority } from '@/lib/types';

/** Badge (o punto) de prioridad: alta rojo, media ambar, baja gris. */
export function PriorityBadge({
  priority,
  variant = 'chip',
}: {
  priority: Priority;
  variant?: 'chip' | 'dot';
}) {
  const s = PRIORITY_STYLES[priority];
  const label = `Prioridad ${PRIORITY_LABELS[priority]}`;

  if (variant === 'dot') {
    return (
      <span
        className={`inline-block w-2 h-2 rounded-full shrink-0 ${s.dot}`}
        title={label}
        aria-label={label}
      />
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold leading-none ${s.chip}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} aria-hidden="true" />
      {PRIORITY_LABELS[priority]}
    </span>
  );
}
