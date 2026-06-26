const MESES_ABREV = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

const MESES_LARGO = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

const DIAS_SEMANA = [
  "domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado",
];

export function fechaCorta(d: Date): string {
  return `${d.getDate()} ${MESES_ABREV[d.getMonth()]}`;
}

export function fechaLarga(d: Date): string {
  return `${d.getDate()} de ${MESES_LARGO[d.getMonth()]}, ${d.getFullYear()}`;
}

export function diaSemanaLargo(d: Date): string {
  return `${DIAS_SEMANA[d.getDay()]} ${d.getDate()} de ${MESES_LARGO[d.getMonth()]}`;
}

/**
 * Muestra la fecha de vencimiento en estilo dashboard: numero grande + dias
 * restantes en teal. Reemplaza la version editorial anterior (serif/terracotta).
 */
export function FechaGrande({
  fecha,
  diasFaltantes,
}: {
  fecha: Date;
  diasFaltantes: number;
}) {
  return (
    <div className="flex items-baseline gap-4">
      <div className="flex flex-col items-center leading-none">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)] mb-1">
          {MESES_ABREV[fecha.getMonth()]}
        </span>
        <span className="text-5xl tabular-nums font-bold text-[var(--color-text-primary)]">
          {fecha.getDate()}
        </span>
      </div>
      <div className="flex flex-col">
        <span className="text-3xl tabular-nums font-bold text-teal-600 leading-none">
          {diasFaltantes === 0 ? "hoy" : `${diasFaltantes}d`}
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)] mt-1.5">
          {diasFaltantes === 0 ? "vence" : "restantes"}
        </span>
      </div>
    </div>
  );
}
