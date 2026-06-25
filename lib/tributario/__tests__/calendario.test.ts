import { describe, it, expect } from "vitest";
import {
  obtenerDigitoClave,
  obtenerProximoVencimiento,
  estadoSemaforo,
  obtenerVencimientosFuturos,
} from "../calendario";
import type { Cliente, Obligacion, Calendario } from "../types";

const calendario: Calendario = {
  anio: 2026,
  obligaciones: [
    {
      id: "iva_bimestral",
      nombre: "IVA Bimestral",
      calculo: "ultimo_1",
      vencimientos: [
        { etapa: "Decl", periodo: "ene-feb", mes: 3, anio: 2026, fechas: { "1": 10, "0": 24 } },
        { etapa: "Decl", periodo: "mar-abr", mes: 5, anio: 2026, fechas: { "1": 12, "0": 26 } },
      ],
    },
    {
      id: "renta_juridica",
      nombre: "Renta PJ",
      calculo: "ultimo_1",
      vencimientos: [
        { etapa: "1ra", periodo: "2026", mes: 5, anio: 2026, fechas: { "1": 12, "0": 26 } },
      ],
    },
    {
      id: "renta_natural",
      nombre: "Renta PN",
      calculo: "ultimo_2",
      vencimientos: [
        { etapa: "Decl", periodo: "2026", mes: 9, anio: 2026, fechas: { "49-50": 16 } },
        { etapa: "Decl", periodo: "2026", mes: 10, anio: 2026, fechas: { "99-00": 26 } },
      ],
    },
  ],
};

describe("obtenerDigitoClave", () => {
  it("returns last digit for ultimo_1", () => {
    expect(obtenerDigitoClave("901234567", "ultimo_1")).toBe("7");
  });

  it("returns last 2-digit range for ultimo_2 with 50 → 49-50", () => {
    expect(obtenerDigitoClave("1098765450", "ultimo_2")).toBe("49-50");
  });

  it("returns 99-00 for NIT ending in 00", () => {
    expect(obtenerDigitoClave("1098700", "ultimo_2")).toBe("99-00");
  });

  it("returns last digit '0' for NIT ending in 0 (ultimo_1)", () => {
    expect(obtenerDigitoClave("900000", "ultimo_1")).toBe("0");
  });
});

describe("obtenerProximoVencimiento", () => {
  const cliente: Cliente = {
    id: "test", nombre: "Test", nit: "901234561", digitoVerificacion: "1",
    tipoPersona: "juridica", regimenIva: "bimestral",
    obligacionesActivas: ["iva_bimestral"], email: "", telefono: "",
  };

  it("returns May 12 for IVA bimestral, NIT ending 1, on May 10", () => {
    const obligacion = calendario.obligaciones[0];
    const result = obtenerProximoVencimiento(cliente, obligacion, new Date(2026, 4, 10));
    expect(result?.fecha.toISOString().slice(0, 10)).toBe("2026-05-12");
  });

  it("returns May 26 for renta jurídica, NIT ending 0, on Jan 1", () => {
    const c0: Cliente = { ...cliente, nit: "9012345670" };
    const obligacion = calendario.obligaciones[1];
    const result = obtenerProximoVencimiento(c0, obligacion, new Date(2026, 0, 1));
    expect(result?.fecha.toISOString().slice(0, 10)).toBe("2026-05-26");
  });

  it("returns Sep 16 for renta natural, cédula ending 50, on Jan 1", () => {
    const c: Cliente = { ...cliente, nit: "1098765450", tipoPersona: "natural" };
    const obligacion = calendario.obligaciones[2];
    const result = obtenerProximoVencimiento(c, obligacion, new Date(2026, 0, 1));
    expect(result?.fecha.toISOString().slice(0, 10)).toBe("2026-09-16");
  });

  it("returns Oct 26 for renta natural, cédula ending 00, on Jan 1", () => {
    const c: Cliente = { ...cliente, nit: "1098700", tipoPersona: "natural" };
    const obligacion = calendario.obligaciones[2];
    const result = obtenerProximoVencimiento(c, obligacion, new Date(2026, 0, 1));
    expect(result?.fecha.toISOString().slice(0, 10)).toBe("2026-10-26");
  });

  it("returns null when no future vencimientos remain", () => {
    const obligacion = calendario.obligaciones[1]; // renta PJ has only May
    const result = obtenerProximoVencimiento(cliente, obligacion, new Date(2026, 11, 31));
    expect(result).toBeNull();
  });
});

describe("estadoSemaforo", () => {
  it("returns 'al_dia' for >15 days", () => {
    expect(estadoSemaforo(20)).toBe("al_dia");
  });

  it("returns 'proximo' for 6-15 days", () => {
    expect(estadoSemaforo(10)).toBe("proximo");
  });

  it("returns 'urgente' for 1-5 days", () => {
    expect(estadoSemaforo(3)).toBe("urgente");
  });

  it("returns 'vence_hoy' for 0 days", () => {
    expect(estadoSemaforo(0)).toBe("vence_hoy");
  });

  it("returns 'vencido' for negative", () => {
    expect(estadoSemaforo(-2)).toBe("vencido");
  });
});

describe("obtenerVencimientosFuturos", () => {
  const cliente: Cliente = {
    id: "test", nombre: "Test", nit: "901234561", digitoVerificacion: "1",
    tipoPersona: "juridica", regimenIva: "bimestral",
    obligacionesActivas: ["iva_bimestral", "renta_juridica"],
    email: "", telefono: "",
  };

  it("returns one vencimiento per active obligacion (the next one)", () => {
    const result = obtenerVencimientosFuturos(cliente, calendario, new Date(2026, 4, 10));
    expect(result).toHaveLength(2);
    expect(result.map(v => v.obligacionId).sort()).toEqual(["iva_bimestral", "renta_juridica"]);
  });

  it("ignores obligaciones not active for client", () => {
    const c: Cliente = { ...cliente, obligacionesActivas: ["iva_bimestral"] };
    const result = obtenerVencimientosFuturos(c, calendario, new Date(2026, 4, 10));
    expect(result).toHaveLength(1);
  });

  it("sorts results by closest fecha", () => {
    const result = obtenerVencimientosFuturos(cliente, calendario, new Date(2026, 4, 10));
    expect(result[0].diasFaltantes).toBeLessThanOrEqual(result[1].diasFaltantes);
  });
});
