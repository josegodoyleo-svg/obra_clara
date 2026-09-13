#!/usr/bin/env node
// =========================================================================
// ObraClara AI — Script de Reset de Datos Demo
// =========================================================================
// Uso: node backend/scripts/reset-demo-data.js
//
// Qué hace:
//   1. Limpia backend/data/obras.json  → []
//   2. Limpia backend/data/versiones.json → {}
//   3. Imprime las claves de localStorage a limpiar desde DevTools
//   4. NO toca: .env, claves privadas, blockchain, contrato on-chain
//
// NOTA: Las obras on-chain en HSK Testnet son INMUTABLES por diseño.
//       Este script solo limpia el almacenamiento LOCAL del modo demo.

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.resolve(__dirname, "..", "data");
const OBRAS_FILE = path.join(DATA_DIR, "obras.json");
const VERSIONES_FILE = path.join(DATA_DIR, "versiones.json");

console.log("\n=========================================");
console.log("  🧹  ObraClara AI — Reset Demo Data");
console.log("=========================================\n");

// ── 1. Limpiar obras.json ─────────────────────────────────────────────────
let obrasAntes = 0;
if (fs.existsSync(OBRAS_FILE)) {
  try {
    const contenido = JSON.parse(fs.readFileSync(OBRAS_FILE, "utf-8"));
    obrasAntes = Array.isArray(contenido) ? contenido.length : 0;
  } catch { obrasAntes = 0; }
  fs.writeFileSync(OBRAS_FILE, JSON.stringify([], null, 2));
  console.log(`✅ obras.json limpiado (${obrasAntes} obra(s) eliminada(s))`);
} else {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(OBRAS_FILE, JSON.stringify([], null, 2));
  console.log("✅ obras.json creado vacío (no existía)");
}

// ── 2. Limpiar versiones.json ─────────────────────────────────────────────
let versionesAntes = 0;
if (fs.existsSync(VERSIONES_FILE)) {
  try {
    const contenido = JSON.parse(fs.readFileSync(VERSIONES_FILE, "utf-8"));
    versionesAntes = Object.keys(contenido).length;
  } catch { versionesAntes = 0; }
  fs.writeFileSync(VERSIONES_FILE, JSON.stringify({}, null, 2));
  console.log(`✅ versiones.json limpiado (${versionesAntes} obra(s) con historial eliminados)`);
} else {
  fs.writeFileSync(VERSIONES_FILE, JSON.stringify({}, null, 2));
  console.log("✅ versiones.json creado vacío (no existía)");
}

// ── 3. localStorage del frontend ──────────────────────────────────────────
console.log("\n─────────────────────────────────────────");
console.log("📋 localStorage del Frontend");
console.log("─────────────────────────────────────────");
console.log("El frontend NO usa localStorage para obras.");
console.log("Todo viene del backend vía API.");
console.log("\nSi quieres limpiar caché, pega en DevTools (F12 → Console):");
console.log("  localStorage.clear();");

// ── 4. Aviso importante sobre modo blockchain real ────────────────────────
console.log("\n─────────────────────────────────────────");
console.log("⛓️  AVISO IMPORTANTE — Modo Blockchain Real");
console.log("─────────────────────────────────────────");
console.log("Tu .env tiene CONTRACT_ADDRESS configurado.");
console.log("Cuando el backend está en modo 'blockchain_real', las obras");
console.log("vienen del contrato en HSK Testnet (no de obras.json).");
console.log("Las obras on-chain son INMUTABLES — esto es una feature.");
console.log("");
console.log("Para que 'Mis Obras' aparezca VACÍO en la demo, elige:");
console.log("");
console.log("  OPCIÓN A (recomendada para la demo):");
console.log("  Comenta CONTRACT_ADDRESS en .env y reinicia el backend:");
console.log("    # CONTRACT_ADDRESS=0x30bD14a61a484CaB2Da8D40Bc89d7368632aeF80");
console.log("  → El backend usará modo demo_local y leerá obras.json (vacío ✅)");
console.log("");
console.log("  OPCIÓN B (si quieres mantener blockchain real):");
console.log("  Despliega un contrato nuevo y limpio:");
console.log("    npx hardhat run contract/scripts/deploy.js --network hskTestnet");
console.log("  → Actualiza CONTRACT_ADDRESS en .env");
console.log("");
console.log("  OPCIÓN C (recomendada para DEMO con blockchain real):");
console.log("  Usa el modo de ocultar obras de prueba (flag esSimulado)");
console.log("  ya implementado en el endpoint GET /api/obras.");

// ── 5. Resumen ────────────────────────────────────────────────────────────
console.log("\n─────────────────────────────────────────");
console.log("✅ Reset completado");
console.log("─────────────────────────────────────────");
console.log("  ✓ backend/data/obras.json     → []");
console.log("  ✓ backend/data/versiones.json → {}");
console.log("\n  Próximo paso: reinicia el backend con npm run dev:backend");
console.log("=========================================\n");
