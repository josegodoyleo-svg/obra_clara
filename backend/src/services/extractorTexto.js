// =========================================================================
// Servicio de Extracción de Texto Multiformato — ObraClara AI
// =========================================================================
// Extrae texto plano de documentos en formatos: .pdf, .docx, .xlsx, .txt
// Calcula el hash criptográfico SHA-256 sobre el buffer binario completo original.

const crypto = require("crypto");
const path = require("path");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const XLSX = require("xlsx");

const FORMATOS_SOPORTADOS = [".pdf", ".docx", ".xlsx", ".txt"];

/**
 * Calcula el hash SHA-256 del buffer completo del archivo (sin importar el formato).
 * @param {Buffer} buffer - Buffer original del archivo
 * @returns {string} Hash SHA-256 hexadecimal (64 caracteres)
 */
function calcularHash(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

/**
 * Normaliza la extensión a minúsculas con punto (ej: ".pdf", ".docx").
 * @param {string} extONombre - Nombre de archivo o extensión
 * @returns {string} Extensión normalizada
 */
function normalizarExtension(extONombre) {
  if (!extONombre || typeof extONombre !== "string") return "";
  const ext = path.extname(extONombre) || extONombre;
  return ext.toLowerCase().startsWith(".") ? ext.toLowerCase() : `.${ext.toLowerCase()}`;
}

/**
 * Extrae texto plano de un archivo según su formato.
 *
 * @param {Buffer} buffer - Buffer con el contenido binario del archivo
 * @param {string} extensionOFilename - Nombre del archivo o su extensión
 * @returns {Promise<string>} Texto plano extraído del documento
 */
async function extraerTexto(buffer, extensionOFilename) {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new Error("El archivo no contiene un buffer de datos válido.");
  }

  const ext = normalizarExtension(extensionOFilename);

  switch (ext) {
    case ".txt": {
      // Lectura nativa directa del buffer en codificación UTF-8
      return buffer.toString("utf-8");
    }

    case ".docx": {
      // Extracción de texto plano de Word con mammoth (sin imágenes)
      try {
        const result = await mammoth.extractRawText({ buffer });
        return result.value ? result.value.trim() : "";
      } catch (err) {
        console.error("❌ Error en mammoth al procesar .docx:", err.message);
        throw new Error(`Error al leer el archivo Word (.docx): ${err.message}`);
      }
    }

    case ".xlsx": {
      // Conversión de todas las hojas de cálculo a texto / formato CSV
      try {
        const workbook = XLSX.read(buffer, { type: "buffer" });
        const hojas = [];

        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName];
          const csv = XLSX.utils.sheet_to_csv(sheet);
          if (csv && csv.trim().length > 0) {
            hojas.push(`--- HOJA: ${sheetName} ---\n${csv.trim()}`);
          }
        }

        if (hojas.length === 0) {
          return "La hoja de cálculo está vacía.";
        }

        return hojas.join("\n\n");
      } catch (err) {
        console.error("❌ Error en xlsx al procesar .xlsx:", err.message);
        throw new Error(`Error al leer la hoja de cálculo Excel (.xlsx): ${err.message}`);
      }
    }

    case ".pdf": {
      // Extracción de PDF con pdf-parse v2.0.550 y fallback
      let data = null;
      try {
        data = await pdfParse(buffer, { version: "v2.0.550" });
      } catch (err1) {
        try {
          data = await pdfParse(buffer);
        } catch (err2) {
          console.warn("⚠️  pdf-parse advierte en .pdf:", err1.message, err2.message);
        }
      }

      let texto = data && data.text ? data.text.trim() : "";

      // Fallback a recuperación de caracteres si el texto resultó vacío
      if (!texto || texto.length === 0) {
        try {
          const raw = buffer.toString("binary");
          const ascii = raw.replace(/[^\x20-\x7E\xC0-\xFF\n\r\t]/g, " ");
          texto = ascii.replace(/\s+/g, " ").trim();
        } catch {}
      }

      return texto;
    }

    default:
      throw new Error(
        `Formato no soportado "${ext || extensionOFilename}". ObraClara acepta archivos: ${FORMATOS_SOPORTADOS.join(", ")}`
      );
  }
}

/**
 * Procesa un archivo completo: calcula el hash SHA-256 inmutable sobre el buffer
 * completo y extrae su texto plano para el análisis de la IA.
 *
 * @param {Buffer} buffer - Buffer original del archivo
 * @param {string} extensionOFilename - Nombre del archivo o su extensión
 * @returns {Promise<{ texto: string, hash: string, formato: string }>}
 */
async function procesarArchivo(buffer, extensionOFilename) {
  const ext = normalizarExtension(extensionOFilename);
  const hash = calcularHash(buffer);
  const texto = await extraerTexto(buffer, ext);

  return {
    texto: texto.trim(),
    hash,
    formato: ext.replace(".", "").toUpperCase(),
  };
}

module.exports = {
  calcularHash,
  extraerTexto,
  procesarArchivo,
  normalizarExtension,
  FORMATOS_SOPORTADOS,
};
