import Link from "next/link";
import { cargarClientes, cargarCalendario } from "@/lib/tributario/clientes";

const NOMBRES_MES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const NOMBRES_MES_CORTO = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

type Evento = {
  clienteId: string;
  clienteNombre: string;
  obligacionId: string;
  obligacionNombre: string;
};

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; anio?: string }>;
}) {
  const sp = await searchParams;
  const hoy = new Date();
  const mes = sp.mes ? parseInt(sp.mes, 10) : hoy.getMonth() + 1;
  const anio = sp.anio ? parseInt(sp.anio, 10) : hoy.getFullYear();

  const [clientes, calendario] = await Promise.all([
    cargarClientes(),
    cargarCalendario(),
  ]);

  const porDia: Record<number, Evento[]> = {};
  for (const cliente of clientes) {
    for (const obligacion of calendario.obligaciones) {
      if (!cliente.obligacionesActivas.includes(obligacion.id)) continue;
      for (const v of obligacion.vencimientos) {
        if (v.mes !== mes || v.anio !== anio) continue;
        const clave =
          obligacion.calculo === "ultimo_1"
            ? cliente.nit.slice(-1)
            : (() => {
                const dos = cliente.nit.slice(-2).padStart(2, "0");
                if (dos === "00") return "99-00";
                const n = parseInt(dos, 10);
                return n % 2 === 0
                  ? `${String(n - 1).padStart(2, "0")}-${String(n).padStart(2, "0")}`
                  : `${String(n).padStart(2, "0")}-${String(n + 1).padStart(2, "0")}`;
              })();
        const dia = v.fechas[clave];
        if (dia === undefined) continue;
        if (!porDia[dia]) porDia[dia] = [];
        porDia[dia].push({
          clienteId: cliente.id,
          clienteNombre: cliente.nombre,
          obligacionId: obligacion.id,
          obligacionNombre: obligacion.nombre,
        });
      }
    }
  }

  const totalEventos = Object.values(porDia).reduce((s, arr) => s + arr.length, 0);

  const primerDia = new Date(anio, mes - 1, 1);
  const offsetSemana = (primerDia.getDay() + 6) % 7;
  const diasEnMes = new Date(anio, mes, 0).getDate();

  const celdas: Array<{ dia: number | null; eventos: Evento[]; esHoy: boolean }> = [];
  for (let i = 0; i < offsetSemana; i++) celdas.push({ dia: null, eventos: [], esHoy: false });
  for (let d = 1; d <= diasEnMes; d++) {
    const esHoy =
      anio === hoy.getFullYear() && mes === hoy.getMonth() + 1 && d === hoy.getDate();
    celdas.push({ dia: d, eventos: porDia[d] ?? [], esHoy });
  }

  const mesAnt = mes === 1 ? { mes: 12, anio: anio - 1 } : { mes: mes - 1, anio };
  const mesSig = mes === 12 ? { mes: 1, anio: anio + 1 } : { mes: mes + 1, anio };

  return (
    <div className="bg-cream text-ink rounded-[var(--radius-xl)] paper-shadow p-6 md:p-8 -mx-1">
      <div className="px-2 md:px-8 py-4 max-w-6xl">
        <header className="flex items-end justify-between mb-10 gap-6 flex-wrap">
          <div>
            <p className="tracker text-ink-muted mb-3">Calendario tributario</p>
            <h1 className="font-serif text-5xl md:text-6xl text-ink leading-none tracking-tight">
              {NOMBRES_MES[mes - 1]}
              <span className="serif-italic text-terracotta tabular ml-3">{anio}</span>
            </h1>
            <p className="mt-4 text-ink-soft">
              <span className="tabular font-medium">{totalEventos}</span> vencimientos en este mes
              <span className="text-ink-faint"> · DIAN</span>
            </p>
          </div>
          <nav className="flex items-center gap-2 font-mono text-xs">
            <Link
              href={`/calendario?mes=${mesAnt.mes}&anio=${mesAnt.anio}`}
              className="px-4 py-2.5 rounded-full bg-paper paper-shadow hover:bg-cream-deep transition-colors text-ink-soft hover:text-ink"
            >
              ← {NOMBRES_MES_CORTO[mesAnt.mes - 1]}
            </Link>
            <Link
              href={`/calendario?mes=${hoy.getMonth() + 1}&anio=${hoy.getFullYear()}`}
              className="px-4 py-2.5 rounded-full bg-ink text-cream paper-shadow hover:bg-graphite transition-colors tracker"
            >
              Hoy
            </Link>
            <Link
              href={`/calendario?mes=${mesSig.mes}&anio=${mesSig.anio}`}
              className="px-4 py-2.5 rounded-full bg-paper paper-shadow hover:bg-cream-deep transition-colors text-ink-soft hover:text-ink"
            >
              {NOMBRES_MES_CORTO[mesSig.mes - 1]} →
            </Link>
          </nav>
        </header>

        {/* Grid */}
        <div className="rounded-2xl bg-paper paper-shadow-lg overflow-hidden">
          <div className="grid grid-cols-7 border-b border-rule">
            {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d, i) => (
              <div
                key={d}
                className={`px-3 py-3 tracker text-ink-muted ${
                  i >= 5 ? "text-ink-faint" : ""
                }`}
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {celdas.map((c, i) => {
              const esFinde = i % 7 >= 5;
              return (
                <div
                  key={i}
                  className={`min-h-32 p-3 border-r border-b border-rule-soft ${
                    esFinde ? "bg-cream/40" : ""
                  } ${c.esHoy ? "ring-2 ring-inset ring-terracotta/40" : ""}`}
                >
                  {c.dia !== null && (
                    <>
                      <div className="flex items-baseline justify-between mb-2">
                        <span
                          className={`font-serif text-xl tabular leading-none ${
                            c.esHoy
                              ? "text-terracotta serif-italic"
                              : esFinde
                              ? "text-ink-faint"
                              : "text-ink"
                          }`}
                        >
                          {c.dia}
                        </span>
                        {c.eventos.length > 0 && (
                          <span className="font-mono text-[9px] tabular text-ink-faint">
                            {c.eventos.length}
                          </span>
                        )}
                      </div>
                      {c.eventos.length > 0 && (
                        <ul className="space-y-1">
                          {c.eventos.slice(0, 3).map((e, j) => (
                            <li key={j}>
                              <Link
                                href={`/clientes/${e.clienteId}`}
                                className="block truncate text-[11px] text-ink-soft hover:text-terracotta transition-colors"
                                title={`${e.clienteNombre} — ${e.obligacionNombre}`}
                              >
                                <span className="text-terracotta mr-1">·</span>
                                {e.clienteNombre.split(" ")[0]}
                              </Link>
                            </li>
                          ))}
                          {c.eventos.length > 3 && (
                            <li className="text-[10px] text-ink-faint italic">
                              + {c.eventos.length - 3} más
                            </li>
                          )}
                        </ul>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend / atajos */}
        <div className="mt-6 flex items-center gap-4 text-xs text-ink-muted">
          <span className="tracker">Saltar</span>
          {[5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
            <Link
              key={m}
              href={`/calendario?mes=${m}&anio=2026`}
              className={`font-mono tabular hover:text-terracotta transition-colors ${
                m === mes ? "text-terracotta" : ""
              }`}
            >
              {NOMBRES_MES_CORTO[m - 1]}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
