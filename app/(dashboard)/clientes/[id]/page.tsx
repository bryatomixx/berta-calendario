import { notFound } from "next/navigation";
import Link from "next/link";
import { SemaforoBadge } from "@/components/SemaforoBadge";
import { obtenerCliente, cargarCalendario } from "@/lib/tributario/clientes";
import { obtenerVencimientosFuturos, estadoSemaforo } from "@/lib/tributario/calendario";

const REGIMEN_LABEL: Record<string, string> = {
  no_aplica: "No aplica",
  bimestral: "Bimestral",
  cuatrimestral: "Cuatrimestral",
};

function iniciales(nombre: string): string {
  return nombre
    .split(" ")
    .filter((p) => /^[A-ZÁÉÍÓÚÑ]/.test(p))
    .slice(0, 2)
    .map((p) => p[0])
    .join("");
}

export default async function ClienteDetalle({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cliente = await obtenerCliente(id);
  if (!cliente) notFound();

  const calendario = await cargarCalendario();
  const vencimientos = obtenerVencimientosFuturos(cliente, calendario, new Date());

  const porMes = vencimientos.reduce<Record<string, typeof vencimientos>>(
    (acc, v) => {
      const k = `${v.fecha.getFullYear()}-${String(v.fecha.getMonth() + 1).padStart(2, "0")}`;
      if (!acc[k]) acc[k] = [];
      acc[k].push(v);
      return acc;
    },
    {}
  );

  const MESES_LARGO = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];

  return (
    <div className="bg-cream text-ink rounded-[var(--radius-xl)] paper-shadow p-6 md:p-8 -mx-1">
      <div className="px-2 md:px-8 py-4 max-w-5xl">
        {/* Breadcrumb */}
        <Link
          href="/clientes"
          className="inline-flex items-center gap-2 tracker text-ink-muted hover:text-terracotta transition-colors mb-8"
        >
          <span>&#8592;</span>
          <span>Clientes</span>
        </Link>

        {/* Hero */}
        <header className="flex items-start gap-6 mb-12">
          <div className="shrink-0 h-20 w-20 rounded-full bg-cream-deep flex items-center justify-center paper-shadow">
            <span className="serif-italic text-3xl text-terracotta tabular leading-none">
              {iniciales(cliente.nombre)}
            </span>
          </div>
          <div className="flex-1 pt-1">
            <p className="tracker text-ink-muted mb-2">
              {cliente.tipoPersona === "natural" ? "Persona natural" : "Persona juridica"}
            </p>
            <h1 className="font-serif text-4xl md:text-5xl text-ink leading-[1.05] tracking-tight">
              {cliente.nombre}
            </h1>
            <p className="font-mono text-sm tabular text-ink-muted mt-3">
              NIT {cliente.nit}-{cliente.digitoVerificacion}
            </p>
          </div>
        </header>

        {/* Datos del cliente */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-px rounded-xl bg-rule overflow-hidden paper-shadow mb-12">
          <DataCard label="Regimen IVA" value={REGIMEN_LABEL[cliente.regimenIva]} />
          <DataCard label="Obligaciones" value={`${cliente.obligacionesActivas.length}`} mono />
          <DataCard label="Email" value={cliente.email} small />
          <DataCard label="WhatsApp" value={cliente.telefono} mono />
        </section>

        {/* Timeline de vencimientos */}
        <section>
          <div className="flex items-baseline gap-3 mb-6">
            <h2 className="font-serif text-3xl text-ink tracking-tight">
              Vencimientos
              <span className="serif-italic text-terracotta tabular ml-3">
                {vencimientos.length}
              </span>
            </h2>
            <div className="dotted-rule flex-1 mb-1" />
            <span className="tracker text-ink-faint">resto de 2026</span>
          </div>

          {vencimientos.length === 0 ? (
            <div className="rounded-xl bg-paper paper-shadow px-6 py-10">
              <p className="text-ink-faint italic text-center">
                Sin vencimientos pendientes en 2026.
              </p>
            </div>
          ) : (
            <div className="rounded-xl bg-paper paper-shadow overflow-hidden">
              {Object.entries(porMes).map(([mesKey, vs], iMes) => {
                const [anio, mes] = mesKey.split("-").map(Number);
                return (
                  <div
                    key={mesKey}
                    className={iMes > 0 ? "border-t border-rule-soft" : ""}
                  >
                    <div className="flex items-baseline gap-4 px-6 pt-6 pb-3">
                      <span className="serif-italic text-2xl text-ink tabular">
                        {MESES_LARGO[mes - 1]}
                      </span>
                      <span className="font-mono text-xs tabular text-ink-faint">
                        {anio}
                      </span>
                      <span className="ml-auto font-mono text-[11px] tabular text-ink-faint">
                        {vs.length} {vs.length === 1 ? "vencimiento" : "vencimientos"}
                      </span>
                    </div>
                    <ul className="divide-y divide-rule-soft">
                      {vs.map((v) => (
                        <li
                          key={`${v.obligacionId}-${v.fecha.toISOString()}`}
                          className="flex items-center gap-5 px-6 py-4"
                        >
                          <div className="shrink-0 w-12 text-center">
                            <p className="font-serif text-3xl tabular text-ink leading-none">
                              {v.fecha.getDate()}
                            </p>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-ink font-medium">
                              {v.obligacionNombre}
                            </p>
                            <p className="text-sm text-ink-muted mt-0.5">
                              <span className="serif-italic">{v.etapa}</span>
                              <span className="text-ink-faint"> · periodo </span>
                              <span>{v.periodo}</span>
                            </p>
                          </div>
                          <SemaforoBadge
                            estado={estadoSemaforo(v.diasFaltantes)}
                            diasFaltantes={v.diasFaltantes}
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function DataCard({
  label,
  value,
  mono,
  small,
}: {
  label: string;
  value: string;
  mono?: boolean;
  small?: boolean;
}) {
  return (
    <div className="bg-paper px-5 py-4">
      <p className="tracker text-ink-faint mb-2">{label}</p>
      <p
        className={`text-ink ${mono ? "font-mono tabular" : ""} ${
          small ? "text-xs" : "text-sm"
        } truncate`}
      >
        {value}
      </p>
    </div>
  );
}
