// =========================================================================
// Rutas de Obras — Endpoints de la API REST
// =========================================================================

const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const upload = require("../middleware/upload");
const extractorTexto = require("../services/extractorTexto");
const blockchain = require("../services/blockchainService");
const ia = require("../services/iaService");
const storage = require("../services/storageService");

const DATA_DIR = path.resolve(__dirname, "..", "..", "data");
const OBRAS_FILE = path.join(DATA_DIR, "obras.json");
const VERSIONES_FILE = path.join(DATA_DIR, "versiones.json");

// Traducciones de mensajes internos del contrato → texto amigable y genérico
const TRADUCCIONES_CONTRATO = {
  "La obra ya esta congelada":
    "Este documento ya tiene un cambio pendiente de revisión. Aprueba o rechaza el cambio actual antes de verificar de nuevo.",
  "La obra no existe": "El documento no existe o no está registrado.",
  "La obra no esta congelada": "El documento no tiene cambios pendientes.",
  "Solo el administrador puede realizar esta accion":
    "Solo el administrador del documento puede realizar esta acción.",
  "Solo el registrador puede hacer esto":
    "Solo quien registró el documento puede realizar esta acción.",
  "Hash no puede estar vacio": "El hash del documento no puede estar vacío.",
};

// Utilidad para limpiar errores feos de ethers.js
function limpiarError(errorObj) {
  const msg = errorObj.message || errorObj.toString();

  // Extraer el mensaje legible del revert
  let mensajeLegible = null;
  const revertMatch = msg.match(/execution reverted: "([^"]+)"/);
  if (revertMatch) mensajeLegible = revertMatch[1];
  const reasonMatch = msg.match(/reason="([^"]+)"/);
  if (!mensajeLegible && reasonMatch) mensajeLegible = reasonMatch[1];

  if (mensajeLegible) {
    // Intentar traducir; si no hay traducción, devolver el mensaje legible igual
    return TRADUCCIONES_CONTRATO[mensajeLegible] || mensajeLegible;
  }

  return msg;
}


// =========================================================================
// DELETE /api/obras/reset-demo — Limpiar datos locales de demo
// =========================================================================
// SOLO disponible en modo desarrollo (NODE_ENV !== 'production')
// NO toca blockchain on-chain, claves privadas ni configuración.
router.delete("/reset-demo", (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({ error: "Endpoint solo disponible en desarrollo" });
  }

  try {
    let obrasEliminadas = 0;
    if (fs.existsSync(OBRAS_FILE)) {
      const contenido = JSON.parse(fs.readFileSync(OBRAS_FILE, "utf-8"));
      obrasEliminadas = Array.isArray(contenido) ? contenido.length : 0;
      fs.writeFileSync(OBRAS_FILE, JSON.stringify([], null, 2));
    }

    if (fs.existsSync(VERSIONES_FILE)) {
      fs.writeFileSync(VERSIONES_FILE, JSON.stringify({}, null, 2));
    }

    console.log(`🧹 [reset-demo] obras.json limpiado (${obrasEliminadas} obra(s) demo eliminadas)`);
    console.log("🧹 [reset-demo] versiones.json limpiado");

    res.json({
      mensaje: "Datos de demo eliminados exitosamente",
      obrasEliminadas,
      aviso: "Las obras on-chain en HSK Testnet son inmutables y NO fueron afectadas",
    });
  } catch (err) {
    console.error("❌ Error al limpiar datos de demo:", err.message);
    res.status(500).json({ error: err.message });
  }
});


// =========================================================================
// POST /api/obras — Registrar una nueva obra con su contrato (.pdf, .docx, .xlsx, .txt)
// =========================================================================
router.post("/", upload.single("archivo"), async (req, res) => {
  try {
    // --- Validaciones ---
    if (!req.file) {
      return res.status(400).json({ error: "Se requiere un archivo (.pdf, .docx, .xlsx, .txt)" });
    }

    const { nombre, descripcion } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: "El campo 'nombre' es obligatorio" });
    }

    const desc = descripcion || "";

    // --- 1. Procesar archivo: hash SHA-256 del buffer completo + texto plano ---
    const { texto, hash, formato } = await extractorTexto.procesarArchivo(
      req.file.buffer,
      req.file.originalname
    );

    console.log(`📄 Procesando archivo [${formato}]: ${req.file.originalname}`);

    if (!texto || texto.trim().length === 0) {
      return res.status(400).json({
        error: "No se pudo extraer texto del documento. Verifica que el archivo contenga texto legible.",
      });
    }

    console.log(`   ✅ Hash SHA-256 (buffer completo): 0x${hash}`);
    console.log(`   📖 Formato: ${formato} | Caracteres extraídos: ${texto.length}`);

    // --- 2. Registrar en blockchain (con fallback a modo demo local) ---
    let idObra;
    let txHash;
    let modo = "blockchain";

    if (blockchain.estaListoParaEscritura()) {
      console.log("🔗 Enviando transacción a HSK Chain...");
      const resultadoBC = await blockchain.registrarObra(nombre.trim(), desc, hash);
      idObra = resultadoBC.idObra;
      txHash = resultadoBC.txHash;
      storage.guardarVersion(idObra, hash, texto);
      console.log(`   ✅ Obra #${idObra} registrada on-chain. TX: ${txHash}`);
    } else {
      console.log("ℹ️  Blockchain no configurada en .env — Registrando en Modo Demostración Local.");
      const resultadoLocal = storage.guardarObraLocal(nombre.trim(), desc, hash, texto);
      idObra = resultadoLocal.id;
      txHash = resultadoLocal.txHash;
      modo = "demo_local";
      console.log(`   ✅ Obra #${idObra} registrada en almacenamiento local. TX simulada: ${txHash}`);
    }

    // --- Respuesta ---
    res.status(201).json({
      mensaje: modo === "blockchain" ? "Obra registrada en Blockchain exitosamente" : "Obra registrada en Modo Demo Local",
      idObra,
      hash: `0x${hash}`,
      txHash,
      formato,
      modo,
    });
  } catch (error) {
    console.error("❌ Error al registrar obra:", error.message);
    res.status(500).json({ error: limpiarError(error) });
  }
});

// =========================================================================
// POST /api/obras/:id/verificar — Verificar nueva versión de un contrato
// =========================================================================
router.post("/:id/verificar", upload.single("archivo"), async (req, res) => {
  try {
    const idObra = parseInt(req.params.id, 10);

    if (!req.file) {
      return res.status(400).json({ error: "Se requiere un archivo (.pdf, .docx, .xlsx, .txt)" });
    }

    if (isNaN(idObra) || idObra <= 0) {
      return res.status(400).json({ error: "ID de obra inválido" });
    }

    // --- 1. Procesar el nuevo archivo: hash sobre buffer completo + texto ---
    const { texto: textoNuevo, hash: hashNuevo, formato } = await extractorTexto.procesarArchivo(
      req.file.buffer,
      req.file.originalname
    );

    console.log(`🔍 Verificando obra #${idObra} con archivo [${formato}]: ${req.file.originalname}...`);

    // --- 2. Obtener hash aprobado ---
    let hashAprobado = "";
    if (blockchain.estaConectado()) {
      const hashAprobadoBytes32 = await blockchain.obtenerHashAprobado(idObra);
      hashAprobado = hashAprobadoBytes32.replace("0x", "");
    } else {
      const obraLocal = storage.obtenerObraLocal(idObra);
      if (!obraLocal) return res.status(404).json({ error: "Obra no encontrada" });
      hashAprobado = obraLocal.hashAprobado.replace("0x", "");
    }

    console.log(`   📋 Hash aprobado: 0x${hashAprobado}`);
    console.log(`   📄 Hash nuevo:    0x${hashNuevo}`);

    // --- 3. Comparar hashes ---
    if (hashNuevo.toLowerCase() === hashAprobado.toLowerCase()) {
      console.log("   ✅ Documento sin cambios (hashes idénticos)");
      return res.json({
        modificado: false,
        hash: `0x${hashNuevo}`,
        formato,
        mensaje: "El documento es íntegro y coincide con la versión registrada.",
      });
    }

    // --- 4. Hashes DIFERENTES: verificar si ya está congelada ---
    let yaCongelada = false;
    let txHash = "";

    if (blockchain.estaConectado()) {
      try {
        const obraBC = await blockchain.obtenerObra(idObra);
        yaCongelada = obraBC?.congelada === true;
      } catch (_) { /* si falla la consulta, asumimos no congelada */ }
    } else {
      const obraLocal = storage.obtenerObraLocal(idObra);
      yaCongelada = obraLocal?.congelada === true;
    }

    if (!yaCongelada) {
      // Primera detección: congelar preventivamente
      console.log("   🚨 CAMBIO DETECTADO — Congelando obra preventivamente...");
      if (blockchain.estaListoParaEscritura()) {
        const resBC = await blockchain.reportarCambio(idObra, hashNuevo);
        txHash = resBC.txHash;
      } else {
        const resLocal = storage.reportarCambioLocal(idObra, hashNuevo);
        txHash = resLocal.txHash;
      }
      console.log(`   ❄️  Obra #${idObra} CONGELADA.`);
    } else {
      console.log("   ℹ️  Obra ya estaba congelada — re-analizando sin re-congelar.");
      txHash = "";
    }

    // --- 5. Comparar textos con IA o diff local ---
    console.log("   🤖 Analizando cambios...");
    const textoAnterior = storage.obtenerUltimoTexto(idObra);
    let reporte = null;

    if (textoAnterior) {
      reporte = await ia.compararDocumentos(textoAnterior, textoNuevo);
      console.log(`   📊 Riesgo general: ${reporte.riesgoGeneral} (analizado por: ${reporte.analizadoPor || "desconocido"})`);
    } else {
      console.warn("   ⚠️  No hay texto anterior guardado para comparar.");
    }

    // --- 6. Guardar nueva versión localmente ---
    storage.guardarVersion(idObra, hashNuevo, textoNuevo, reporte);

    // --- Respuesta ---
    res.json({
      modificado: true,
      congelada: true,
      hashAnterior: `0x${hashAprobado}`,
      hashNuevo: `0x${hashNuevo}`,
      formato,
      reporte,
      txHash,
    });

  } catch (error) {
    console.error("❌ Error al verificar obra:", error.message);
    res.status(500).json({ error: limpiarError(error) });
  }
});

// =========================================================================
// POST /api/obras/:id/aprobar — Aprobar un cambio de contrato
// =========================================================================
router.post("/:id/aprobar", async (req, res) => {
  try {
    const idObra = parseInt(req.params.id, 10);
    const { hash } = req.body;

    if (isNaN(idObra) || idObra <= 0) {
      return res.status(400).json({ error: "ID de obra inválido" });
    }

    if (!hash) {
      return res.status(400).json({ error: "Se requiere el hash del documento a aprobar" });
    }

    console.log(`✅ Aprobando cambio en obra #${idObra}...`);
    let txHash = "";

    if (blockchain.estaListoParaEscritura()) {
      const resBC = await blockchain.aprobarCambio(idObra, hash);
      txHash = resBC.txHash;
    } else {
      const resLocal = storage.aprobarCambioLocal(idObra, hash);
      txHash = resLocal.txHash;
    }
    console.log(`   🔓 Obra descongelada. TX: ${txHash}`);

    res.json({
      mensaje: "Cambio aprobado exitosamente",
      idObra,
      hash,
      congelada: false,
      txHash,
    });
  } catch (error) {
    console.error("❌ Error al aprobar cambio:", error.message);
    res.status(500).json({ error: limpiarError(error) });
  }
});

// =========================================================================
// POST /api/obras/:id/rechazar — Rechazar un cambio de contrato
// =========================================================================
router.post("/:id/rechazar", async (req, res) => {
  try {
    const idObra = parseInt(req.params.id, 10);

    if (isNaN(idObra) || idObra <= 0) {
      return res.status(400).json({ error: "ID de obra inválido" });
    }

    console.log(`❌ Rechazando cambio en obra #${idObra}...`);
    let txHash = "";

    if (blockchain.estaListoParaEscritura()) {
      const resBC = await blockchain.rechazarCambio(idObra);
      txHash = resBC.txHash;
    } else {
      const resLocal = storage.rechazarCambioLocal(idObra);
      txHash = resLocal.txHash;
    }
    console.log(`   🔒 Obra sigue congelada. TX: ${txHash}`);

    res.json({
      mensaje: "Cambio rechazado",
      idObra,
      congelada: true,
      txHash,
    });
  } catch (error) {
    console.error("❌ Error al rechazar cambio:", error.message);
    res.status(500).json({ error: limpiarError(error) });
  }
});

// =========================================================================
// GET /api/obras — Listar todas las obras con su estado actual
// =========================================================================
router.get("/", async (req, res) => {
  try {
    let obras = [];

    if (blockchain.estaConectado()) {
      obras = await blockchain.listarObras();
    } else {
      obras = storage.listarObrasLocales();
    }

    // Enriquecer con datos locales (IA extraída)
    const obrasEnriquecidas = obras.map((obra) => {
      const versionesLocales = storage.obtenerVersionesLocales(obra.id);
      const ultimaVersion = versionesLocales[versionesLocales.length - 1];

      return {
        ...obra,
        datosContrato: ultimaVersion?.datosIA || null,
      };
    });

    res.json({
      total: obrasEnriquecidas.length,
      obras: obrasEnriquecidas,
      modo: blockchain.getModo(),
    });
  } catch (error) {
    console.error("❌ Error al listar obras:", error.message);
    res.status(500).json({ error: limpiarError(error) });
  }
});

// =========================================================================
// GET /api/obras/:id — Detalle de una obra con historial completo
// =========================================================================
router.get("/:id", async (req, res) => {
  try {
    const idObra = parseInt(req.params.id, 10);

    if (isNaN(idObra) || idObra <= 0) {
      return res.status(400).json({ error: "ID de obra inválido" });
    }

    let obra = null;
    let versiones = [];

    if (blockchain.estaConectado()) {
      obra = await blockchain.obtenerObra(idObra);
      const versionesBlockchain = await blockchain.obtenerVersiones(idObra);
      const versionesLocales = storage.obtenerVersionesLocales(idObra);

      versiones = versionesBlockchain.map((vbc) => {
        const vLocal = versionesLocales.find(
          (vl) => `0x${vl.hash}` === vbc.hash || vl.hash === vbc.hash.replace("0x", "")
        );
        return {
          ...vbc,
          datosIA: vLocal?.datosIA || null,
          fechaLocal: vLocal?.fechaLocal || null,
        };
      });
    } else {
      obra = storage.obtenerObraLocal(idObra);
      if (!obra) return res.status(404).json({ error: "Obra no encontrada" });
      versiones = obra.versiones || [];
    }

    res.json({
      ...obra,
      versiones,
      modo: blockchain.getModo(),
    });
  } catch (error) {
    console.error("❌ Error al obtener obra:", error.message);
    res.status(500).json({ error: limpiarError(error) });
  }
});

module.exports = router;
