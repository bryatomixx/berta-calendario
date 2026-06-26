import type { EstadoSemaforo } from "@/lib/tributario/types";

const STYLES: Record<
  EstadoSemaforo,
  { dot: string; chipBg: string; chipText: string; label: string; pulse: boolean }
> = {
  al_dia: {
    dot: "bg-emerald-500",
    chipBg: "bg-emerald-100",
    chipText: "text-emerald-700",
    label: "Al dia",
    pulse: false,
  },
  proximo: {
    dot: "bg-amber-500",
    chipBg: "bg-amber-100",
    chipText: "text-amber-700",
    label: "Proximo",
    pulse: false,
  },
  urgente: {
    dot: "bg-orange-500",
    chipBg: "bg-orange-100",
    chipText: "text-orange-700",
    label: "Urgente",
    pulse: false,
  },
  vence_hoy: {
    dot: "bg-rose-600",
    chipBg: "bg-rose-100",
    chipText: "text-rose-700",
    label: "Vence hoy",
    pulse: true,
  },
  vencido: {
    dot: "bg-rose-700",
    chipBg: "bg-rose-100",
    chipText: "text-rose-700",
    label: "Vencido",
    pulse: false,
  },
};

export function SemaforoBadge({
  estado,
  diasFaltantes,
  size = "sm",
}: {
  estado: EstadoSemaforo;
  diasFaltantes: number;
  size?: "sm" | "md" | "lg";
}) {
  const s = STYLES[estado];
  const sufijo =
    estado === "vencido"
      ? `hace ${Math.abs(diasFaltantes)}d`
      : estado === "vence_hoy"
      ? "hoy"
      : estado === "al_dia"
      ? `${diasFaltantes}d`
      : `en ${diasFaltantes}d`;

  const sizeClasses = {
    sm: "px-2.5 py-1 text-[11px] gap-1.5",
    md: "px-3 py-1.5 text-xs gap-2",
    lg: "px-4 py-2 text-sm gap-2.5",
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-[var(--radius-full)] ${s.chipBg} ${s.chipText} ${sizeClasses} font-medium tabular-nums`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full shrink-0 ${s.dot} ${s.pulse ? "animate-dot-pulse" : ""}`}
      />
      <span>{s.label}</span>
      <span className="opacity-60">·</span>
      <span>{sufijo}</span>
    </span>
  );
}

export function SemaforoDot({ estado }: { estado: EstadoSemaforo }) {
  const s = STYLES[estado];
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full shrink-0 ${s.dot} ${s.pulse ? "animate-dot-pulse" : ""}`}
    />
  );
}
