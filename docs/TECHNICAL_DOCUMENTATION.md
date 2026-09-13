# ObraClara AI — Technical Documentation

> **Selected Tracks**: EAG Track "AI × Ethereum & Agent Economy" + HSK Chain Track "AI × Web3"

---

## Table of Contents

1. [Track Alignment](#1-track-alignment)
2. [Core Architecture](#2-core-architecture)
3. [Key Features](#3-key-features)
4. [Why Blockchain?](#4-why-blockchain)
5. [HSK Chain Integration](#5-hsk-chain-integration)
6. [AI Integration](#6-ai-integration)
7. [Smart Contract Design](#7-smart-contract-design)
8. [API Reference](#8-api-reference)
9. [Judging Criteria Alignment](#9-judging-criteria-alignment)
10. [Future Roadmap](#10-future-roadmap)

---

## 1. Track Alignment

### EAG Track — "AI × Ethereum & Agent Economy"

ObraClara AI is a direct implementation of AI agents working alongside Ethereum-compatible smart contracts. The system uses:

- **AI as an autonomous analyst**: Gemini 2.0 Flash acts as a document comparison agent that detects all differences between document versions and generates risk-classified reports — without human intervention in the analysis phase.
- **Smart contracts as the trust layer**: The `ObraRegistry` contract on HSK Chain (EVM-compatible) provides the immutable, permissionless verification that no centralized server can offer.
- **Human-in-the-loop governance**: While AI and blockchain handle detection and analysis, the final approve/reject decision remains with an authorized human — demonstrating responsible AI agent design.

This architecture represents the emerging pattern of **AI agents that operate within blockchain-enforced guardrails**: the agent has intelligence (understanding documents) but the blockchain constrains its actions (only authorized wallets can approve changes).

### HSK Chain Track — "AI × Web3"

ObraClara AI is deployed on **HSK Chain Testnet** (Chain ID 133) and demonstrates a real-world use case of combining AI capabilities with Web3 infrastructure:

- **On-chain data integrity**: Document hashes, version histories, and administrative decisions are all recorded on HSK Chain
- **Wallet-based access control**: The `soloAdministrador` modifier uses `msg.sender` for role-based permissions — no centralized auth server
- **Public verifiability**: Any citizen with a block explorer can verify the integrity of any registered contract, without needing access to government systems
- **EVM compatibility**: The contract is standard Solidity, deployable on any EVM chain, making HSK Chain a natural fit

---

## 2. Core Architecture

### On-chain Components (HSK Chain Testnet)

```
┌─────────────────────────────────────────────┐
│           ObraRegistry.sol                   │
│           (Solidity ^0.8.20)                 │
├─────────────────────────────────────────────┤
│                                             │
│  struct Obra {                              │
│    uint256 id                               │
│    string nombre                            │
│    string descripcion                       │
│    bool congelada          ← freeze flag    │
│    address administrador   ← role-based ACL │
│    Version[] versiones     ← full history   │
│  }                                          │
│                                             │
│  struct Version {                           │
│    bytes32 hash            ← SHA-256 of PDF │
│    uint256 timestamp                        │
│    EstadoVersion estado    ← 0/1/2          │
│    address revisor                          │
│  }                                          │
│                                             │
│  Functions:                                 │
│    registrarObra()         → create + v1    │
│    reportarCambio()        → freeze if ≠    │
│    aprobarCambio()         → unfreeze + new │
│    rechazarCambio()        → keep frozen    │
│    obtenerObra()           → read state     │
│    obtenerVersiones()      → read history   │
│    obtenerHashAprobado()   → latest valid   │
│    totalObras()            → count          │
│                                             │
│  Events:                                   │
│    ObraRegistrada(id, nombre, admin, hash)  │
│    CambioDetectado(id, hashOld, hashNew)    │
│    CambioAprobado(id, hashNew, revisor)     │
│    CambioRechazado(id, hashRejected, rev)   │
│                                             │
└─────────────────────────────────────────────┘
```

### Off-chain Components

```
┌──────────────────────────────────────────────────────────────┐
│                    Backend (Node.js + Express)                │
│                                                              │
│  ┌─────────────────┐  ┌──────────────────┐                  │
│  │  pdfService.js   │  │ blockchainSvc.js │                  │
│  │                 │  │                  │                  │
│  │  • pdf-parse    │  │  • ethers.js v6  │                  │
│  │  • SHA-256 hash │  │  • JsonRpcProv.  │                  │
│  │  • text extract │  │  • Wallet signer │                  │
│  └─────────────────┘  │  • Event parsing │                  │
│                       └──────────────────┘                  │
│  ┌─────────────────┐  ┌──────────────────┐                  │
│  │   iaService.js   │  │  storageSvc.js   │                  │
│  │                 │  │                  │                  │
│  │  • Gemini 2.0   │  │  • Local JSON    │                  │
│  │  • REST API     │  │  • Version texts │                  │
│  │  • diff fallback│  │  • Comparison    │                  │
│  │  • Risk table   │  └──────────────────┘                  │
│  └─────────────────┘                                        │
│                                                              │
│  Routes: POST /obras, POST /obras/:id/verificar,            │
│          POST /obras/:id/aprobar, POST /obras/:id/rechazar,  │
│          GET /obras, GET /obras/:id                           │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                  Frontend (React + Tailwind)                  │
│                                                              │
│  ┌─────────────────┐  ┌──────────────────┐                  │
│  │ WalletContext   │  │  3 Pages:        │                  │
│  │                 │  │                  │                  │
│  │ • MetaMask      │  │  / → Register    │                  │
│  │ • HSK Testnet   │  │  /obras → List   │                  │
│  │ • Auto-switch   │  │  /obras/:id →    │                  │
│  │ • Admin check   │  │    Detail +      │                  │
│  └─────────────────┘  │    Timeline +    │                  │
│                       │    Approve/Reject│                  │
│                       └──────────────────┘                  │
└──────────────────────────────────────────────────────────────┘
```

### Data Flow

```
1. REGISTER
   User uploads document (PDF/DOCX/XLSX/TXT)
   → Backend: extractor extracts text
   → Backend: SHA-256(buffer) → hash
   → Backend: ethers.js calls registrarObra(name, desc, hash) on HSK Chain
   → Contract: stores Obra with Version[0] = {hash, APROBADA}
   → Response: {idObra, hash, txHash, formato, modo}

2. VERIFY
   User uploads new PDF
   → Backend: SHA-256(buffer) → newHash
   → Backend: ethers.js calls obtenerHashAprobado(id) from HSK Chain
   → Compare: newHash ≠ approvedHash?
      → YES: ethers.js calls reportarCambio(id, newHash)
             Contract: congelada = true, emit CambioDetectado
             Gemini compares old text vs new text → diferencias report
             (fallback: diffTextoBasico if Gemini unavailable)
      → NO:  return {modificado: false}

3. APPROVE / REJECT
   Admin with authorized wallet calls:
   → aprobarCambio(id, hash): unfreeze, store new approved version
   → rechazarCambio(id): keep frozen, mark version as RECHAZADA
```

---

## 3. Key Features

### 3.1 Immutable Hash Registration

Every PDF uploaded to the system is hashed using SHA-256 on the **complete file buffer** (not the extracted text). This ensures that even invisible changes (metadata, formatting) are detected. The hash is stored as `bytes32` on HSK Chain, making it publicly verifiable and tamper-proof.

### 3.2 Automatic Change Detection

When a new version of a document is uploaded, the system:
1. Computes the SHA-256 hash of the new file
2. Reads the currently approved hash from the blockchain (`obtenerHashAprobado`)
3. If they differ, calls `reportarCambio()` which sets `congelada = true`

This is entirely deterministic — no AI involved in detection. The blockchain is the single source of truth.

### 3.3 Preventive Freezing

When a change is detected, the obra is **frozen immediately** at the smart contract level. No further operations can proceed until an authorized administrator reviews the change. This prevents the common scenario where altered contracts continue being executed while nobody notices.

### 3.4 AI-Powered Change Explanation

After detection, the AI service (Gemini 2.0 Flash) compares the extracted text of both versions and produces a structured report with differences classified by type and risk:

```json
{
  "hayCambios": true,
  "resumen": "Se redujo la cantidad de metros de 500 a 300...",
  "diferencias": [
    {
      "tipo": "MODIFICADO",
      "seccion": "Cláusula 3 — Alcance",
      "antes": "500 metros lineales",
      "ahora": "300 metros lineales",
      "riesgo": "ALTO",
      "explicacion": "Reducción del 40% en el alcance del trabajo"
    }
  ],
  "riesgoGeneral": "ALTO",
  "analizadoPor": "gemini"
}
```

If Gemini is unavailable, a local text diff produces the same format with `riesgo: "SIN_CLASIFICAR"` and `analizadoPor: "diff_local"`.

### 3.5 Deterministic Risk Classification

The risk classification is **not left to the AI's discretion**. A fixed rule table is injected into the system prompt:

| Risk Level | Trigger |
|-----------|--------|
| 🔴 **ALTO** (HIGH) | Names of parties, amounts, quantities, obligations, locations |
| 🟡 **MEDIO** (MEDIUM) | Dates, deadlines, secondary conditions |
| 🟢 **BAJO** (LOW) | Spelling, formatting, minor wording changes |
| ⚪ **SIN_CLASIFICAR** | Differences from local diff (no AI classification) |

The AI must assign risk levels according to this table. Responses are validated structurally after JSON parsing; if validation fails, the system falls back to local diff.

### 3.6 Human-in-the-Loop Approval

The final decision always rests with a human administrator:
- **Approve** (`aprobarCambio`): Registers the new hash as the current approved version, unfreezes the obra
- **Reject** (`rechazarCambio`): Marks the version as rejected, obra remains frozen

The administrator is the wallet address (`msg.sender`) that originally registered the obra. This is enforced by the `soloAdministrador` modifier on-chain.

### 3.7 Auditable Version History

Every version — whether approved, rejected, or pending — is stored on-chain with:
- `bytes32 hash` — The document's SHA-256
- `uint256 timestamp` — Block timestamp
- `EstadoVersion estado` — PENDIENTE (0), APROBADA (1), RECHAZADA (2)
- `address revisor` — Who reviewed it

This creates a complete, immutable audit trail that any citizen can inspect via a block explorer.

---

## 4. Why Blockchain?

### Why not just a database?

A centralized database can be modified by whoever controls the server. In the context of public works contracts in Bolivia and similar countries:

1. **Government servers can be altered**: If a corrupt official wants to change a contract, they can also change the database records
2. **No public verifiability**: Citizens cannot independently verify the integrity of a document stored in a government database
3. **Single point of failure**: If the server goes down or is compromised, all records are lost or corrupted

Blockchain provides:
- **Immutability**: Once a hash is registered, it cannot be altered — not even by the system administrator
- **Public verifiability**: Anyone with internet access can verify a document's hash against the on-chain record
- **Decentralized trust**: No single entity controls the truth — the network consensus does

### Why not just digital signatures?

Digital signatures prove **who** signed a document but don't prevent authorized signers from signing a **different version** later. ObraClara's approach:

1. The **original hash** is registered on-chain
2. If **any version** is uploaded later — even if properly signed — and its hash differs, the system detects it
3. The blockchain proves that the **content** changed, regardless of who signed it

Digital signatures answer "who signed this?" — ObraClara answers "is this the same document that was originally registered?"

---

## 5. HSK Chain Integration

### Network Configuration

| Parameter | Value |
|-----------|-------|
| Chain Name | HSKChain Testnet |
| Chain ID | 133 (`0x85`) |
| RPC URL | `https://hashkeychain-testnet.alt.technology` |
| Explorer | `https://testnet-explorer.hskchain.net` |
| Currency | HSK (HashKey EcoPoints) |
| Compatibility | EVM (Ethereum Virtual Machine) |

### Deployed Contract

- **Contract**: `ObraRegistry.sol`
- **Address**: `[To be filled after deployment]`
- **Compiler**: Solidity ^0.8.20
- **Framework**: Hardhat

### Why HSK Chain?

- **EVM compatible**: Standard Solidity deployment with no modifications needed
- **Low cost**: Testnet transactions are free, mainnet fees are minimal
- **Fast finality**: Suitable for near-real-time document verification
- **Growing ecosystem**: Part of the HashKey ecosystem with regulatory compliance focus

### Faucet

Testnet HSK tokens can be obtained from the HashKey Chain testnet faucet for development and testing.

---

## 6. AI Integration

### Model Selection

**Gemini 2.0 Flash** was chosen for:
- Free tier availability (suitable for hackathon and production)
- Native JSON output via `responseMimeType: "application/json"`
- Strong performance on Spanish-language document analysis
- Fast inference (< 5 seconds per request)
- No SDK required — uses native `fetch()` to the REST API

### Generic Document Comparison

The AI is used exclusively for **comparing two versions** of any document and detecting differences classified as ➕ AGREGADO, ➖ ELIMINADO, or ✏️ MODIFICADO, each with a risk level.

A single system prompt is used with the role of "expert document auditor", a fixed risk classification table, and strict JSON output format.

### 3-Level Fallback Architecture

1. **Gemini 2.0 Flash API** — if `GEMINI_API_KEY` is configured
2. **diffTextoBasico()** — local line-by-line diff, risk `SIN_CLASIFICAR`
3. **Minimal hardcoded report** — if everything fails

Each level produces the same JSON format, with `analizadoPor` indicating which method was used.

### Security

- API key passed as URL parameter but **never logged** to console
- On error, only HTTP status and generic message are logged
- 30-second timeout via `AbortController` prevents hanging

### JSON Cleanup

Before parsing, markdown wrappers (` ```json...``` `) are stripped, BOM removed, and structure validated. Parse failures fall to diff.

---

## 7. Smart Contract Design

### State Machine

```
                   registrarObra()
                        │
                        ▼
              ┌─────────────────┐
              │   OBRA ACTIVA    │ ◄──────────────────┐
              │  congelada=false │                     │
              └────────┬────────┘                     │
                       │                              │
                reportarCambio()                      │
                (hash ≠ aprobado)               aprobarCambio()
                       │                              │
                       ▼                              │
              ┌─────────────────┐                     │
              │  OBRA CONGELADA  │────────────────────┘
              │  congelada=true  │
              └────────┬────────┘
                       │
                rechazarCambio()
                       │
                       ▼
              ┌─────────────────┐
              │  SIGUE CONGELADA │ (version marked RECHAZADA)
              │  congelada=true  │
              └─────────────────┘
```

### Access Control

- `registrarObra()`: Anyone can register (becomes the admin)
- `reportarCambio()`: Anyone can report a change (whistleblower pattern)
- `aprobarCambio()`: **Only the obra's administrator** (enforced by `soloAdministrador`)
- `rechazarCambio()`: **Only the obra's administrator**

### Gas Optimization

- Uses `mapping(uint256 => Obra)` instead of arrays for O(1) lookups
- Version history uses `push()` for append-only operations
- `_obtenerHashAprobado()` iterates backwards from the latest version for efficient latest-hash retrieval

### Test Coverage

25 tests covering:
- Unit tests for each function
- Access control enforcement
- State transition correctness
- Event emission verification
- Edge cases (same hash, invalid IDs)
- Full E2E lifecycle: register → report change → freeze → approve/reject → unfreeze

---

## 8. API Reference

### `POST /api/obras`
Register a new obra with a PDF contract.

**Request**: `multipart/form-data`
- `archivo` (file): PDF contract file
- `nombre` (string): Name of the obra
- `descripcion` (string): Description

**Response** `201`:
```json
{
  "mensaje": "Obra registrada exitosamente",
  "idObra": 1,
  "hash": "0xabc123...",
  "txHash": "0xdef456...",
  "formato": "pdf",
  "modo": "blockchain"
}
```

### `POST /api/obras/:id/verificar`
Verify a new version of a contract.

**Request**: `multipart/form-data`
- `archivo` (file): New PDF version

**Response** `200` (change detected):
```json
{
  "modificado": true,
  "congelada": true,
  "hashAnterior": "0xabc123...",
  "hashNuevo": "0xdef456...",
  "reporte": {
    "hayCambios": true,
    "resumen": "Se redujo la cantidad de 500 a 300 metros...",
    "diferencias": [
      {
        "tipo": "MODIFICADO",
        "seccion": "Cláusula 3",
        "antes": "500 metros",
        "ahora": "300 metros",
        "riesgo": "ALTO",
        "explicacion": "Reducción del alcance"
      }
    ],
    "riesgoGeneral": "ALTO",
    "analizadoPor": "gemini"
  },
  "txHash": "0x..."
}
```

### `POST /api/obras/:id/aprobar`
Approve a change (admin only).

**Request**: `application/json`
```json
{ "hash": "0xdef456..." }
```

### `POST /api/obras/:id/rechazar`
Reject a change (admin only). No body needed.

### `GET /api/obras`
List all obras with current state.

### `GET /api/obras/:id`
Get obra detail with full version history.

---

## 9. Judging Criteria Alignment

### Feasibility

ObraClara AI works **today** with existing, production-ready tools:
- Solidity smart contracts (battle-tested technology)
- Google Gemini 2.0 Flash (free API with generous limits)
- HSK Chain Testnet (live and operational)
- pdf-parse, mammoth, xlsx (mature Node.js libraries)

No research breakthroughs or unreleased technology required. The prototype is fully functional and can be deployed to mainnet with minimal changes.

### Meaningful Problem

**Hidden modification of public works contracts** is a documented corruption pattern in Bolivia and Latin America:
- Contracts are altered after signing to reduce scope of work while maintaining budget
- The difference is pocketed by corrupt officials and contractors
- Citizens have no way to verify if the contract they see matches the original

This affects millions of people who depend on public infrastructure funded by their taxes.

### Innovation

ObraClara introduces a **novel bridge between documents, blockchain, and AI** with a human-in-the-loop design:

1. **Document → Blockchain**: PDF hash as an immutable fingerprint
2. **Blockchain → Alert**: Automatic change detection via hash comparison
3. **Alert → AI**: Intelligent analysis of what specifically changed
4. **AI → Human**: Risk-classified report for informed decision-making
5. **Human → Blockchain**: Approve/reject decision recorded on-chain

This is not just "putting documents on blockchain" — it's a complete monitoring pipeline that combines the strengths of each technology while keeping humans in control.

---

## 10. Future Roadmap

### Short Term (3-6 months)
- [ ] Deploy to HSK Chain **mainnet**
- [ ] Integration with 2-3 pilot municipalities in Cochabamba
- [ ] Add support for OTB (Organización Territorial de Base) verification
- [ ] Mobile-responsive improvements for field supervisors

### Medium Term (6-12 months)
- [ ] **Decentralized keepers** (Gelato/Chainlink) for automatic periodic monitoring
- [ ] **Photo evidence verification**: Hash photos of construction progress on-chain
- [ ] Multi-language support (Quechua, Aymara) for broader accessibility
- [ ] Dashboard for cross-project risk pattern analysis

### Long Term (1-2 years)
- [ ] **Selective disclosure** using ZK proofs for sensitive contractual data
- [ ] Integration with Bolivia's national procurement system (SICOES)
- [ ] AI agent network: autonomous monitors that periodically check documents and alert administrators
- [ ] Cross-chain deployment for regional adoption (other Latin American countries)
- [ ] On-chain reputation system for contractors based on modification history
