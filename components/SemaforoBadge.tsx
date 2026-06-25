import type { EstadoSemaforo } from "@/lib/tributario/types";

const STYLES: Record<
  EstadoSemaforo,
  { dot: string; text: string; bg: string; ring: string; label: string; pulse: boolean }
> = {
  al_dia: {
    dot: "bg-sage",
    text: "text-sage",
    bg: "bg-sage-soft",
    ring: "ring-sage/20",
    label: "Al día",
    pulse: false,
  },
  proximo: {
    dot: "bg-amber-deep",
    text: "text-amber-deep",
    bg: "bg-amber-soft",
    ring: "ring-amber-deep/20",
    label: "Próximo",
    pulse: false,
  },
  urgente: {
    dot: "bg-rust",
    text: "text-rust",
    bg: "bg-rust-soft",
    ring: "ring-rust/20",
    label: "Urgente",
    pulse: false,
  },
  vence_hoy: {
    dot: "bg-crimson",
    text: "text-crimson",
    bg: "bg-crimson-soft",
    ring: "ring-crimson/20",
    label: "Vence hoy",
    pulse: true,
  },
  vencido: {
    dot: "bg-graphite",
    text: "text-graphite",
    bg: "bg-graphite-soft",
    ring: "ring-graphite/20",
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
      className={`inline-flex items-center rounded-full ring-1 ${s.bg} ${s.text} ${s.ring} ${sizeClasses} font-medium tabular`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${s.dot} ${s.pulse ? "dot-pulse" : ""}`}
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
      className={`inline-block h-2 w-2 rounded-full ${s.dot} ${s.pulse ? "dot-pulse" : ""}`}
    />
  );
}
