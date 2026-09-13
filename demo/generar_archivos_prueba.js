// =========================================================================
// Generador de archivos de prueba multiformato para ObraClara AI
// =========================================================================
// Genera:
// - demo/contrato_obra.xlsx  (Excel)
// - demo/contrato_obra.docx  (Word)

const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");
const JSZip = require("jszip");

const DEMO_DIR = __dirname;

// 1. Generar archivo Excel (.xlsx)
function generarXLSX() {
  const wb = XLSX.utils.book_new();

  const datosContrato = [
    ["GOBIERNO AUTÓNOMO MUNICIPAL DE QUILLACOLLO", "", ""],
    ["CONTRATO ADMINISTRATIVO DE OBRA PÚBLICA", "N° 055/2026", ""],
    ["", "", ""],
    ["CAMPO", "VALOR", "NOTAS"],
    ["Trabajo", "Pavimentado y asfaltado de avenida principal", "Fase 1"],
    ["Cantidad", "800 metros lineales", "Ancho: 12 metros"],
    ["Presupuesto", "Bs. 120.000,00", "Recursos coparticipación tributaria"],
    ["Responsable", "Constructora del Valle SRL", "NIT: 1045892019"],
    ["Ubicación", "Avenida Blanco Galindo Km 11, Quillacollo, Cochabamba", ""],
    ["Fecha Límite", "20 de Diciembre de 2026", "Plazo 90 días calendario"],
  ];

  const ws = XLSX.utils.aoa_to_sheet(datosContrato);
  XLSX.utils.book_append_sheet(wb, ws, "Contrato Obra");

  const rutaXlsx = path.join(DEMO_DIR, "contrato_obra.xlsx");
  XLSX.writeFile(wb, rutaXlsx);
  console.log("✅ demo/contrato_obra.xlsx generado correctamente.");
}

// 2. Generar archivo Word (.docx) válido con JSZip
async function generarDOCX() {
  const zip = new JSZip();

  // [Content_Types].xml
  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`
  );

  // _rels/.rels
  zip.file(
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
  );

  // word/document.xml con el texto del contrato
  const xmlDocumento = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>GOBIERNO AUTÓNOMO MUNICIPAL DE QUILLACOLLO - DEPARTAMENTO DE COCHABAMBA</w:t></w:r></w:p>
    <w:p><w:r><w:t>CONTRATO DE OBRA PÚBLICA N° 060/2026</w:t></w:r></w:p>
    <w:p><w:r><w:t>PRIMERA (PARTES): Contratante: Gobierno Autónomo Municipal de Quillacollo. Contratista: Ingenieros y Constructores Andinos SRL.</w:t></w:r></w:p>
    <w:p><w:r><w:t>SEGUNDA (OBJETO): Ejecución de trabajos de construcción de canal de drenaje pluvial en el Barrio Manaco.</w:t></w:r></w:p>
    <w:p><w:r><w:t>TERCERA (CANTIDAD Y ESPECIFICACIONES): Comprende una longitud de 650 metros lineales de canal abierto revestido de hormigón.</w:t></w:r></w:p>
    <w:p><w:r><w:t>CUARTA (PRESUPUESTO): El monto total convenido es de Bs. 95.000,00 (NOVENTA Y CINCO MIL 00/100 BOLIVIANOS).</w:t></w:r></w:p>
    <w:p><w:r><w:t>QUINTA (UBICACIÓN): Barrio Manaco, Distrito 4 del Municipio de Quillacollo, Cochabamba, Bolivia.</w:t></w:r></w:p>
    <w:p><w:r><w:t>SEXTA (PLAZO): La entrega definitiva será el 15 de Noviembre de 2026.</w:t></w:r></w:p>
  </w:body>
</w:document>`;

  zip.file("word/document.xml", xmlDocumento);

  const buffer = await zip.generateAsync({ type: "nodebuffer" });
  const rutaDocx = path.join(DEMO_DIR, "contrato_obra.docx");
  fs.writeFileSync(rutaDocx, buffer);
  console.log("✅ demo/contrato_obra.docx generado correctamente.");
}

async function main() {
  console.log("\n📁 Generando archivos de prueba multiformato...\n");
  generarXLSX();
  await generarDOCX();
  console.log("\n🎉 Archivos de prueba listos en la carpeta /demo/.\n");
}

main().catch(console.error);
