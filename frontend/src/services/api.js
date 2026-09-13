const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

/**
 * Función auxiliar para realizar peticiones HTTP con mensajes de error descriptivos.
 */
async function peticion(url, opciones = {}) {
  try {
    const res = await fetch(url, opciones);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Error del servidor (${res.status})`);
    }
    return await res.json();
  } catch (error) {
    // Timeout del navegador (la transacción blockchain puede tardar 30-90s)
    if (error.name === "AbortError" || error.message.includes("timeout") || error.message.includes("signal")) {
      throw new Error(
        "La operación tardó demasiado. Si estás en modo blockchain real, la transacción puede tardar hasta 2 minutos en confirmarse. Por favor espera y recarga la página."
      );
    }
    // Backend apagado o sin conexión
    if (error.message.includes("Failed to fetch") || error.name === "TypeError") {
      throw new Error(
        `No se pudo conectar con el servidor backend en ${API_URL}. Verifica que el backend esté ejecutándose en el puerto 3001 (ejecuta: npm run dev:backend).`
      );
    }
    throw error;
  }
}

/**
 * Registrar nueva obra con PDF.
 * POST /api/obras (multipart/form-data)
 */
export async function registrarObra(nombre, descripcion, archivoPDF) {
  const formData = new FormData();
  formData.append("nombre", nombre);
  formData.append("descripcion", descripcion);
  formData.append("archivo", archivoPDF);

  return peticion(`${API_URL}/obras`, {
    method: "POST",
    body: formData,
  });
}

/**
 * Listar todas las obras.
 * GET /api/obras
 */
export async function listarObras() {
  return peticion(`${API_URL}/obras`);
}

/**
 * Obtener detalle de una obra.
 * GET /api/obras/:id
 */
export async function obtenerObra(id) {
  return peticion(`${API_URL}/obras/${id}`);
}

/**
 * Verificar nueva versión de un contrato.
 * POST /api/obras/:id/verificar (multipart/form-data)
 */
export async function verificarObra(id, archivoPDF) {
  const formData = new FormData();
  formData.append("archivo", archivoPDF);

  return peticion(`${API_URL}/obras/${id}/verificar`, {
    method: "POST",
    body: formData,
  });
}

/**
 * Aprobar cambio de contrato.
 * POST /api/obras/:id/aprobar
 */
export async function aprobarCambio(id, hash) {
  return peticion(`${API_URL}/obras/${id}/aprobar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hash }),
  });
}

/**
 * Rechazar cambio de contrato.
 * POST /api/obras/:id/rechazar
 */
export async function rechazarCambio(id) {
  return peticion(`${API_URL}/obras/${id}/rechazar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Obtener el modo de operación blockchain actual.
 * GET /api/modo
 */
export async function obtenerModo() {
  return peticion(`${API_URL}/modo`);
}
