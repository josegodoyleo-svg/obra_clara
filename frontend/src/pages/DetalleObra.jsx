import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { obtenerObra, aprobarCambio, rechazarCambio } from "../services/api";
import { useWallet } from "../context/WalletContext";

const EXPLORER_URL = "https://testnet-explorer.hskchain.net";
const ESTADOS = {
  PENDIENTE: { label: "Pendiente", icon: "⏳", color: "text-amber-600 bg-amber-50 border-amber-200" },
  APROBADA: { label: "Aprobada", icon: "✅", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  RECHAZADA: { label: "Rechazada", icon: "❌", color: "text-red-700 bg-red-50 border-red-200" },
};

export default function DetalleObra() {
  const { id } = useParams();
  const { address } = useWallet();
  const [obra, setObra] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null); // "aprobar" | "rechazar" | null

  const fetchObra = async () => {
    setLoading(true);
    try {
      const data = await obtenerObra(id);
      setObra(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchObra(); }, [id]);

  // HACK PARA LA DEMO: Todos pueden ver los botones de administrador
  const isAdmin = true;

  // Get the pending version's hash for approval
  const pendingVersion = obra?.versiones?.find((v) => v.estado === "PENDIENTE");

  const handleAprobar = async () => {
    if (!pendingVersion) return;
    setActionLoading("aprobar");
    try {
      await aprobarCambio(id, pendingVersion.hash);
      await fetchObra();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRechazar = async () => {
    setActionLoading("rechazar");
    try {
      await rechazarCambio(id);
      await fetchObra();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Build the change report from the last local version data
  // The backend stores AI comparison reports — here we reconstruct it for display
  const lastVersionLocal = obra?.versiones?.[obra.versiones.length - 1];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg className="animate-spin h-8 w-8 text-brand-500" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (error && !obra) {
    return (
      <div className="max-w-3xl mx-auto p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
        <strong>❌ Error:</strong> {error}
      </div>
    );
  }

  if (!obra) return null;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-slate-500">
        <Link to="/obras" className="hover:text-brand-600 transition-colors">
          Mis Documentos
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">Documento #{obra.id}</span>
      </div>

      {/* FROZEN ALERT */}
      {obra.congelada && (
        <div className="mb-6 bg-red-50 border-2 border-red-300 rounded-2xl p-6 animate-pulse-alert">
          <div className="flex items-start gap-3">
            <span className="text-3xl">⚠️</span>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-red-800">
                CAMBIO DETECTADO — Documento Congelado
              </h3>
              <p className="text-red-700 mt-1 text-sm">
                Se detectó una modificación en el documento. El hash no coincide con el registrado en blockchain.
                El documento permanecerá congelado hasta que un administrador lo revise.
              </p>

              {/* AI Change Report — shown inline when we have version data */}
              {obra.versiones && obra.versiones.length >= 2 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-2">
                    Hashes comparados
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-white/70 rounded-lg p-3 border border-red-200">
                      <span className="text-xs text-slate-500">Hash aprobado</span>
                      <p className="font-mono text-xs text-slate-700 mt-1 break-all">
                        {obra.versiones.find((v) => v.estado === "APROBADA")?.hash || "—"}
                      </p>
                    </div>
                    <div className="bg-white/70 rounded-lg p-3 border border-red-200">
                      <span className="text-xs text-slate-500">Hash nuevo (pendiente)</span>
                      <p className="font-mono text-xs text-red-700 mt-1 break-all">
                        {pendingVersion?.hash || obra.versiones[obra.versiones.length - 1]?.hash || "—"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Admin actions */}
              {isAdmin && (
                <div className="mt-5 flex gap-3">
                  <button
                    onClick={handleAprobar}
                    disabled={!!actionLoading}
                    className="px-5 py-2.5 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-md"
                  >
                    {actionLoading === "aprobar" ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Aprobando...
                      </>
                    ) : (
                      "✅ APROBAR CAMBIO"
                    )}
                  </button>
                  <button
                    onClick={handleRechazar}
                    disabled={!!actionLoading}
                    className="px-5 py-2.5 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-md"
                  >
                    {actionLoading === "rechazar" ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Rechazando...
                      </>
                    ) : (
                      "❌ RECHAZAR CAMBIO"
                    )}
                  </button>
                </div>
              )}

              {!isAdmin && address && (
                <p className="mt-4 text-xs text-red-500 italic">
                  Solo el administrador ({obra.administrador?.slice(0, 10)}...) puede aprobar o rechazar cambios.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <strong>❌ Error:</strong> {error}
        </div>
      )}

      {/* Obra info card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Status bar */}
        <div
          className={`px-6 py-3 text-sm font-bold uppercase tracking-wide flex items-center gap-2 ${
            obra.congelada
              ? "bg-red-50 text-red-700 border-b border-red-200"
              : "bg-emerald-50 text-emerald-700 border-b border-emerald-200"
          }`}
        >
          <span>{obra.congelada ? "❄️" : "✅"}</span>
          <span>{obra.congelada ? "CONGELADA" : "ACTIVA"}</span>
          <span className="ml-auto text-xs font-normal opacity-70">
            Obra #{obra.id} · {obra.totalVersiones} version{obra.totalVersiones !== 1 ? "es" : ""}
          </span>
        </div>

        <div className="p-6">
          <h2 className="text-2xl font-bold text-slate-800">{obra.nombre}</h2>
          {obra.descripcion && (
            <p className="text-slate-500 mt-1">{obra.descripcion}</p>
          )}

          {/* Admin info */}
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <div>
              <span className="text-slate-400">Administrador</span>
              <a
                href={`${EXPLORER_URL}/address/${obra.administrador}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 font-mono text-brand-600 hover:text-brand-700"
              >
                {obra.administrador?.slice(0, 10)}...{obra.administrador?.slice(-6)}
              </a>
              {isAdmin && (
                <span className="ml-2 px-2 py-0.5 bg-brand-100 text-brand-700 text-xs font-semibold rounded-full">
                  Tú
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* VERSION HISTORY TIMELINE */}
      <div className="mt-8">
        <h3 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
          📜 Historial de Versiones
        </h3>

        <div className="space-y-0">
          {obra.versiones?.map((version, index) => {
            const estadoInfo = ESTADOS[version.estado] || ESTADOS.PENDIENTE;
            const isFirst = index === 0;
            const isLast = index === obra.versiones.length - 1;

            return (
              <div key={index} className="relative flex gap-4">
                {/* Timeline line */}
                {!isLast && (
                  <div className="absolute left-[19px] top-10 bottom-0 w-0.5 bg-gradient-to-b from-slate-300 to-slate-200" />
                )}

                {/* Timeline dot */}
                <div className="relative z-10 flex-shrink-0 mt-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 shadow-sm ${
                      version.estado === "APROBADA"
                        ? "bg-emerald-50 border-emerald-300"
                        : version.estado === "RECHAZADA"
                        ? "bg-red-50 border-red-300"
                        : "bg-amber-50 border-amber-300"
                    }`}
                  >
                    {estadoInfo.icon}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 pb-8">
                  <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                    {/* Header row */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-800">
                          Versión {index + 1}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full border ${estadoInfo.color}`}
                        >
                          {estadoInfo.label}
                        </span>
                        {isFirst && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-brand-50 text-brand-600 rounded-full border border-brand-200">
                            Original
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400">
                        {version.fecha || new Date(version.timestamp * 1000).toLocaleString("es-BO")}
                      </span>
                    </div>

                    {/* Hash */}
                    <div className="mt-3">
                      <span className="text-xs text-slate-400">Hash SHA-256</span>
                      <p className="font-mono text-xs text-slate-600 mt-0.5 break-all bg-slate-50 rounded-lg px-3 py-2">
                        {version.hash}
                      </p>
                    </div>

                    {/* Reviewer */}
                    {version.revisor && version.revisor !== "0x0000000000000000000000000000000000000000" && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                        <span>👤 Revisado por:</span>
                        <a
                          href={`${EXPLORER_URL}/address/${version.revisor}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-brand-600 hover:text-brand-700"
                        >
                          {version.revisor.slice(0, 10)}...{version.revisor.slice(-6)}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
