import fs from "node:fs";

const CSV_PATH = "c:/Users/ADMIN/Downloads/Listado de clientes.xlsx - Listado de clientes.csv";
const OUT_PATH = "C:/Users/ADMIN/New Project/berta-contadora/data/clientes-demo.json";

const raw = fs.readFileSync(CSV_PATH, "utf8");
const lines = raw.split(/\r?\n/).slice(4).filter((l) => l.trim() !== "" && l.trim()[0] !== ",");

function slugify(s) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function calcDV(nit) {
  const digits = nit.split("").reverse();
  const weights = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
  let sum = 0;
  for (let i = 0; i < digits.length; i++) sum += parseInt(digits[i], 10) * weights[i];
  const r = sum % 11;
  return r < 2 ? String(r) : String(11 - r);
}

const CORP = /\b(S\.?A\.?S|LTDA|FUNDACION|COMERCIALIZADORA|INVERSIONES|INDUSTRIAS|RESTAURANTE|COMPANY|GROUP|HOLDINGS|MEGASTORE|MERKE\s*FARMA|JASADIM|LIXTON|ECONOMIC|ALCOHOLES|ELECTROGABINETES|MAXI\s*MASCOTAS|GRUPO|ALADO|INDISPROCO|GASUCOL|VISION\s*GROUPE|COMBY\s*POLLO|EARTH\s*GREEN|PARVERTIDOS|LOGROS|HOGAR\s*INFANTIL|HOME\s*OFFICE|420\s*LATAM|RENTALS|LATIN\s*PRIME|CASA\s*DEL\s*CAMINO|YEYITOS|GONZALEZ\s*HNOS|TAVERA\s*CARDENA|LLANERITO|EL\s*LLANERITO)\b/i;

const merged = new Map();

for (const line of lines) {
  const cols = line.split(",");
  if (cols.length < 19) continue;

  const docRaw = (cols[0] || "").trim();
  const tipoCsv = (cols[1] || "").trim();
  const nombre = (cols[2] || "").trim().replace(/\s+/g, " ");
  if (!docRaw || !nombre) continue;

  const nit = docRaw.replace(/\./g, "");
  if (!/^\d+$/.test(nit)) continue;

  let tipoPersona = tipoCsv === "NIT" ? "juridica" : "natural";
  if (CORP.test(nombre)) tipoPersona = "juridica";

  const has = (i) => /x/i.test(cols[i] || "");
  const obligations = new Set();
  if (has(5)) obligations.add("renta_juridica");
  if (has(6)) obligations.add("renta_natural");
  if (has(7)) obligations.add("rst_anticipo");
  if (has(8)) obligations.add("rst_consolidada");
  if (has(9)) obligations.add("rst_consolidada");
  if (has(10)) obligations.add("iva_bimestral");
  if (has(11)) obligations.add("iva_cuatrimestral");
  if (has(12)) obligations.add("consumo");

  let regimenIva = "no_aplica";
  if (has(10)) regimenIva = "bimestral";
  else if (has(11)) regimenIva = "cuatrimestral";

  const email = (cols[17] || "").trim();
  const phoneRaw = (cols[18] || "").trim().replace(/[^\d+]/g, "");
  let telefono = "";
  if (phoneRaw) {
    if (phoneRaw.startsWith("+")) telefono = phoneRaw;
    else if (phoneRaw.length === 10 && phoneRaw.startsWith("3")) telefono = "+57" + phoneRaw;
    else telefono = phoneRaw;
  }

  const existing = merged.get(nit);
  if (existing) {
    if (existing.nombre.length < nombre.length) existing.nombre = nombre;
    for (const o of obligations) existing.obligacionesActivas.add(o);
    if (existing.regimenIva === "no_aplica" && regimenIva !== "no_aplica") existing.regimenIva = regimenIva;
    if (!existing.email && email) existing.email = email;
    if (!existing.telefono && telefono) existing.telefono = telefono;
    if (existing.tipoPersona === "natural" && tipoPersona === "juridica") existing.tipoPersona = "juridica";
  } else {
    merged.set(nit, {
      _slug: slugify(nombre),
      nombre,
      nit,
      tipoPersona,
      regimenIva,
      obligacionesActivas: obligations,
      email,
      telefono,
    });
  }
}

const slugCount = new Map();
const out = [];
for (const c of merged.values()) {
  let id = c._slug;
  const seen = slugCount.get(c._slug) || 0;
  slugCount.set(c._slug, seen + 1);
  if (seen) id = `${id}-${seen + 1}`;

  out.push({
    id,
    nombre: c.nombre,
    nit: c.nit,
    digitoVerificacion: c.tipoPersona === "juridica" ? calcDV(c.nit) : "",
    tipoPersona: c.tipoPersona,
    regimenIva: c.regimenIva,
    obligacionesActivas: Array.from(c.obligacionesActivas),
    email: c.email,
    telefono: c.telefono,
  });
}

out.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2));

const stats = {
  total: out.length,
  juridicas: out.filter((c) => c.tipoPersona === "juridica").length,
  naturales: out.filter((c) => c.tipoPersona === "natural").length,
  conEmail: out.filter((c) => c.email).length,
  conTelefono: out.filter((c) => c.telefono).length,
  porObligacion: {},
};
for (const c of out) for (const o of c.obligacionesActivas) stats.porObligacion[o] = (stats.porObligacion[o] || 0) + 1;
console.log(JSON.stringify(stats, null, 2));
