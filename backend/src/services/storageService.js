// =========================================================================
// Servicio de Almacenamiento Local — Persistencia y Modo Simulado
// =========================================================================
// Guarda datos en JSON local para:
// 1. Comparar versiones de texto PDF
// 2. Modo Demostración/Simulado cuando el contrato blockchain aún no está desplegado

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DATA_DIR = path.join(__dirname, "..", "..", "data");
const VERSIONES_FILE = path.join(DATA_DIR, "versiones.json");
const OBRAS_FILE = path.join(DATA_DIR, "obras.json");

/**
 * Asegura que el directorio data/ y los archivos de persistencia existan.
 */
function inicializar() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(VERSIONES_FILE)) {
    fs.writeFileSync(VERSIONES_FILE, JSON.stringify({}, null, 2));
  }
  if (!fs.existsSync(OBRAS_FILE)) {
    fs.writeFileSync(OBRAS_FILE, JSON.stringify([], null, 2));
  }
}

function leerVersiones() {
  inicializar();
  return JSON.parse(fs.readFileSync(VERSIONES_FILE, "utf-8"));
}

function leerObras() {
  inicializar();
  return JSON.parse(fs.readFileSync(OBRAS_FILE, "utf-8"));
}

function escribirObras(obras) {
  inicializar();
  fs.writeFileSync(OBRAS_FILE, JSON.stringify(obras, null, 2));
}

/**
 * Guarda el texto de una versión de una obra.
 */
function guardarVersion(idObra, hash, texto, datosIA = null) {
  const data = leerVersiones();
  const key = String(idObra);

  if (!data[key]) {
    data[key] = { versiones: [] };
  }

  data[key].versiones.push({
    hash,
    texto,
    datosIA,
    fechaLocal: new Date().toISOString(),
  });

  fs.writeFileSync(VERSIONES_FILE, JSON.stringify(data, null, 2));
}

/**
 * Obtiene el texto de la última versión guardada de una obra.
 */
function obtenerUltimoTexto(idObra) {
  const data = leerVersiones();
  const key = String(idObra);

  if (!data[key] || data[key].versiones.length === 0) {
    return null;
  }

  const versiones = data[key].versiones;
  return versiones[versiones.length - 1].texto;
}

/**
 * Obtiene todas las versiones locales de una obra.
 */
function obtenerVersionesLocales(idObra) {
  const data = leerVersiones();
  const key = String(idObra);
  return data[key]?.versiones || [];
}

// ---------------------------------------------------------------------------
// Funciones del Modo Demostración Local (cuando no hay contrato desplegado)
// ---------------------------------------------------------------------------

function guardarObraLocal(nombre, descripcion, hash, texto, datosIA, adminAddress = null) {
  const obras = leerObras();
  const id = obras.length + 1;
  const txHash = "0x" + crypto.randomBytes(32).toString("hex");
  // Usar ADMIN_ADDRESS del .env si está configurada, si no el parámetro, si no placeholder
  const admin = adminAddress
    || process.env.ADMIN_ADDRESS
    || "0x9876543210987654321098765432109876543210";
  const hashBytes32 = hash.startsWith("0x") ? hash : `0x${hash}`;

  const nuevaObra = {
    id,
    nombre,
    descripcion,
    congelada: false,
    administrador: admin,
    totalVersiones: 1,
    hashAprobado: hashBytes32,
    txHash,
    esSimulado: true,
    versiones: [
      {
        hash: hashBytes32,
        timestamp: Math.floor(Date.now() / 1000),
        fecha: new Date().toISOString(),
        estado: "APROBADA",
        estadoCodigo: 1,
        revisor: admin,
      },
    ],
  };

  obras.push(nuevaObra);
  escribirObras(obras);
  guardarVersion(id, hash, texto, datosIA);

  return { id, txHash };
}

function listarObrasLocales() {
  return leerObras();
}

function obtenerObraLocal(idObra) {
  const obras = leerObras();
  return obras.find((o) => Number(o.id) === Number(idObra)) || null;
}

function reportarCambioLocal(idObra, hashNuevo) {
  const obras = leerObras();
  const obra = obras.find((o) => Number(o.id) === Number(idObra));
  if (!obra) throw new Error("Obra no encontrada");

  obra.congelada = true;
  const hashBytes32 = hashNuevo.startsWith("0x") ? hashNuevo : `0x${hashNuevo}`;

  obra.versiones.push({
    hash: hashBytes32,
    timestamp: Math.floor(Date.now() / 1000),
    fecha: new Date().toISOString(),
    estado: "PENDIENTE",
    estadoCodigo: 0,
    revisor: "0x0000000000000000000000000000000000000000",
  });
  obra.totalVersiones = obra.versiones.length;

  escribirObras(obras);
  return { txHash: "0x" + crypto.randomBytes(32).toString("hex"), congelada: true };
}

function aprobarCambioLocal(idObra, hashAprobado, revisor = null) {
  const obras = leerObras();
  const obra = obras.find((o) => Number(o.id) === Number(idObra));
  if (!obra) throw new Error("Obra no encontrada");

  obra.congelada = false;
  const hashBytes32 = hashAprobado.startsWith("0x") ? hashAprobado : `0x${hashAprobado}`;
  obra.hashAprobado = hashBytes32;

  const ultima = obra.versiones[obra.versiones.length - 1];
  if (ultima) {
    ultima.estado = "APROBADA";
    ultima.estadoCodigo = 1;
    ultima.revisor = revisor || obra.administrador;
  }

  escribirObras(obras);
  return { txHash: "0x" + crypto.randomBytes(32).toString("hex") };
}

function rechazarCambioLocal(idObra, revisor = null) {
  const obras = leerObras();
  const obra = obras.find((o) => Number(o.id) === Number(idObra));
  if (!obra) throw new Error("Obra no encontrada");

  obra.congelada = true;
  const ultima = obra.versiones[obra.versiones.length - 1];
  if (ultima) {
    ultima.estado = "RECHAZADA";
    ultima.estadoCodigo = 2;
    ultima.revisor = revisor || obra.administrador;
  }

  escribirObras(obras);
  return { txHash: "0x" + crypto.randomBytes(32).toString("hex") };
}

module.exports = {
  inicializar,
  guardarVersion,
  obtenerUltimoTexto,
  obtenerVersionesLocales,
  guardarObraLocal,
  listarObrasLocales,
  obtenerObraLocal,
  reportarCambioLocal,
  aprobarCambioLocal,
  rechazarCambioLocal,
};
