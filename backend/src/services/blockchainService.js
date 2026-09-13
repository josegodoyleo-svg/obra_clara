// =========================================================================
// Servicio de Blockchain — Wrapper para interactuar con ObraRegistry
// =========================================================================
// Usa ethers.js v6 para conectarse a HSK Chain Testnet y ejecutar
// funciones del contrato inteligente ObraRegistry.

const { ethers } = require("ethers");
const path = require("path");
const ABI = require("../abi/ObraRegistry.json");

// ---------------------------------------------------------------------------
// Configuración del provider y signer
// ---------------------------------------------------------------------------

const RPC_URL = process.env.RPC_URL || "https://testnet.hsk.xyz";
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

let provider;
let signer;
let contract;

/**
 * Valida si un string es una clave privada hexadecimal válida (64 caracteres hex).
 */
function esClavePrivadaValida(key) {
  if (!key || typeof key !== "string") return false;
  const clean = key.trim().startsWith("0x") ? key.trim().slice(2) : key.trim();
  if (clean.includes("x") || clean.length !== 64) return false;
  return /^[0-9a-fA-F]{64}$/.test(clean);
}

/**
 * Valida si un string es una dirección de contrato válida (no placeholder ni ZeroAddress).
 */
function esDireccionValida(addr) {
  if (!addr || typeof addr !== "string") return false;
  const clean = addr.trim();
  if (clean.includes("xxx") || clean === ethers.ZeroAddress || clean === "0x0000000000000000000000000000000000000000") {
    return false;
  }
  return ethers.isAddress(clean);
}

/**
 * Inicializa la conexión con la blockchain y el contrato de forma segura.
 * Nunca lanza excepciones no manejadas para evitar tirar el servidor al arrancar.
 */
function inicializar() {
  try {
    const contractAddr = process.env.CONTRACT_ADDRESS;
    const privKey = process.env.PRIVATE_KEY;
    const rpcUrl = process.env.RPC_URL || "https://testnet.hsk.xyz";

    if (!contractAddr || !esDireccionValida(contractAddr)) {
      console.warn("⚠️  CONTRACT_ADDRESS no configurado o es placeholder (0x00...).");
      console.warn("ℹ️  Despliega el contrato con 'npx hardhat run contract/scripts/deploy.js --network hskTestnet' y actualiza .env");
      return;
    }

    // Configurar resiliencia con FetchRequest (ethers v6)
    const fetchReq = new ethers.FetchRequest(rpcUrl);
    fetchReq.timeout = 30000; // 30 segundos
    fetchReq.retryOptions = { retries: 2, retryDelay: 2000 };

    provider = new ethers.JsonRpcProvider(fetchReq);


    if (esClavePrivadaValida(privKey)) {
      try {
        const cleanKey = privKey.trim().startsWith("0x") ? privKey.trim() : `0x${privKey.trim()}`;
        signer = new ethers.Wallet(cleanKey, provider);
        contract = new ethers.Contract(contractAddr, ABI, signer);
        console.log("🔗 Blockchain conectada exitosamente. Wallet:", signer.address);
      } catch (walletErr) {
        console.warn("⚠️  No se pudo inicializar wallet con PRIVATE_KEY:", walletErr.message);
        contract = new ethers.Contract(contractAddr, ABI, provider);
        console.warn("ℹ️  Operando en modo solo lectura.");
      }
    } else {
      contract = new ethers.Contract(contractAddr, ABI, provider);
      console.warn("⚠️  PRIVATE_KEY no configurada o es placeholder. Modo solo lectura habilitado.");
    }
  } catch (error) {
    console.warn("⚠️  Error al inicializar conexión con blockchain:", error.message);
    console.warn("ℹ️  El servidor continuará funcionando con respuestas informativas.");
  }
}

/**
 * Retorna true si el contrato está conectado a la blockchain.
 */
function estaConectado() {
  return !!contract;
}

/**
 * Retorna true si hay una wallet configurada para transacciones on-chain.
 */
function estaListoParaEscritura() {
  return !!contract && !!signer;
}

/**
 * Retorna información sobre el modo de operación actual.
 * @returns {{ modo: string, label: string, contrato: string|null, explorer: string|null, rpc: string }}
 */
function getModo() {
  const contractAddr = process.env.CONTRACT_ADDRESS;
  const isReal = !!contract && esDireccionValida(contractAddr);

  if (isReal) {
    return {
      modo: "blockchain_real",
      label: "⛓️ HSK Testnet (real)",
      contrato: contractAddr,
      explorer: `https://testnet-explorer.hskchain.net/address/${contractAddr}`,
      rpc: RPC_URL,
      escritura: !!signer,
    };
  }

  return {
    modo: "demo_local",
    label: "💾 Modo Demo Local",
    contrato: null,
    explorer: null,
    rpc: null,
    escritura: false,
  };
}

/**
 * Verifica que el contrato esté inicializado antes de operar.
 */
function verificarContrato(requiereEscritura = false) {
  const contractAddr = process.env.CONTRACT_ADDRESS;
  if (!contractAddr || !esDireccionValida(contractAddr)) {
    throw new Error(
      "Contrato no configurado. Despliega el contrato con 'npx hardhat run contract/scripts/deploy.js --network hskTestnet' y agrega CONTRACT_ADDRESS en el .env"
    );
  }
  if (!contract) {
    throw new Error(
      "El contrato no pudo conectarse a la blockchain. Verifica RPC_URL y CONTRACT_ADDRESS en .env"
    );
  }
  if (requiereEscritura && !signer) {
    throw new Error(
      "Operación on-chain requiere firma: Configura una PRIVATE_KEY válida con tokens HSK en .env"
    );
  }
}

// ---------------------------------------------------------------------------
// Funciones de escritura (requieren signer / PRIVATE_KEY)
// ---------------------------------------------------------------------------

/**
 * Registra una nueva obra en blockchain.
 * Llama a registrarObra(nombre, descripcion, hashInicial) en el contrato.
 *
 * @param {string} nombre       - Nombre de la obra
 * @param {string} descripcion  - Descripción de la obra
 * @param {string} hashHex      - Hash SHA-256 del PDF en formato hex (sin 0x)
 * @returns {Object} { idObra, txHash }
 */
async function registrarObra(nombre, descripcion, hashHex) {
  verificarContrato();

  // Convertir hash hex string a bytes32 (agregar prefijo 0x si no lo tiene)
  const hashBytes32 = hashHex.startsWith("0x") ? hashHex : `0x${hashHex}`;

  const tx = await contract.registrarObra(nombre, descripcion, hashBytes32);
  const receipt = await tx.wait();

  // Extraer el ID de la obra del evento ObraRegistrada
  const evento = receipt.logs
    .map((log) => {
      try {
        return contract.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((e) => e && e.name === "ObraRegistrada");

  const idObra = evento ? Number(evento.args.idObra) : null;

  return {
    idObra,
    txHash: receipt.hash,
  };
}

/**
 * Reporta un cambio de documento para una obra existente.
 * Si el hash difiere del aprobado, la obra se congela automáticamente.
 *
 * @param {number} idObra   - ID de la obra
 * @param {string} hashHex  - Hash SHA-256 del nuevo PDF
 * @returns {Object} { txHash, congelada }
 */
async function reportarCambio(idObra, hashHex) {
  verificarContrato();

  const hashBytes32 = hashHex.startsWith("0x") ? hashHex : `0x${hashHex}`;

  const tx = await contract.reportarCambio(idObra, hashBytes32);
  const receipt = await tx.wait();

  // Verificar si se emitió el evento CambioDetectado
  const eventoCambio = receipt.logs
    .map((log) => {
      try {
        return contract.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((e) => e && e.name === "CambioDetectado");

  return {
    txHash: receipt.hash,
    congelada: !!eventoCambio,
    hashAnterior: eventoCambio ? eventoCambio.args.hashAnterior : null,
  };
}

/**
 * El administrador aprueba un cambio, descongela la obra.
 *
 * @param {number} idObra   - ID de la obra
 * @param {string} hashHex  - Hash del documento aprobado
 * @returns {Object} { txHash }
 */
async function aprobarCambio(idObra, hashHex) {
  verificarContrato();

  const hashBytes32 = hashHex.startsWith("0x") ? hashHex : `0x${hashHex}`;

  const tx = await contract.aprobarCambio(idObra, hashBytes32);
  const receipt = await tx.wait();

  return { txHash: receipt.hash };
}

/**
 * El administrador rechaza un cambio, la obra sigue congelada.
 *
 * @param {number} idObra - ID de la obra
 * @returns {Object} { txHash }
 */
async function rechazarCambio(idObra) {
  verificarContrato();

  const tx = await contract.rechazarCambio(idObra);
  const receipt = await tx.wait();

  return { txHash: receipt.hash };
}

// ---------------------------------------------------------------------------
// Funciones de lectura (no requieren signer)
// ---------------------------------------------------------------------------

/**
 * Obtiene los datos de una obra desde la blockchain.
 *
 * @param {number} idObra - ID de la obra
 * @returns {Object} Datos de la obra
 */
async function obtenerObra(idObra) {
  verificarContrato();

  const [id, nombre, descripcion, congelada, administrador, totalVersiones] =
    await contract.obtenerObra(idObra);

  return {
    id: Number(id),
    nombre,
    descripcion,
    congelada,
    administrador,
    totalVersiones: Number(totalVersiones),
  };
}

/**
 * Obtiene el historial de versiones de una obra.
 *
 * @param {number} idObra - ID de la obra
 * @returns {Array} Lista de versiones con { hash, timestamp, estado, revisor }
 */
async function obtenerVersiones(idObra) {
  verificarContrato();

  const ESTADOS = ["PENDIENTE", "APROBADA", "RECHAZADA"];

  const versiones = await contract.obtenerVersiones(idObra);

  return versiones.map((v) => ({
    hash: v.hash,
    timestamp: Number(v.timestamp),
    fecha: new Date(Number(v.timestamp) * 1000).toISOString(),
    estado: ESTADOS[Number(v.estado)] || "DESCONOCIDO",
    estadoCodigo: Number(v.estado),
    revisor: v.revisor,
  }));
}

/**
 * Obtiene el hash aprobado actual de una obra.
 *
 * @param {number} idObra - ID de la obra
 * @returns {string} Hash bytes32 aprobado
 */
async function obtenerHashAprobado(idObra) {
  verificarContrato();
  return await contract.obtenerHashAprobado(idObra);
}

/**
 * Obtiene el total de obras registradas.
 *
 * @returns {number} Total de obras
 */
async function totalObras() {
  verificarContrato();
  return Number(await contract.totalObras());
}

/**
 * Lista todas las obras con su estado actual.
 *
 * @returns {Array} Lista de obras
 */
async function listarObras() {
  if (!contract) {
    return [];
  }
  const total = await totalObras();
  const obras = [];

  for (let i = 1; i <= total; i++) {
    const obra = await obtenerObra(i);
    obras.push(obra);
  }

  return obras;
}

module.exports = {
  inicializar,
  estaConectado,
  estaListoParaEscritura,
  getModo,
  registrarObra,
  reportarCambio,
  aprobarCambio,
  rechazarCambio,
  obtenerObra,
  obtenerVersiones,
  obtenerHashAprobado,
  totalObras,
  listarObras,
};

