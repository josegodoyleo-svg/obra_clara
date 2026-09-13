// =========================================================================
// Generador de PDFs de demostración para ObraClara AI
// =========================================================================
// Convierte los archivos .txt de contratos de demo en PDFs reales.
// Uso: node demo/generar_pdfs.js
//
// Dependencia: npm install pdfkit (ya incluida en devDependencies)

const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const DEMO_DIR = __dirname;

function crearPDF(archivoTxt, archivoPdf, titulo) {
  const rawTexto = fs.readFileSync(path.join(DEMO_DIR, archivoTxt), "utf-8");
  const texto = rawTexto.replace(/°/g, " No. ").replace(/[═─]/g, "-");
  const doc = new PDFDocument({
    size: "LETTER",
    margins: { top: 60, bottom: 60, left: 65, right: 65 },
  });

  const stream = fs.createWriteStream(path.join(DEMO_DIR, archivoPdf));
  doc.pipe(stream);

  // Título
  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .text("GOBIERNO AUTÓNOMO MUNICIPAL DE QUILLACOLLO", { align: "center" })
    .moveDown(0.3)
    .fontSize(9)
    .font("Helvetica")
    .text("Departamento de Cochabamba — Estado Plurinacional de Bolivia", {
      align: "center",
    })
    .moveDown(1);

  // Línea separadora
  doc
    .moveTo(65, doc.y)
    .lineTo(547, doc.y)
    .stroke()
    .moveDown(0.5);

  // Contenido del contrato
  const lineas = texto.split("\n");
  for (const linea of lineas) {
    // Saltar las líneas decorativas de ====
    if (linea.match(/^={5,}/) || linea.match(/^─{5,}/)) continue;

    // Detectar títulos (PRIMERA.-, SEGUNDA.-, etc.)
    if (linea.match(/^[A-ZÁÉÍÓÚ]+\.-/)) {
      doc.moveDown(0.5);
      doc.font("Helvetica-Bold").fontSize(10).text(linea.trim());
      doc.font("Helvetica").fontSize(9);
      continue;
    }

    // Detectar secciones en mayúsculas
    if (
      linea.trim().length > 10 &&
      linea.trim() === linea.trim().toUpperCase() &&
      !linea.startsWith("   ")
    ) {
      doc.font("Helvetica-Bold").fontSize(10).text(linea.trim(), { align: "center" });
      doc.font("Helvetica").fontSize(9);
      continue;
    }

    // Texto normal
    if (linea.trim() === "") {
      doc.moveDown(0.3);
    } else {
      doc.font("Helvetica").fontSize(9).text(linea, { lineGap: 1.5 });
    }

    // Salto de página si estamos muy abajo
    if (doc.y > 680) {
      doc.addPage();
    }
  }

  doc.end();

  return new Promise((resolve) => {
    stream.on("finish", () => {
      const stats = fs.statSync(path.join(DEMO_DIR, archivoPdf));
      console.log(
        `  ✅ ${archivoPdf} generado (${(stats.size / 1024).toFixed(1)} KB)`
      );
      resolve();
    });
  });
}

async function main() {
  console.log("\n🏗️  ObraClara AI — Generador de PDFs de Demo\n");

  await crearPDF(
    "contrato_original.txt",
    "contrato_original.pdf",
    "Contrato Original"
  );

  await crearPDF(
    "contrato_modificado.txt",
    "contrato_modificado.pdf",
    "Contrato Modificado"
  );

  console.log("\n✅ Ambos PDFs generados en /demo/");
  console.log("   Úsalos para la demo del hackathon.\n");
}

main().catch(console.error);
