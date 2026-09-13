import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { listarObras, verificarObra } from "../services/api";

export default function MisObras() {
  const [obras, setObras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  // Modal state
  const [modalObra, setModalObra] = useState(null);
  const [archivo, setArchivo] = useState(null);
  const [verificando, setVerificando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [modalError, setModalError] = useState(null);
  const fileRef = useRef(null);

  const fetchObras = async () => {
    setLoading(true);
    try {
      const data = await listarObras();
      setObras(data.obras || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };



  useEffect(() => { fetchObras(); }, []);

  const openModal = (obra) => {
    setModalObra(obra);
    setArchivo(null);
    setResultado(null);
    setModalError(null);
  };

  const closeModal = () => {
    setModalObra(null);
    setArchivo(null);
    setResultado(null);
    setModalError(null);
  };

  const handleVerificar = async () => {
    if (!archivo || !modalObra) return;
    setVerificando(true);
    setModalError(null);
    try {
      const data = await verificarObra(modalObra.id, archivo);
      setResultado(data);
      fetchObras(); // Refresh list
    } catch (err) {
      setModalError(err.message);
    } finally {
      setVerificando(false);
    }
  };

  const riskBadge = (riesgo) => {
    const styles = {
      ALTO: "bg-red-100 text-red-800 border-red-200",
      MEDIO: "bg-amber-100 text-amber-800 border-amber-200",
      BAJO: "bg-green-100 text-green-800 border-green-200",
      SIN_CLASIFICAR: "bg-slate-100 text-slate-700 border-slate-300",
    };
    const emojis = { ALTO: "🔴", MEDIO: "🟡", BAJO: "🟢", SIN_CLASIFICAR: "⚪" };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full border ${styles[riesgo] || styles.SIN_CLASIFICAR}`}>
        {emojis[riesgo] || "⚪"} {riesgo || "N/A"}
      </span>
    );
  };

  const tipoBadge = (tipo) => {
    const styles = {
      AGREGADO: "bg-blue-100 text-blue-800 border-blue-200",
      ELIMINADO: "bg-red-100 text-red-800 border-red-200",
      MODIFICADO: "bg-amber-100 text-amber-800 border-amber-200",
    };
    const icons = { AGREGADO: "➕", ELIMINADO: "➖", MODIFICADO: "✏️" };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full border ${styles[tipo] || styles.MODIFICADO}`}>
        {icons[tipo] || "•"} {tipo}
      </span>
    );
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">📑 Mis Documentos</h2>
          <p className="text-slate-500 mt-1">
            {obras.length} documento{obras.length !== 1 ? "s" : ""} registrado{obras.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchObras}
            className="px-4 py-2 text-sm font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors"
          >
            🔄 Actualizar
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <svg className="animate-spin h-8 w-8 text-brand-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <strong>❌ Error:</strong> {error}
        </div>
      )}

      {!loading && obras.length === 0 && !error && (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
          {/* Ilustración */}
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-brand-50 to-brand-100 border border-brand-200 mb-6 shadow-inner">
            <span className="text-5xl select-none" role="img" aria-label="Sin documentos">📑</span>
          </div>

          <h3 className="text-xl font-bold text-slate-800 mb-2">
            No hay documentos registrados aún
          </h3>
          <p className="text-slate-500 text-sm max-w-xs mx-auto mb-8 leading-relaxed">
            Registra tu primer documento para protegerlo en blockchain y detectar cambios no autorizados con IA.
          </p>

          <Link
            to="/"
            className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold rounded-xl hover:from-brand-600 hover:to-brand-700 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 transform"
          >
            <span>📄</span>
            Registrar primer documento
          </Link>

          <p className="text-xs text-slate-400 mt-6">
            Soporta PDF, Word, Excel y TXT · Máx 10 MB
          </p>
        </div>
      )}

      {/* Cards grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {obras.map((obra) => (
          <div
            key={obra.id}
            className={`bg-white rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition-shadow ${
              obra.congelada ? "border-red-300" : "border-slate-200"
            }`}
          >
            {/* Status bar */}
            <div
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 ${
                obra.congelada
                  ? "bg-red-50 text-red-700 animate-pulse-alert"
                  : "bg-emerald-50 text-emerald-700"
              }`}
            >
              <span>{obra.congelada ? "❄️" : "✅"}</span>
              <span>{obra.congelada ? "CONGELADA" : "ACTIVA"}</span>
            </div>

            <div className="p-5">
              <h3 className="font-bold text-slate-800 text-lg leading-tight">
                {obra.nombre}
              </h3>
              {obra.descripcion && (
                <p className="text-slate-500 text-sm mt-1 line-clamp-2">
                  {obra.descripcion}
                </p>
              )}

              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">ID</span>
                  <span className="font-mono text-slate-600">#{obra.id}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Versiones</span>
                  <span className="font-mono text-slate-600">{obra.totalVersiones}</span>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Link
                  to={`/obras/${obra.id}`}
                  className="flex-1 text-center px-3 py-2 text-xs font-semibold text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors"
                >
                  Ver detalle
                </Link>
                <button
                  onClick={() => openModal(obra)}
                  className="flex-1 px-3 py-2 text-xs font-semibold text-accent-600 bg-accent-50 hover:bg-accent-100 rounded-lg transition-colors"
                >
                  🔍 Verificar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Verify Modal */}
      {modalObra && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={closeModal}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">
                  🔍 Verificar Versión
                </h3>
                <p className="text-slate-500 text-sm">
                  {modalObra.nombre} — Documento #{modalObra.id}
                </p>
              </div>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>

            <div className="p-6">
              {!resultado ? (
                <>
                  {/* File upload */}
                  <div
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                      archivo ? "border-brand-300 bg-brand-50" : "border-slate-300 hover:border-brand-400"
                    }`}
                    onClick={() => fileRef.current?.click()}
                  >
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".pdf,.docx,.xlsx,.txt"
                      onChange={(e) => setArchivo(e.target.files[0])}
                      className="hidden"
                    />
                    {archivo ? (
                      <p className="text-brand-700 font-medium text-sm">📎 {archivo.name} ({(archivo.size / 1024).toFixed(1)} KB)</p>
                    ) : (
                      <div>
                        <p className="text-slate-600 font-medium text-sm">📤 Sube la nueva versión del documento</p>
                        <p className="text-xs text-slate-400 mt-1">Soporta: PDF, Word (.docx), Excel (.xlsx) o TXT</p>
                      </div>
                    )}
                  </div>

                  {modalError && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      ❌ {modalError}
                    </div>
                  )}

                  <button
                    onClick={handleVerificar}
                    disabled={!archivo || verificando}
                    className="mt-4 w-full py-2.5 px-4 bg-accent-500 text-white font-semibold rounded-xl hover:bg-accent-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {verificando ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Verificando...
                      </>
                    ) : (
                      "Comparar con blockchain"
                    )}
                  </button>
                </>
              ) : (
                /* Results */
                <div>
                  {!resultado.modificado ? (
                    <div className="text-center py-6">
                      <span className="text-5xl">✅</span>
                      <p className="text-lg font-bold text-emerald-700 mt-3">
                        Documento sin cambios
                      </p>
                      <p className="text-slate-500 text-sm mt-1">
                        El hash coincide con el registrado en blockchain
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                        <h4 className="font-bold text-red-800 flex items-center gap-2">
                          ⚠️ CAMBIO DETECTADO — Documento congelado
                        </h4>
                        {resultado.reporte && (
                          <p className="text-red-700 text-sm mt-2">
                            {resultado.reporte.resumen}
                          </p>
                        )}
                        {resultado.reporte?.analizadoPor && (
                          <p className="text-xs text-red-500 mt-1 italic">
                            Analizado por: {resultado.reporte.analizadoPor === "openai" ? "🤖 GPT-OSS 120B" : resultado.reporte.analizadoPor === "gemini" ? "🤖 Gemini 2.0 Flash" : resultado.reporte.analizadoPor === "diff_local" ? "🔧 Diff de texto local" : resultado.reporte.analizadoPor}
                          </p>
                        )}
                      </div>

                      {resultado.reporte?.diferencias?.length > 0 && (
                        <div className="space-y-3">
                          {resultado.reporte.diferencias.map((d, i) => (
                            <div key={i} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
                              <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                                <div className="flex items-center gap-2">
                                  {tipoBadge(d.tipo)}
                                  <span className="text-xs text-slate-500">{d.seccion}</span>
                                </div>
                                {riskBadge(d.riesgo)}
                              </div>
                              {d.tipo === "MODIFICADO" && (
                                <div className="space-y-1 text-sm">
                                  <div className="flex gap-2">
                                    <span className="text-red-500 font-medium shrink-0">Antes:</span>
                                    <span className="text-red-700 line-through">{d.antes ?? "—"}</span>
                                  </div>
                                  <div className="flex gap-2">
                                    <span className="text-emerald-500 font-medium shrink-0">Ahora:</span>
                                    <span className="text-emerald-700 font-medium">{d.ahora ?? "—"}</span>
                                  </div>
                                </div>
                              )}
                              {d.tipo === "ELIMINADO" && (
                                <p className="text-sm text-red-700 line-through">
                                  {d.antes ?? "—"}
                                </p>
                              )}
                              {d.tipo === "AGREGADO" && (
                                <p className="text-sm text-emerald-700 font-medium">
                                  {d.ahora ?? "—"}
                                </p>
                              )}
                              {d.explicacion && (
                                <p className="text-xs text-slate-500 mt-1 italic">{d.explicacion}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {resultado.reporte?.riesgoGeneral && (
                        <div className="mt-4 text-center">
                          <span className="text-xs text-slate-500 uppercase tracking-wide">Riesgo general</span>
                          <div className="mt-1">{riskBadge(resultado.reporte.riesgoGeneral)}</div>
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    onClick={closeModal}
                    className="mt-6 w-full py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
