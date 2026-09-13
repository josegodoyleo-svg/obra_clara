<p align="center">
  <h1 align="center">🏗️ ObraClara AI</h1>
  <p align="center">
    <strong>Monitoreo inteligente de documentos con Blockchain + IA</strong>
  </p>
  <p align="center">
    <em>Blockchain detecta que algo cambió · La IA explica qué cambió · Una persona decide qué hacer</em>
  </p>
  <p align="center">
    <img src="https://img.shields.io/badge/Solidity-^0.8.20-363636?logo=solidity" alt="Solidity" />
    <img src="https://img.shields.io/badge/HSK_Chain-Testnet-6366f1?logo=ethereum" alt="HSK Chain" />
    <img src="https://img.shields.io/badge/Node.js-18+-339933?logo=node.js" alt="Node.js" />
    <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react" alt="React" />
    <img src="https://img.shields.io/badge/Gemini-2.0_Flash-4285F4?logo=google" alt="Gemini" />
    <img src="https://img.shields.io/badge/License-MIT-green" alt="License" />
  </p>
</p>

---

## 🇪🇸 Español

### ¿Qué es ObraClara AI?

ObraClara AI es un sistema que protege **cualquier tipo de documento** (contratos, actas, informes, textos legales) contra modificaciones ocultas combinando tres capas de defensa: **blockchain** para detectar cualquier alteración mediante hashes criptográficos inmutables, **inteligencia artificial** (Gemini 2.0 Flash) para comparar versiones y explicar exactamente qué cambió con clasificación de riesgo, y **un administrador humano** que toma la decisión final de aprobar o rechazar cada cambio. Diseñado para combatir la corrupción en obras públicas y proteger la integridad documental.

### ✨ Features

- 📄 **Registro de documentos** — Sube cualquier documento (PDF, Word, Excel, TXT), el hash SHA-256 queda en blockchain
- 🔗 **Hash inmutable en HSK Chain** — Cualquier ciudadano puede verificar la integridad del documento
- 🔍 **Detección automática de cambios** — Si alguien modifica el documento, los hashes no coinciden
- ❄️ **Congelamiento preventivo** — La obra se congela automáticamente cuando se detecta un cambio
- 🤖 **Comparación genérica con IA** — Gemini 2.0 Flash compara versiones y detecta diferencias: ➕ AGREGADO, ➖ ELIMINADO, ✏️ MODIFICADO
- 🚦 **Clasificación de riesgo** — 🔴 ALTO (montos/nombres/obligaciones) · 🟡 MEDIO (fechas/plazos) · 🟢 BAJO (formato/ortografía) · ⚪ SIN_CLASIFICAR (diff local)
- 🔧 **Fallback de 3 niveles** — Gemini API → diff de texto local → reporte mínimo
- 👤 **Human-in-the-loop** — Un administrador autorizado aprueba o rechaza cada cambio
- 📜 **Historial auditable** — Todas las versiones registradas on-chain con timestamp y revisor
- 🦊 **MetaMask integration** — Conexión directa con wallet, auto-switch a HSK Testnet

### 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ObraClara AI                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   📄 Documento (PDF/DOCX/XLSX/TXT)                                  │
│       │                                                             │
│       ▼                                                             │
│   ┌──────────────────────────────────────────────┐                  │
│   │            Backend (Node.js + Express)        │                  │
│   │                                              │                  │
│   │   1. Extractor → extrae texto del archivo    │                  │
│   │   2. SHA-256 → calcula hash del buffer       │                  │
│   │   3. ethers.js → registra hash en blockchain │                  │
│   │                                              │                  │
│   └──────────┬───────────────┬───────────────────┘                  │
│              │               │                                      │
│              ▼               ▼                                      │
│   ┌──────────────┐   ┌──────────────────────┐                      │
│   │  HSK Chain   │   │  Gemini 2.0 Flash    │                      │
│   │  (Testnet)   │   │                      │                      │
│   │              │   │   • Compara versiones │                      │
│   │ ObraRegistry │   │   • Detecta AGREGADO/ │                      │
│   │  .sol        │   │     ELIMINADO/        │                      │
│   │              │   │     MODIFICADO         │                      │
│   │ • Hashes     │   │   • Clasifica riesgo  │                      │
│   │ • Versiones  │   └──────────────────────┘                      │
│   │ • Estados    │                                                  │
│   │ • Congelar   │        ┌──────────────────────┐                  │
│   └──────────────┘        │  Frontend (React)    │                  │
│                           │                      │                  │
│                           │  • Registrar obra    │                  │
│   Si hash ≠ hash          │  • Ver obras         │                  │
│   aprobado:               │  • Verificar doc     │                  │
│                           │  • Aprobar/Rechazar  │                  │
│   ❄️ CONGELAR              │  • Timeline versiones│                  │
│   ⚠️ ALERTA                │  • MetaMask wallet   │                  │
│   🤖 IA EXPLICA            └──────────────────────┘                  │
│   👤 HUMANO DECIDE                                                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

```
Flujo simplificado:

Documento ──→ Backend ──→ Hash SHA-256 ──→ HSK Chain
                                              │
Nueva versión ──→ Backend ──→ Hash nuevo ──→ ¿Coincide? ───┤
                                                │           │
                                              NO ↓         SÍ → ✅ OK
                                         ❄️ Congelar obra
                                         🤖 IA compara versiones
                                         👤 Admin: ✅ Aprobar / ❌ Rechazar
```

### 📋 Requisitos

- **Node.js** 18 o superior
- **MetaMask** con la red HSK Chain Testnet configurada
- **Tokens HSK** de testnet — obtener del faucet de HashKey
- **Gemini API Key** (opcional — funciona con diff local sin key)

### 🚀 Instalación paso a paso

#### 1. Clonar e instalar dependencias

```bash
git clone https://github.com/<tu-usuario>/ObraClara.git
cd ObraClara
npm install
```

#### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Editar `.env`:

```env
# Blockchain - HSK Chain Testnet
PRIVATE_KEY=tu_clave_privada_sin_0x
CONTRACT_ADDRESS=0x...  # Se obtiene después de desplegar

# IA - Google Gemini (opcional: sin key funciona con diff local)
GEMINI_API_KEY=tu_api_key_de_google_ai_studio

# Frontend
VITE_CONTRACT_ADDRESS=0x...  # Mismo que CONTRACT_ADDRESS
```

#### 3. Compilar y desplegar el contrato inteligente

```bash
# Compilar
npx hardhat compile --config contract/hardhat.config.js

# Desplegar en HSK Testnet
npx hardhat run contract/scripts/deploy.js --network hskTestnet --config contract/hardhat.config.js
```

Copiar la dirección desplegada a `CONTRACT_ADDRESS` y `VITE_CONTRACT_ADDRESS` en `.env`.

#### 4. Verificar con tests (25/25 passing)

```bash
npx hardhat test --config contract/hardhat.config.js
```

#### 5. Generar PDFs de demo

```bash
node demo/generar_pdfs.js
```

#### 6. Levantar servicios

```bash
# Terminal 1 — Backend (puerto 3001)
node backend/src/index.js

# Terminal 2 — Frontend (puerto 5173)
npx vite frontend/ --host
```

#### Windows (un solo comando)

```cmd
demo\ejecutar_demo.bat
```

Abrir **http://localhost:5173** y conectar MetaMask.

### 🔧 Integración Técnica

#### HSK Chain (Blockchain)

El contrato `ObraRegistry.sol` está desplegado en **HSK Chain Testnet** (Chain ID 133, EVM-compatible):

- **RPC**: `https://rpc.testnet.hashkeychain.com`
- **Explorer**: `https://testnet-explorer.hskchain.net`
- **Funciones on-chain**: `registrarObra()`, `reportarCambio()`, `aprobarCambio()`, `rechazarCambio()`
- **Eventos**: `ObraRegistrada`, `CambioDetectado`, `CambioAprobado`, `CambioRechazado`
- El contrato almacena hashes `bytes32`, estados de versiones y direcciones de revisores

#### Inteligencia Artificial (Gemini 2.0 Flash)

- **Modelo**: `gemini-2.0-flash` vía REST API (sin SDK, usa `fetch()` nativo)
- **Función**: Compara dos versiones de cualquier documento y detecta diferencias
- **Tipos de diferencia**: ➕ AGREGADO, ➖ ELIMINADO, ✏️ MODIFICADO
- **Clasificación de riesgo** (tabla fija, no libre para la IA):
  - 🔴 **ALTO**: nombres de partes, montos, cantidades, obligaciones, ubicaciones
  - 🟡 **MEDIO**: fechas, plazos, condiciones secundarias
  - 🟢 **BAJO**: ortografía, formato, redacción sin alterar significado
  - ⚪ **SIN_CLASIFICAR**: diferencias detectadas por diff local (sin IA)
- **Fallback de 3 niveles**: Gemini API → diff de texto por líneas → reporte mínimo
- **Seguridad**: API key nunca se loguea en consola; timeout de 30s con AbortController

#### Hash SHA-256 y Congelamiento

1. Se calcula `SHA-256` del **buffer completo del archivo** (no del texto extraído)
2. El hash se registra como `bytes32` en el contrato
3. Al verificar una nueva versión, se compara el hash nuevo con el hash aprobado on-chain
4. Si **difieren**: el contrato ejecuta `reportarCambio()` → la obra se **congela automáticamente**
5. Solo el administrador (wallet que registró la obra) puede descongelar aprobando o rechazando

### 🗺️ Roadmap Futuro

- [ ] Despliegue en HSK Chain **mainnet**
- [ ] Integración con OTBs y municipios de Cochabamba
- [ ] Monitoreo automático periódico con keepers descentralizados (Gelato/Chainlink)
- [ ] Verificación de fotos de evidencia de avance de obra con hash on-chain
- [ ] Soporte multi-idioma (quechua, aymara)
- [ ] Selective disclosure (ZK proofs) para datos contractuales sensibles
- [ ] Dashboard de análisis de patrones de riesgo entre múltiples obras
- [ ] App móvil para supervisores de campo

### 📁 Estructura del proyecto

```
ObraClara/
├── contract/                  # Smart contract (Solidity + Hardhat)
│   ├── contracts/ObraRegistry.sol
│   ├── scripts/deploy.js
│   ├── test/ObraRegistry.test.js  (25 tests)
│   └── hardhat.config.js
├── backend/                   # API REST (Node.js + Express)
│   └── src/
│       ├── index.js
│       ├── routes/obras.js
│       ├── services/{blockchain,ia,extractorTexto,storage}Service.js
│       ├── middleware/upload.js
│       └── abi/ObraRegistry.json
├── frontend/                  # UI (React + Tailwind CSS)
│   └── src/
│       ├── App.jsx
│       ├── context/WalletContext.jsx
│       ├── components/{Header,Footer}.jsx
│       ├── pages/{RegistrarObra,MisObras,DetalleObra}.jsx
│       └── services/api.js
├── demo/                      # Archivos de demostración
│   ├── contrato_{original,modificado}.{txt,pdf}
│   ├── generar_pdfs.js
│   └── pasos_demo.md
├── docs/                      # Documentación técnica
│   ├── TECHNICAL_DOCUMENTATION.md
│   └── DEMO_SCRIPT.md
├── .env.example
└── README.md
```

### 📜 Licencia

MIT License — Proyecto de hackathon, uso educativo y social.

---

## 🇬🇧 English

### What is ObraClara AI?

ObraClara AI is a system that protects **any type of document** (contracts, records, reports, legal texts) against hidden modifications by combining three layers of defense: **blockchain** to detect any alteration through immutable cryptographic hashes, **artificial intelligence** (Gemini 2.0 Flash) to compare versions and explain exactly what changed with risk classification, and a **human administrator** who makes the final decision to approve or reject each change. Designed to fight corruption in public works and protect document integrity.

### ✨ Features

- 📄 **Document registration** — Upload any document (PDF, Word, Excel, TXT), SHA-256 hash is stored on blockchain
- 🔗 **Immutable hash on HSK Chain** — Any citizen can verify document integrity
- 🔍 **Automatic change detection** — If someone modifies the document, hashes won't match
- ❄️ **Preventive freezing** — The project freezes automatically when a change is detected
- 🤖 **Generic AI comparison** — Gemini 2.0 Flash compares versions and detects differences: ➕ ADDED, ➖ REMOVED, ✏️ MODIFIED
- 🚦 **Risk classification** — 🔴 HIGH (amounts/names/obligations) · 🟡 MEDIUM (dates/deadlines) · 🟢 LOW (formatting/spelling) · ⚪ UNCLASSIFIED (local diff)
- 🔧 **3-level fallback** — Gemini API → local text diff → minimal report
- 👤 **Human-in-the-loop** — An authorized administrator approves or rejects each change
- 📜 **Auditable history** — All versions recorded on-chain with timestamp and reviewer
- 🦊 **MetaMask integration** — Direct wallet connection, auto-switch to HSK Testnet

### 🏗️ Architecture

```
Document ──→ Backend ──→ SHA-256 Hash ──→ HSK Chain
                                              │
New version ──→ Backend ──→ New hash ──→ Match? ────────────┤
                                             │                │
                                           NO ↓             YES → ✅ OK
                                      ❄️ Freeze project
                                      🤖 AI compares & explains differences
                                      👤 Admin: ✅ Approve / ❌ Reject
```

### 🚀 Quick Start

```bash
git clone https://github.com/<your-user>/ObraClara.git
cd ObraClara
npm install
cp .env.example .env    # Configure your keys
npx hardhat compile --config contract/hardhat.config.js
npx hardhat run contract/scripts/deploy.js --network hskTestnet --config contract/hardhat.config.js
node demo/generar_pdfs.js
node backend/src/index.js &
npx vite frontend/ --host
```

Open **http://localhost:5173** and connect MetaMask.

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contract | Solidity ^0.8.20 — `ObraRegistry.sol` |
| Blockchain | HSK Chain Testnet (Chain ID 133, EVM compatible) |
| Backend | Node.js + Express + ethers.js v6 |
| AI | Google Gemini 2.0 Flash (REST API, 3-level fallback) |
| Frontend | React 18 + Tailwind CSS + MetaMask |
| Document Processing | pdf-parse + mammoth + xlsx + SHA-256 |

### 📜 License

MIT License — Hackathon project for educational and social impact purposes.
