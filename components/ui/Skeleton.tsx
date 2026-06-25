interface SkeletonProps {
  className?: string;
}

/** Rectangulo gris animado para estados de carga. */
export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-slate-100 rounded-[var(--radius-md)] ${className}`}
      aria-hidden="true"
    />
  );
}
