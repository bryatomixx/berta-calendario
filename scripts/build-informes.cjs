/**
 * Conversor de los Excel del cliente -> JSON de informes de la app.
 *
 * Uso:
 *   node scripts/build-informes.cjs ["carpeta de los Excel"]
 *
 * Por defecto lee de la carpeta Downloads del usuario. Escribe en data/informes/.
 * Los numeros NUNCA se transcriben a mano: se leen de la celda y se redondean al
 * peso. Si un Excel cambia de estructura el script avisa en vez de inventar.
 *
 * Requiere SheetJS. Se resuelve desde node_modules o, si no esta instalado, de
 * otro proyecto del workspace que ya lo tenga.
 */
const fs = require('fs');
const path = require('path');

function cargarXLSX() {
  const candidatos = [
    'xlsx',
    'C:\\Users\\ADMIN\\New Project\\negocio-capital-crm\\node_modules\\xlsx',
  ];
  for (const c of candidatos) {
    try { return require(c); } catch { /* siguiente */ }
  }
  console.error('No se encontro SheetJS. Instalalo con: npm i -D xlsx');
  process.exit(1);
}
const XLSX = cargarXLSX();

const SRC = process.argv[2] || 'C:\\Users\\ADMIN\\Downloads';
const OUT = path.join(__dirname, '..', 'data', 'informes');

/* ---------------------------------------------------------------- helpers */

/** Lee una hoja como matriz. sheetRows acota el rango por si viene inflado. */
function hoja(archivo, nombreHoja) {
  const full = path.join(SRC, archivo);
  if (!fs.existsSync(full)) {
    console.error(`FALTA el archivo: ${full}`);
    process.exit(1);
  }
  const wb = XLSX.readFile(full, { sheetRows: 200 });
  const ws = nombreHoja ? wb.Sheets[nombreHoja] : wb.Sheets[wb.SheetNames[0]];
  if (!ws) {
    console.error(`El archivo ${archivo} no tiene la hoja "${nombreHoja}". Hojas: ${wb.SheetNames.join(', ')}`);
    process.exit(1);
  }
  return XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false, defval: null, raw: true });
}

const norm = (v) =>
  String(v ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

/** Busca la fila cuya celda `col` empieza por `etiqueta`. Falla ruidoso. */
function fila(rows, etiqueta, col = 0, { obligatoria = true } = {}) {
  const key = norm(etiqueta);
  const r = rows.find((row) => norm(row?.[col]).startsWith(key));
  if (!r && obligatoria) {
    console.error(`No encontre la fila "${etiqueta}" (columna ${col}). Reviso si el Excel cambio de forma.`);
    process.exit(1);
  }
  return r || null;
}

/** Numero al peso; celdas vacias -> null. */
const num = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : Number(String(v).replace(/[^\d.,-]/g, '').replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? Math.round(n) : null;
};

/** Participacion del Excel (0.95) -> fraccion. Sin inventar si viene vacia. */
const pct = (v) => (typeof v === 'number' ? Math.round(v * 10000) / 10000 : null);

const escribir = (nombre, obj) => {
  fs.mkdirSync(OUT, { recursive: true });
  const dest = path.join(OUT, nombre);
  fs.writeFileSync(dest, JSON.stringify(obj, null, 2) + '\n', 'utf8');
  console.log('  escrito', path.relative(path.join(__dirname, '..'), dest));
};

/* ================================================================
   1. ESPACIO CONSCIENTE ECO SAS  (informe mensual, ene-jun 2026)
   ================================================================ */

const F_CAJA = 'CONS CAJA Y BANCO INGRESOS - EGRESOS (1).xlsx';
const F_VISION = 'ERI POR VISION (1).xlsx';
const F_MENSUAL = 'ERI MENSUAL (2).xlsx';
const F_FISCAL = 'ERI FISCAL.xlsx';
const F_FISCAL_HIST = 'ERI FISCAL Historico.xlsx';
const F_EEFF = 'EEFF DEFINITIVO ADTIVO JUN 2026 -INTERMEDIOS (2).xls';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio'];

function construirECO() {
  console.log('\nESPACIO CONSCIENTE ECO SAS');

  /* --- Caja y bancos: col 1 = concepto, col 2 = saldo anterior, 3..8 meses --- */
  const caja = hoja(F_CAJA);
  const flujo = (etiqueta, conSaldoAnterior) => {
    const r = fila(caja, etiqueta, 1);
    return {
      saldoAnterior: conSaldoAnterior ? num(r[2]) : null,
      meses: MESES.map((_, i) => num(r[3 + i])),
      total: num(r[9]),
      acumulado: num(r[10]),
    };
  };
  // Las dos secciones (CAJA / BANCO) repiten las etiquetas INGRESOS y EGRESOS,
  // asi que se parten por el indice de la fila que marca cada bloque.
  const iBanco = caja.findIndex((r) => norm(r?.[0]) === 'banco');
  const bloque = (desde, hasta) => caja.slice(desde, hasta);
  const iCaja = caja.findIndex((r) => norm(r?.[0]) === 'caja');
  const filasCaja = bloque(iCaja, iBanco);
  const filasBanco = bloque(iBanco, caja.length);
  const flujoDe = (filas, etiqueta, conSaldoAnterior) => {
    const r = fila(filas, etiqueta, 1);
    return {
      saldoAnterior: conSaldoAnterior ? num(r[2]) : null,
      meses: MESES.map((_, i) => num(r[3 + i])),
      total: num(r[9]),
      acumulado: num(r[10]),
    };
  };
  void flujo;

  const cajaBancos = {
    caja: {
      ingresos: flujoDe(filasCaja, 'ingresos', true),
      egresos: flujoDe(filasCaja, 'egresos', false),
      saldo: flujoDe(filasCaja, 'saldo en caja', true),
    },
    banco: {
      ingresos: flujoDe(filasBanco, 'ingresos', true),
      egresos: flujoDe(filasBanco, 'egresos', false),
      saldo: flujoDe(filasBanco, 'saldo en banco', true),
    },
  };

  /* --- ERI mensual: col 0 concepto, 1..6 meses, 7 total, 8 participacion --- */
  const mensual = hoja(F_MENSUAL, 'POR MES');
  // Filas que son desglose de la linea inmediatamente superior.
  const DETALLE_MENSUAL = new Set(
    [
      'alquiler de salon', 'venta de sillas', 'reintegro latam', 'venta de aire acondicionado',
      'pago incapacidades', 'financieros', 'ajuste al peso',
      'administracion', 'ventas', 'gastos del 2025',
    ].map(norm),
  );
  const eriMensual = mensual
    .slice(2)
    .filter((r) => r && String(r[0] ?? '').trim() !== '')
    .map((r) => ({
      concepto: String(r[0]).trim(),
      nivel: DETALLE_MENSUAL.has(norm(r[0])) ? 1 : 0,
      valores: MESES.map((_, i) => num(r[1 + i])),
      total: num(r[7]),
      participacion: pct(r[8]),
    }));

  /* --- ERI por vision: col 0 concepto, 1..7 cohortes, 8 total, 9 part. --- */
  const vision = hoja(F_VISION, 'POR VISION');
  const encabezado = vision[1];
  const segmentos = encabezado.slice(1, 8).map((s) => String(s).trim());
  const eriVision = {
    segmentos,
    filas: vision
      .slice(2)
      .filter((r) => r && String(r[0] ?? '').trim() !== '')
      .map((r) => ({
        concepto: String(r[0]).trim(),
        valores: segmentos.map((_, i) => num(r[1 + i])),
        total: num(r[8]),
        participacion: pct(r[9]),
      })),
  };

  /* --- ERI fiscal (mismo layout que el mensual) --- */
  const fiscal = hoja(F_FISCAL);
  const DETALLE_FISCAL = new Set(['sueldos', 'prestaciones', 'seguridad social'].map(norm));
  const eriFiscal = {
    meses: MESES,
    filas: fiscal
      .slice(2)
      .filter((r) => r && String(r[0] ?? '').trim() !== '')
      .map((r) => ({
        concepto: String(r[0]).trim(),
        nivel: DETALLE_FISCAL.has(norm(r[0])) ? 1 : 0,
        valores: MESES.map((_, i) => num(r[1 + i])),
        total: num(r[7]),
        participacion: pct(r[8]),
      })),
  };

  /* --- ERI fiscal historico: columnas = anios --- */
  const hist = hoja(F_FISCAL_HIST);
  const periodos = hist[1].slice(1, 6).map((s) => String(s).trim());
  const DETALLE_HIST = new Set(['administracion', 'ventas', 'bancarios'].map(norm));
  const eriFiscalHistorico = {
    periodos,
    filas: hist
      .slice(2)
      .filter((r) => r && String(r[0] ?? '').trim() !== '')
      .map((r) => ({
        concepto: String(r[0]).trim(),
        nivel: DETALLE_HIST.has(norm(r[0])) ? 1 : 0,
        valores: periodos.map((_, i) => num(r[1 + i])),
        total: num(r[6]),
        participacion: pct(r[7]),
      })),
  };

  /* --- Balance (ESF Consorcio, corte jun-2026): label col 2, valor col 4 --- */
  const esf = hoja(F_EEFF, 'ESF Consorcio');
  const it = (etiqueta, col = 4) => {
    const r = fila(esf, etiqueta, 2);
    return { concepto: String(r[2]).trim(), valor: num(r[col]) };
  };
  // "Total Activo" y "Total Pasivo" chocan con "Total Activo corriente" /
  // "Total Pasivo Corriente" en el match laxo: se resuelven por igualdad exacta.
  const exacta = (etiqueta) => {
    const r = esf.find((row) => norm(row?.[2]) === norm(etiqueta));
    if (!r) { console.error(`No encontre la fila exacta "${etiqueta}" en ESF Consorcio.`); process.exit(1); }
    return { concepto: String(r[2]).trim(), valor: num(r[4]) };
  };

  const balance = {
    activoCorriente: ['Efectivo y equivalentes', 'Inversiones', 'Deudores comerciales'].map((e) => it(e)),
    totalActivoCorriente: it('Total Activo corriente'),
    activoNoCorriente: ['Propiedades, planta y equipo'].map((e) => it(e)),
    totalActivoNoCorriente: it('Total Activo no Corriente'),
    totalActivo: exacta('Total Activo'),
    pasivoCorriente: ['Acreedores comerciales', 'Ingresos recibidos por anticipado', 'Beneficios a empleados'].map((e) => it(e)),
    totalPasivoCorriente: it('Total Pasivo Corriente'),
    totalPasivoNoCorriente: it('Total Pasivo no Corriente'),
    totalPasivo: exacta('Total Pasivo'),
    patrimonio: ['Capital', 'Utilidades retenidas', 'Utilidad del ejercicio'].map((e) => it(e)),
    totalPatrimonio: it('Total Patrimonio'),
    totalPasivoPatrimonio: it('Total pasivo y patrimonio'),
  };

  /* --- Estado de resultados (ERI Consorcio): label col 4, valor col 6 --- */
  const eri = hoja(F_EEFF, 'ERI Consorcio');
  const linea = (etiqueta) => {
    const r = fila(eri, etiqueta, 4);
    return { concepto: String(r[4]).trim(), valor: num(r[6]) };
  };
  const resultados = {
    lineas: [
      linea('Servicios'),
      linea('Costo del servicios'),
      linea('Ganancia bruta'),
      linea('Total utilidad bruta en operaciones'),
      linea('Gastos ordinarios'),
      linea('Utilidad operacional'),
      linea('Otros ingresos'),
      linea('Utilidad Antes de Impuestos'),
      linea('Resultado del periodo'),
    ],
  };

  const informe = {
    clienteId: 'espacio-consciente-eco-sas',
    empresa: 'ESPACIO CONSCIENTE ECO SAS',
    tipo: 'mensual',
    periodo: 'Enero a junio de 2026',
    corte: '30 de junio de 2026',
    moneda: 'COP',
    meses: MESES,
    cajaBancos,
    eriMensual,
    eriVision,
    eriFiscal,
    eriFiscalHistorico,
    balance,
    resultados,
    fuentes: [
      { archivo: F_CAJA, hoja: 'Hoja1', seccion: 'Caja y bancos' },
      { archivo: F_MENSUAL, hoja: 'POR MES', seccion: 'ERI mensual' },
      { archivo: F_VISION, hoja: 'POR VISION', seccion: 'ERI por vision' },
      { archivo: F_FISCAL, hoja: 'Hoja1', seccion: 'ERI fiscal' },
      { archivo: F_FISCAL_HIST, hoja: 'Hoja1', seccion: 'ERI fiscal historico' },
      { archivo: F_EEFF, hoja: 'ESF Consorcio', seccion: 'Balance' },
      { archivo: F_EEFF, hoja: 'ERI Consorcio', seccion: 'Estado de resultados' },
    ],
  };

  escribir('espacio-consciente-eco-sas.json', informe);
  return informe;
}

/* ================================================================
   2. EARTH GREEN COLOMBIA SAS  (informe anual, 2022 vs 2021)
   ================================================================ */

function construirEarthGreen() {
  console.log('\nEARTH GREEN COLOMBIA SAS');
  const COLS = [4, 6]; // ESF V2: 2022 en col 4, 2021 en col 6
  const esf = hoja(F_EEFF, 'ESF V2');
  const it = (etiqueta) => {
    const r = fila(esf, etiqueta, 2);
    return { concepto: String(r[2]).trim(), valores: COLS.map((c) => num(r[c])) };
  };
  const exacta = (etiqueta) => {
    const r = esf.find((row) => norm(row?.[2]) === norm(etiqueta));
    if (!r) { console.error(`No encontre la fila exacta "${etiqueta}" en ESF V2.`); process.exit(1); }
    return { concepto: String(r[2]).trim(), valores: COLS.map((c) => num(r[c])) };
  };

  const balance = {
    activoCorriente: ['Efectivo y equivalentes', 'Inversiones', 'Deudores comerciales', 'Inventarios'].map(it),
    totalActivoCorriente: it('Total Activo corriente'),
    activoNoCorriente: ['Propiedades, planta y equipo', 'Impuesto diferido', 'Otros activos'].map(it),
    totalActivoNoCorriente: it('Total Activo no Corriente'),
    totalActivo: exacta('Total Activo'),
    pasivoCorriente: ['Obligaciones financieras y acreedores comerci', 'Impuestos, Gravamenes y Tasas', 'Beneficios a empleados'].map(it),
    totalPasivoCorriente: it('Total Pasivo Corriente'),
    pasivoNoCorriente: [],
    totalPasivoNoCorriente: it('Total Pasivo no Corriente'),
    totalPasivo: exacta('Total Pasivo'),
    patrimonio: ['Capital', 'Reservas', 'Utilidades retenidas', 'Ajustes por adopcion', 'Utilidad del ejercicio'].map(it),
    totalPatrimonio: it('Total Patrimonio'),
    totalPasivoPatrimonio: it('Total pasivo y patrimonio'),
  };
  // El pasivo no corriente vive entre "Pasivo no Corriente" y su total.
  {
    const desde = esf.findIndex((r) => norm(r?.[2]) === 'pasivo no corriente');
    const hasta = esf.findIndex((r) => norm(r?.[2]).startsWith('total pasivo no corriente'));
    balance.pasivoNoCorriente = esf
      .slice(desde + 1, hasta)
      .filter((r) => String(r?.[2] ?? '').trim() !== '')
      .map((r) => ({ concepto: String(r[2]).trim(), valores: COLS.map((c) => num(r[c])) }));
  }

  /* ERI V2: label col 4, 2022 col 6, 2021 col 8 */
  const eri = hoja(F_EEFF, 'ERI  V2');
  const COLS_ERI = [6, 8];
  const linea = (etiqueta, nivel = 0) => {
    const r = fila(eri, etiqueta, 4);
    return { concepto: String(r[4]).trim(), nivel, valores: COLS_ERI.map((c) => num(r[c])) };
  };
  const rango = (desde, hasta, nivel) => {
    const i = eri.findIndex((r) => norm(r?.[4]).startsWith(norm(desde)));
    const j = eri.findIndex((r) => norm(r?.[4]).startsWith(norm(hasta)));
    return eri
      .slice(i + 1, j)
      .filter((r) => String(r?.[4] ?? '').trim() !== '')
      .map((r) => ({ concepto: String(r[4]).trim(), nivel, valores: COLS_ERI.map((c) => num(r[c])) }));
  };

  const resultados = {
    columnas: ['2022', '2021'],
    filas: [
      linea('Industrias manufactureras'),
      linea('Costo de mercancia vendida'),
      linea('Ganancia bruta'),
      linea('Deterioro del valor de los activos'),
      linea('Total utilidad bruta en operaciones'),
      ...rango('Administracion', 'Total Gastos de Administracion', 1),
      linea('Total Gastos de Administracion'),
      ...rango('Ventas', 'Total gastos de Ventas', 1),
      linea('Total gastos de Ventas'),
      linea('Total gastos ordinarios'),
      linea('Utilidad operacional'),
      linea('Otros ingresos'),
      linea('Otros Egresos'),
      linea('Costos por prestamos'),
      linea('Utilidad Antes de Impuestos'),
      linea('Impuesto a las ganancias'),
      linea('Impuesto Diferido'),
      linea('Resultado del periodo'),
    ],
  };

  const informe = {
    clienteId: 'earth-green-colombia-sas',
    empresa: 'EARTH GREEN COLOMBIA SAS',
    tipo: 'anual',
    periodo: 'Ejercicio 2022 (comparativo 2021)',
    corte: '31 de diciembre de 2022',
    moneda: 'COP',
    columnas: ['2022', '2021'],
    balance,
    resultados,
    fuentes: [
      { archivo: F_EEFF, hoja: 'ESF V2', seccion: 'Balance' },
      { archivo: F_EEFF, hoja: 'ERI  V2', seccion: 'Estado de resultados' },
    ],
  };

  escribir('earth-green-colombia-sas.json', informe);
  return informe;
}

/* ------------------------------------------------------------- ejecucion */

const eco = construirECO();
const eg = construirEarthGreen();

/* Cuadres: si un total no cuadra con sus partes, se avisa (no se corrige solo) */
console.log('\nCuadres');
const chk = (etiqueta, a, b) => {
  const dif = Math.abs((a ?? 0) - (b ?? 0));
  console.log(`  ${dif <= 2 ? 'OK  ' : 'OJO '} ${etiqueta}: ${a} vs ${b}${dif > 2 ? ` (dif ${dif})` : ''}`);
};
chk(
  'ECO activo = pasivo + patrimonio',
  eco.balance.totalActivo.valor,
  (eco.balance.totalPasivo.valor ?? 0) + (eco.balance.totalPatrimonio.valor ?? 0),
);
chk(
  'ECO utilidad del ejercicio = resultado del periodo',
  eco.balance.patrimonio.find((p) => /utilidad del ejercicio/i.test(p.concepto))?.valor,
  eco.resultados.lineas.find((l) => /resultado del periodo/i.test(l.concepto))?.valor,
);
chk(
  'EG activo 2022 = pasivo + patrimonio 2022',
  eg.balance.totalActivo.valores[0],
  (eg.balance.totalPasivo.valores[0] ?? 0) + (eg.balance.totalPatrimonio.valores[0] ?? 0),
);
chk(
  'EG utilidad del ejercicio 2022 = resultado del periodo 2022',
  eg.balance.patrimonio.find((p) => /utilidad del ejercicio/i.test(p.concepto))?.valores[0],
  eg.resultados.filas.find((f) => /resultado del periodo/i.test(f.concepto))?.valores[0],
);
