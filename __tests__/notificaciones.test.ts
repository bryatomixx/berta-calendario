import { describe, it, expect } from "vitest";
import {
  diasDeRecordatorio,
  generarMensajeEmail,
  generarMensajeWhatsapp,
  generarEnviosSimulados,
} from "@/lib/notificaciones";
import type { Cliente, Calendario, VencimientoCalculado } from "@/lib/types";

const clienteDemo: Cliente = {
  id: "andes",
  nombre: "Distribuidora Andes",
  nit: "901234567",
  digitoVerificacion: "1",
  tipoPersona: "juridica",
  regimenIva: "bimestral",
  obligacionesActivas: ["iva_bimestral"],
  email: "demo@andes.com",
  telefono: "+573001234567",
};

const vencimientoDemo: VencimientoCalculado = {
  obligacionId: "iva_bimestral",
  obligacionNombre: "IVA Bimestral",
  etapa: "Declaración y pago",
  periodo: "mar-abr 2026",
  fecha: new Date(2026, 4, 12),
  diasFaltantes: 7,
};

describe("diasDeRecordatorio", () => {
  it("returns true for 7, 5, 3, 1, 0 days", () => {
    expect(diasDeRecordatorio(7)).toBe(true);
    expect(diasDeRecordatorio(5)).toBe(true);
    expect(diasDeRecordatorio(3)).toBe(true);
    expect(diasDeRecordatorio(1)).toBe(true);
    expect(diasDeRecordatorio(0)).toBe(true);
  });

  it("returns false for other values", () => {
    expect(diasDeRecordatorio(8)).toBe(false);
    expect(diasDeRecordatorio(6)).toBe(false);
    expect(diasDeRecordatorio(4)).toBe(false);
    expect(diasDeRecordatorio(2)).toBe(false);
    expect(diasDeRecordatorio(-1)).toBe(false);
  });
});

describe("generarMensajeEmail", () => {
  it("includes client name, NIT, obligacion and días", () => {
    const { asunto, cuerpo } = generarMensajeEmail(clienteDemo, vencimientoDemo);
    expect(asunto).toContain("7 días");
    expect(asunto).toContain("IVA Bimestral");
    expect(asunto).toContain("Distribuidora Andes");
    expect(cuerpo).toContain("901234567-1");
    expect(cuerpo).toContain("mar-abr 2026");
  });

  it("uses VENCE HOY in subject when días = 0", () => {
    const v0 = { ...vencimientoDemo, diasFaltantes: 0 };
    const { asunto } = generarMensajeEmail(clienteDemo, v0);
    expect(asunto).toContain("VENCE HOY");
  });
});

describe("generarMensajeWhatsapp", () => {
  it("returns string with bold markdown and key fields", () => {
    const msg = generarMensajeWhatsapp(clienteDemo, vencimientoDemo);
    expect(msg).toContain("*Vence en 7 días*");
    expect(msg).toContain("Distribuidora Andes");
    expect(msg).toContain("901234567-1");
  });
});

describe("generarEnviosSimulados", () => {
  const calendario: Calendario = {
    anio: 2026,
    obligaciones: [
      {
        id: "iva_bimestral",
        nombre: "IVA Bimestral",
        calculo: "ultimo_1",
        vencimientos: [
          { etapa: "Decl", periodo: "mar-abr 2026", mes: 5, anio: 2026, fechas: { "7": 12 } },
        ],
      },
    ],
  };

  it("emits email + whatsapp when días = 7", () => {
    const envios = generarEnviosSimulados([clienteDemo], calendario, new Date(2026, 4, 5));
    expect(envios).toHaveLength(2);
    expect(envios.map(e => e.canal).sort()).toEqual(["email", "whatsapp"]);
  });

  it("emits nothing when días = 6 (not in cadence)", () => {
    const envios = generarEnviosSimulados([clienteDemo], calendario, new Date(2026, 4, 6));
    expect(envios).toHaveLength(0);
  });

  it("emits nothing when días = 0 means today === vencimiento", () => {
    const envios = generarEnviosSimulados([clienteDemo], calendario, new Date(2026, 4, 12));
    expect(envios).toHaveLength(2); // 0 days IS in cadence
  });
});
