// =========================================================================
// ObraClara AI — Backend API
// =========================================================================
// Servidor Express para gestión de contratos de obras públicas.
// Conecta: PDF processing ↔ IA (Gemini 2.0 Flash) ↔ Blockchain (HSK Chain)

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
require("dotenv").config(); // fallback to default if present
const express = require("express");
const cors = require("cors");

const blockchain = require("./services/blockchainService");
const storage = require("./services/storageService");
const ia = require("./services/iaService");

const app = express();
const PORT = process.env.PORT || 3001;

// =========================================================================
// Middleware global
// =========================================================================

// 1. CORS universal — Permite peticiones desde cualquier origen (localhost, 127.0.0.1, puerto 5173, etc.)
app.use(cors());

// 2. Logging de peticiones para diagnóstico en tiempo real
app.use((req, res, next) => {
  const start = Date.now();
  console.log(`\n➡️  [${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl} (Origin: ${req.headers.origin || "directo"})`);
  res.on("finish", () => {
    const duration = Date.now() - start;
    const statusIcon = res.statusCode < 400 ? "✅" : "❌";
    console.log(`⬅️  [${new Date().toLocaleTimeString()}] ${statusIcon} ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// 3. Parsear JSON en el body
app.use(express.json());

// =========================================================================
// Inicialización de servicios (con protecciones contra caídas)
// =========================================================================

try {
  blockchain.inicializar();
} catch (err) {
  console.error("⚠️  Error no fatal al inicializar blockchain:", err.message);
}

try {
  storage.inicializar();
} catch (err) {
  console.error("⚠️  Error no fatal al inicializar storage:", err.message);
}

// =========================================================================
// Rutas
// =========================================================================

// Montar rutas de obras
app.use("/api/obras", require("./routes/obras"));

// Modo de operación blockchain (para el frontend)
app.get("/api/modo", (_req, res) => {
  res.json(blockchain.getModo());
});

// Health check
app.get("/api/health", (_req, res) => {
  const modo = blockchain.getModo();
  res.json({
    status: "ok",
    service: "ObraClara AI — Backend API",
    port: PORT,
    timestamp: new Date().toISOString(),
    blockchain: {
      ...modo,
      conectado: blockchain.estaConectado(),
      listoParaEscritura: blockchain.estaListoParaEscritura(),
    },
    ia: {
      iaConfigurada: ia.estaIAConfigurada(),
      modelo: ia.estaIAConfigurada() ? "Groq (llama-3.3-70b-versatile)" : "Diff local (sin IA)",
    },
  });
});

// =========================================================================
// Manejo de errores global
// =========================================================================

// Ruta no encontrada
app.use((_req, res) => {
  res.status(404).json({
    error: "Endpoint no encontrado",
    endpoints: [
      "POST   /api/obras              — Registrar nueva obra (PDF + nombre + descripción)",
      "GET    /api/obras              — Listar todas las obras",
      "GET    /api/obras/:id          — Detalle de una obra con historial",
      "POST   /api/obras/:id/verificar — Verificar nueva versión de contrato",
      "POST   /api/obras/:id/aprobar   — Aprobar cambio (solo admin)",
      "POST   /api/obras/:id/rechazar  — Rechazar cambio (solo admin)",
      "GET    /api/health             — Estado del servidor",
    ],
  });
});

// Errores de Multer (archivo muy grande, tipo incorrecto, etc.)
app.use((err, _req, res, _next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      error: "El archivo excede el tamaño máximo permitido (10 MB)",
    });
  }

  if (err.message === "Solo se permiten archivos PDF") {
    return res.status(400).json({ error: err.message });
  }

  console.error("❌ Error no manejado:", err);
  res.status(500).json({
    error: "Error interno del servidor",
    detalle: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// =========================================================================
// Arrancar servidor
// =========================================================================

app.listen(PORT, () => {
  const modo = blockchain.getModo();

  console.log("\n=========================================");
  console.log("  🏗️  ObraClara AI — Backend API");
  console.log("=========================================");
  console.log(`  🚀 Servidor:       http://localhost:${PORT}`);
  console.log(`  📡 Health Check:   http://localhost:${PORT}/api/health`);
  console.log(`  🌐 CORS:           Habilitado universalmente ✅`);

  if (modo.modo === "blockchain_real") {
    console.log(`  ⛓️  Modo:           BLOCKCHAIN REAL (HSK Testnet) ✅`);
    console.log(`  🔗 RPC:            ${modo.rpc}`);
    console.log(`  📋 Contrato:       ${modo.contrato}`);
    console.log(`  🔍 Explorer:       ${modo.explorer}`);
    console.log(`  🔑 Escritura:      ${modo.escritura ? "Wallet conectada ✅" : "Solo lectura ⚠️"}`);
  } else {
    console.log(`  💾 Modo:           DEMO LOCAL (sin contrato desplegado)`);
    console.log(`  ℹ️  Para usar blockchain real, configura CONTRACT_ADDRESS y PRIVATE_KEY en .env`);
  }

  console.log(`  🤖 Servicio IA:    ${ia.estaIAConfigurada() ? "IA REAL (Groq • openai/gpt-oss-120b) ✅" : "IA simulada (diff local, modo demo) ℹ️"}`);
  console.log("=========================================\n");
}).setTimeout(180_000); // 3 min: transacciones blockchain pueden tardar hasta 90s en HSK Testnet
