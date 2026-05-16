const MESES_ABREV = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

const MESES_LARGO = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

const DIAS_SEMANA = [
  "domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado",
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

export function FechaGrande({
  fecha,
  diasFaltantes,
}: {
  fecha: Date;
  diasFaltantes: number;
}) {
  return (
    <div className="flex items-baseline gap-3">
      <div className="flex flex-col items-center font-serif leading-none">
        <span className="text-[11px] tracker text-ink-muted mb-1">
          {MESES_ABREV[fecha.getMonth()]}
        </span>
        <span className="text-5xl tabular text-ink">{fecha.getDate()}</span>
      </div>
      <div className="flex flex-col">
        <span className="serif-italic text-2xl text-terracotta tabular leading-none">
          {diasFaltantes === 0 ? "hoy" : `${diasFaltantes}d`}
        </span>
        <span className="tracker text-ink-faint mt-1.5">
          {diasFaltantes === 0 ? "vence" : "restantes"}
        </span>
      </div>
    </div>
  );
}
