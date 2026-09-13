// =========================================================================
// Servicio de PDF — Lectura de texto y cálculo de hash SHA-256
// =========================================================================

const crypto = require("crypto");
const pdfParse = require("pdf-parse");

/**
 * Calcula el hash SHA-256 del buffer completo del archivo PDF.
 *
 * @param {Buffer} fileBuffer - Buffer del archivo PDF
 * @returns {string} Hash SHA-256 en formato hexadecimal (64 caracteres, sin 0x)
 */
function calcularHash(fileBuffer) {
  return crypto.createHash("sha256").update(fileBuffer).digest("hex");
}

/**
 * Extrae el texto plano de un archivo PDF usando pdf-parse con fallback a v2.0.550.
 *
 * @param {Buffer} fileBuffer - Buffer del archivo PDF
 * @returns {Promise<string>} Texto extraído del PDF
 */
async function extraerTexto(fileBuffer) {
  const res = await procesarPDF(fileBuffer);
  return res.texto;
}

/**
 * Procesa un PDF completo: extrae texto y calcula hash SHA-256.
 * Utiliza pdf-parse versión v2.0.550 para máxima compatibilidad con PDFs modernos.
 *
 * @param {Buffer} fileBuffer - Buffer del archivo PDF
 * @returns {Promise<Object>} { texto, hash, paginas }
 */
async function procesarPDF(fileBuffer) {
  const hash = calcularHash(fileBuffer);
  let data = null;

  // Intento 1: pdf-parse v2.0.550 (soporta PDFs generados con pdfkit y xrefs modernos)
  try {
    data = await pdfParse(fileBuffer, { version: "v2.0.550" });
  } catch (err1) {
    // Intento 2: versión por defecto de pdf-parse
    try {
      data = await pdfParse(fileBuffer);
    } catch (err2) {
      console.warn("⚠️  pdf-parse no pudo parsear el PDF:", err1.message, err2.message);
    }
  }

  let texto = data && data.text ? data.text : "";
  let paginas = data && data.numpages ? data.numpages : 1;

  // Fallback si no se obtuvo texto: extraer caracteres legibles
  if (!texto || texto.trim().length === 0) {
    try {
      const raw = fileBuffer.toString("binary");
      const ascii = raw.replace(/[^\x20-\x7E\xC0-\xFF\n\r\t]/g, " ");
      texto = ascii.replace(/\s+/g, " ").trim();
    } catch {}
  }

  return {
    texto: texto.trim(),
    hash,
    paginas: Math.max(1, paginas),
  };
}

module.exports = {
  calcularHash,
  extraerTexto,
  procesarPDF,
};
