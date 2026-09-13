#!/bin/bash
# =========================================================================
# ObraClara AI — Script de Demo para Hackathon
# =========================================================================
# Levanta backend y frontend, genera PDFs de demo si no existen.
# Uso: bash demo/ejecutar_demo.sh

set -e

echo ""
echo "  ╔══════════════════════════════════════════════════════════════╗"
echo "  ║                                                            ║"
echo "  ║    🏗️  ObraClara AI — Demo de Hackathon                    ║"
echo "  ║                                                            ║"
echo "  ║    Blockchain detecta que algo cambió                      ║"
echo "  ║    La IA explica qué cambió                                ║"
echo "  ║    Una persona decide qué hacer                            ║"
echo "  ║                                                            ║"
echo "  ╚══════════════════════════════════════════════════════════════╝"
echo ""

# --- Verificar .env ---
if [ ! -f ".env" ]; then
  echo "  ⚠️  Archivo .env no encontrado."
  echo "  → Copia .env.example a .env y configura tus claves:"
  echo "     cp .env.example .env"
  echo ""
  exit 1
fi

# --- Verificar node_modules ---
if [ ! -d "node_modules" ]; then
  echo "  📦 Instalando dependencias..."
  npm install
  echo ""
fi

# --- Generar PDFs de demo ---
if [ ! -f "demo/contrato_original.pdf" ] || [ ! -f "demo/contrato_modificado.pdf" ]; then
  echo "  📄 Generando PDFs de demo..."
  node demo/generar_pdfs.js
  echo ""
fi

# --- Levantar servicios ---
echo "  🚀 Levantando servicios..."
echo ""
echo "  ┌─────────────────────────────────────────────────────┐"
echo "  │  Backend:   http://localhost:3001                   │"
echo "  │  Frontend:  http://localhost:5173                   │"
echo "  │  Explorer:  https://testnet-explorer.hskchain.net   │"
echo "  └─────────────────────────────────────────────────────┘"
echo ""

# Levantar backend en background
echo "  ⚙️  Iniciando backend (puerto 3001)..."
node backend/src/index.js &
BACKEND_PID=$!

# Esperar a que el backend esté listo
sleep 2

# Levantar frontend
echo "  🖥️  Iniciando frontend (puerto 5173)..."
npx --no-install vite frontend/ --host &
FRONTEND_PID=$!

echo ""
echo "  ═══════════════════════════════════════════════════════"
echo ""
echo "  📋 PASOS DE LA DEMO (3 minutos):"
echo ""
echo "  1️⃣  Abre http://localhost:5173"
echo "  2️⃣  Conecta MetaMask (red HSK Testnet)"
echo "  3️⃣  Sube demo/contrato_original.pdf → Registrar"
echo "  4️⃣  Ve a 'Mis Obras' → Verificar con demo/contrato_modificado.pdf"
echo "  5️⃣  Observa: ❄️ CONGELADA + reporte IA (500→300 metros)"
echo "  6️⃣  Ve al detalle → Rechazar cambio"
echo "  7️⃣  Muestra el historial de versiones en blockchain"
echo ""
echo "  ═══════════════════════════════════════════════════════"
echo ""
echo "  Presiona Ctrl+C para detener la demo."
echo ""

# Esperar a que el usuario termine
wait $BACKEND_PID $FRONTEND_PID
