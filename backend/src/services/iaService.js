// =========================================================================
// Servicio de IA — Comparación genérica de documentos con Groq (gpt-oss-120b)
// =========================================================================
// Compara dos versiones de cualquier documento y detecta diferencias
// clasificadas por tipo (AGREGADO/ELIMINADO/MODIFICADO) y riesgo.
//
// Fallback de 3 niveles:
//   1. Groq API (openai/gpt-oss-120b) — si GROQ_API_KEY está definida
//   2. diffTextoBasico() — diff local por líneas, riesgo SIN_CLASIFICAR
//   3. Reporte mínimo hardcoded — si todo falla
//
// Variable de entorno: GROQ_API_KEY
// Nota: usa fetch nativo de Node.js 18+ para evitar conflictos con el SDK de OpenAI.

const GROQ_BASE_URL = "https://api.groq.com/openai/v1/chat/completions";
const OPENAI_MODEL  = "openai/gpt-oss-120b";


// =========================================================================
//  PROMPT DEL SISTEMA — Comparación genérica de documentos
// =========================================================================

const SYSTEM_PROMPT = `Eres un auditor experto en análisis de documentos. Tu tarea es comparar dos versiones del MISMO documento y detectar TODAS las diferencias.

Responde EXCLUSIVAMENTE con un objeto JSON válido (sin markdown, sin comentarios, sin texto extra) con esta estructura EXACTA:

{
  "hayCambios": true o false,
  "resumen": "descripción breve en español de lo que cambió (máx 3 oraciones)",
  "diferencias": [
    {
      "tipo": "AGREGADO" | "ELIMINADO" | "MODIFICADO",
      "seccion": "dónde está el cambio (párrafo, cláusula, punto, línea)",
      "antes": "texto original exacto (o null si es AGREGADO)",
      "ahora": "texto nuevo exacto (o null si es ELIMINADO)",
      "riesgo": "ALTO" | "MEDIO" | "BAJO",
      "explicacion": "por qué importa este cambio, en lenguaje simple"
    }
  ],
  "riesgoGeneral": "ALTO" | "MEDIO" | "BAJO"
}

CLASIFICACIÓN DE DIFERENCIAS:
- ➕ AGREGADO: texto/puntos/cláusulas que aparecen en la versión nueva y NO en la original
- ➖ ELIMINADO: texto/puntos/cláusulas que estaban en la original y ya NO en la nueva
- ✏️ MODIFICADO: texto que existe en ambas pero cambió (cita exacta de ambos fragmentos)

═══════════════════════════════════════════════════════
  TABLA DE CLASIFICACIÓN DE RIESGO — REGLAS FIJAS
═══════════════════════════════════════════════════════

🔴 ALTO: Cambios que alteran partes sustantivas:
   - Nombres de partes, personas, empresas, responsables
   - Montos, cantidades, cifras numéricas, presupuestos
   - Obligaciones, derechos, alcances del trabajo
   - Ubicaciones, direcciones

🟡 MEDIO: Cambios en aspectos temporales o secundarios:
   - Fechas, plazos, cronogramas
   - Condiciones secundarias, requisitos menores

🟢 BAJO: Cambios cosméticos que NO alteran el significado:
   - Ortografía, errores tipográficos
   - Formato, puntuación, numeración
   - Redacción que no cambia el sentido

═══════════════════════════════════════════════════════

REGLAS:
- Si no hay cambios: hayCambios=false, diferencias=[], riesgoGeneral="BAJO"
- riesgoGeneral = el MAYOR riesgo encontrado entre todas las diferencias
- No inventes diferencias que no existan entre los textos
- Para tipo AGREGADO: "antes" debe null
- Para tipo ELIMINADO: "ahora" debe null
- Para tipo MODIFICADO: ambos campos deben tener el texto exacto`;

// =========================================================================
//  REPORTE POR DEFECTO — Si todo falla
// =========================================================================

const REPORTE_DEFAULT = {
  hayCambios: true,
  resumen: "No se pudo analizar los cambios automáticamente. Los documentos tienen hashes diferentes, lo que confirma que hubo modificaciones. Se requiere revisión manual.",
  diferencias: [],
  riesgoGeneral: "ALTO",
  analizadoPor: "sin_analisis",
  _error: "Ningún método de análisis estuvo disponible.",
};

// =========================================================================
//  UTILIDADES
// =========================================================================

/**
 * Retorna true si GROQ_API_KEY está configurada y no es placeholder.
 */
function estaIAConfigurada() {
  const key = process.env.GROQ_API_KEY;
  return !!key && key.trim().length > 10 && !key.includes("xxxx") && !key.includes("...");
}

/**
 * Limpia la respuesta del LLM: quita envoltorios markdown \`\`\`json...\`\`\`,
 * espacios extra, etc. y hace JSON.parse seguro.
 */
function limpiarYParsearJSON(raw) {
  if (!raw || typeof raw !== "string") return null;

  let limpio = raw.trim();

  // Quitar envoltorios markdown: ```json ... ``` o ``` ... ```
  const markdownMatch = limpio.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (markdownMatch) {
    limpio = markdownMatch[1].trim();
  }

  // Quitar BOM o caracteres invisibles al inicio
  limpio = limpio.replace(/^\uFEFF/, "");

  try {
    return JSON.parse(limpio);
  } catch {
    return null;
  }
}

/**
 * Valida que un reporte tenga la estructura esperada y normaliza.
 */
function validarReporte(parsed) {
  if (!parsed || typeof parsed !== "object") return null;

  const riesgosValidos = ["ALTO", "MEDIO", "BAJO"];
  const tiposValidos = ["AGREGADO", "ELIMINADO", "MODIFICADO"];

  // Validar campos raíz
  const hayCambios = typeof parsed.hayCambios === "boolean" ? parsed.hayCambios : true;
  const resumen = typeof parsed.resumen === "string" ? parsed.resumen : "Cambios detectados.";
  const riesgoGeneral = riesgosValidos.includes(parsed.riesgoGeneral) ? parsed.riesgoGeneral : "ALTO";

  // Validar y filtrar diferencias
  const diferencias = Array.isArray(parsed.diferencias)
    ? parsed.diferencias
      .filter((d) => d && typeof d === "object" && tiposValidos.includes(d.tipo))
      .map((d) => ({
        tipo: d.tipo,
        seccion: String(d.seccion || "No especificada"),
        antes: d.antes ?? null,
        ahora: d.ahora ?? null,
        riesgo: riesgosValidos.includes(d.riesgo) ? d.riesgo : "MEDIO",
        explicacion: String(d.explicacion || ""),
      }))
    : [];

  return { hayCambios, resumen, diferencias, riesgoGeneral };
}

// =========================================================================
//  DIFF BÁSICO DE TEXTO — Respaldo sin IA
// =========================================================================

function diffTextoBasico(textoOriginal, textoNuevo) {
  const lineasOriginal = (textoOriginal || "").split("\n").map((l) => l.trim()).filter(Boolean);
  const lineasNuevo = (textoNuevo || "").split("\n").map((l) => l.trim()).filter(Boolean);

  const setOriginal = new Set(lineasOriginal);
  const setNuevo = new Set(lineasNuevo);

  const diferencias = [];

  // Líneas eliminadas
  for (const linea of lineasOriginal) {
    if (!setNuevo.has(linea) && linea.length > 3) {
      diferencias.push({
        tipo: "ELIMINADO",
        seccion: `Línea: "${linea.slice(0, 50)}${linea.length > 50 ? "..." : ""}"`,
        antes: linea,
        ahora: null,
        riesgo: "SIN_CLASIFICAR",
        explicacion: "Línea eliminada del documento. Requiere revisión manual para determinar su importancia.",
      });
    }
  }

  // Líneas agregadas
  for (const linea of lineasNuevo) {
    if (!setOriginal.has(linea) && linea.length > 3) {
      diferencias.push({
        tipo: "AGREGADO",
        seccion: `Línea: "${linea.slice(0, 50)}${linea.length > 50 ? "..." : ""}"`,
        antes: null,
        ahora: linea,
        riesgo: "SIN_CLASIFICAR",
        explicacion: "Línea agregada al documento. Requiere revisión manual para determinar su importancia.",
      });
    }
  }

  const diferenciasLimitadas = diferencias.slice(0, 20);
  const hayCambios = diferenciasLimitadas.length > 0;

  return {
    hayCambios,
    resumen: hayCambios
      ? `Se encontraron ${diferencias.length} diferencia(s) entre los documentos mediante comparación de texto. ${diferencias.length > 20 ? `Se muestran las primeras 20 de ${diferencias.length}.` : ""} Clasificación de riesgo no disponible sin IA.`
      : "Los textos de ambos documentos son idénticos.",
    diferencias: diferenciasLimitadas,
    riesgoGeneral: hayCambios ? "SIN_CLASIFICAR" : "BAJO",
    analizadoPor: "diff_local",
  };
}

// =========================================================================
//  GROQ API — Comparación con IA
// =========================================================================

async function compararDocumentos(textoOriginal, textoNuevo) {
  // --- Nivel 1: Intentar con Groq (gpt-oss-120b), con retry en rate limit ---
  if (estaIAConfigurada()) {
    try {
      const resultado = await llamarGroqConRetry(textoOriginal, textoNuevo);
      if (resultado) {
        console.log(`   ✅ Análisis completado con Groq (${OPENAI_MODEL})`);
        return { ...resultado, analizadoPor: "openai" };
      }
    } catch (error) {
      console.warn("   ⚠️  Groq falló, cayendo a diff local:", error.message);
    }
  } else {
    console.log("   ℹ️  GROQ_API_KEY no configurada, usando diff local.");
  }

  // --- Nivel 2: Diff de texto básico ---
  try {
    console.log("   🔧 Ejecutando diff de texto básico...");
    const diffResult = diffTextoBasico(textoOriginal, textoNuevo);
    console.log(`   ✅ Diff local: ${diffResult.diferencias.length} diferencia(s) encontrada(s)`);
    return diffResult;
  } catch (diffError) {
    console.error("   ❌ Diff de texto también falló:", diffError.message);
  }

  // --- Nivel 3: Reporte mínimo hardcoded ---
  return { ...REPORTE_DEFAULT };
}

/**
 * Extrae el tiempo de espera (en ms) del mensaje de rate limit de Groq.
 * Ejemplo: "Please try again in 27.495s"
 */
function extraerRetryDelay(mensaje) {
  const match = mensaje.match(/try again in ([\d.]+)s/i);
  if (match) return Math.ceil(parseFloat(match[1]) * 1000) + 500; // +500ms de margen
  return 35_000; // default 35s si no se puede parsear
}

async function llamarGroqConRetry(textoOriginal, textoNuevo, intentos = 2) {
  for (let i = 0; i < intentos; i++) {
    try {
      return await llamarGroq(textoOriginal, textoNuevo);
    } catch (err) {
      const esRateLimit = err.message.includes("Rate limit") || err.message.includes("rate_limit") || err.message.includes("TPM") || err.message.includes("429");
      if (esRateLimit && i < intentos - 1) {
        const delay = extraerRetryDelay(err.message);
        console.warn(`   ⏳ Rate limit Groq. Reintentando en ${(delay / 1000).toFixed(1)}s...`);
        await new Promise(r => setTimeout(r, delay));
        console.log("   🔄 Reintentando llamada a Groq...");
      } else {
        throw err;
      }
    }
  }
}

async function llamarGroq(textoOriginal, textoNuevo) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY no disponible");

  // Truncar textos al máximo para no exceder el límite de 8,000 TPM de Groq
  // ~3,500 chars ≈ 875 tokens por texto; 2 textos ≈ 1,750 + prompt sistema ≈ 3,500 tokens total
  const maxLen = 3_500;
  const original = textoOriginal.length > maxLen
    ? textoOriginal.slice(0, maxLen) + "\n[... texto truncado ...]"
    : textoOriginal;
  const nuevo = textoNuevo.length > maxLen
    ? textoNuevo.slice(0, maxLen) + "\n[... texto truncado ...]"
    : textoNuevo;

  const prompt = `Compara estas dos versiones del mismo documento y detecta TODAS las diferencias:

══════ VERSIÓN ORIGINAL (REGISTRADA) ══════
${original}

══════ VERSIÓN NUEVA (A VERIFICAR) ══════
${nuevo}`;

  const body = JSON.stringify({
    model: OPENAI_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user",   content: prompt },
    ],
    temperature: 0.1,
    max_tokens: 2048,
  });

  const response = await fetch(GROQ_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body,
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Groq HTTP ${response.status}`);
  }

  const data = await response.json();
  const rawText = data?.choices?.[0]?.message?.content;

  if (!rawText) {
    throw new Error("Groq devolvió respuesta vacía");
  }

  const parsed = limpiarYParsearJSON(rawText);
  if (!parsed) {
    throw new Error("No se pudo parsear el JSON de la respuesta de Groq");
  }

  const validado = validarReporte(parsed);
  if (!validado) {
    throw new Error("La respuesta de Groq no tiene la estructura esperada");
  }

  return validado;
}

// =========================================================================
//  EXPORTS
// =========================================================================

module.exports = {
  compararDocumentos,
  diffTextoBasico,
  estaIAConfigurada,
};
