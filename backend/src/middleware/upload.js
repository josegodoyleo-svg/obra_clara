// =========================================================================
// Middleware de Multer — Upload de Documentos Multiformato
// =========================================================================
// Acepta archivos: .pdf, .docx, .xlsx, .txt con límite de 10 MB

const multer = require("multer");
const path = require("path");

const EXTENSIONES_PERMITIDAS = [".pdf", ".docx", ".xlsx", ".txt"];

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    if (EXTENSIONES_PERMITIDAS.includes(ext)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Formato de archivo no permitido. Solo se aceptan: ${EXTENSIONES_PERMITIDAS.join(", ")}`
        ),
        false
      );
    }
  },
});

module.exports = upload;
