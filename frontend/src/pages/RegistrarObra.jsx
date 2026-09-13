import { useState, useRef } from "react";
import { registrarObra } from "../services/api";

const EXPLORER_URL = "https://testnet-explorer.hskchain.net";

export default function RegistrarObra() {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [archivo, setArchivo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!archivo || !nombre.trim()) return;

    setLoading(true);
    setError(null);
    setResultado(null);

    try {
      const data = await registrarObra(nombre, descripcion, archivo);
      setResultado(data);
      // Reset form
      setNombre("");
      setDescripcion("");
      setArchivo(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyHash = () => {
    navigator.clipboard.writeText(resultado.hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800">
          📄 Registrar Nuevo Documento
        </h2>
        <p className="text-slate-500 mt-1">
          Sube el documento para registrar su hash en blockchain
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
        {/* Nombre */}
        <div className="mb-5">
          <label htmlFor="nombre" className="block text-sm font-semibold text-slate-700 mb-1.5">
            Nombre del documento o proyecto *
          </label>
          <input
            id="nombre"
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Contrato de confidencialidad NDA"
            required
            className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-shadow"
          />
        </div>

        {/* Descripción */}
        <div className="mb-5">
          <label htmlFor="descripcion" className="block text-sm font-semibold text-slate-700 mb-1.5">
            Descripción
          </label>
          <textarea
            id="descripcion"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Descripción del proyecto..."
            rows={3}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none transition-shadow"
          />
        </div>

        {/* File upload */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Archivo a registrar (.pdf, .docx, .xlsx, .txt) *
          </label>
          <div
            className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
              archivo
                ? "border-brand-300 bg-brand-50"
                : "border-slate-300 hover:border-brand-400 hover:bg-slate-50"
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
              <div className="flex items-center justify-center gap-2 text-brand-700">
                <span className="text-2xl">📎</span>
                <div className="text-left">
                  <p className="font-medium text-sm">{archivo.name}</p>
                  <p className="text-xs text-brand-500">
                    {(archivo.size / 1024).toFixed(1)} KB · {archivo.name.split(".").pop().toUpperCase()}
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <span className="text-3xl">📤</span>
                <p className="text-sm text-slate-600 font-medium mt-2">
                  Haz clic para seleccionar un documento
                </p>
                <p className="text-xs text-slate-400 mt-1">Formatos soportados: PDF, Word (.docx), Excel (.xlsx) o Texto (.txt) · Máx 10 MB</p>
              </div>
            )}
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading || !archivo || !nombre.trim()}
          className="w-full py-3 px-6 bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold rounded-xl hover:from-brand-600 hover:to-brand-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Procesando archivo y registrando en blockchain... (puede tardar ~30s)</span>
            </>
          ) : (
            <>🔗 Registrar en Blockchain</>
          )}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <strong>❌ Error:</strong> {error}
        </div>
      )}

      {/* Success result */}
      {resultado && (
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-emerald-200 overflow-hidden">
          {/* Success header */}
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4">
            <h3 className="text-white font-bold text-lg flex items-center gap-2">
              ✅ Documento Registrado Exitosamente
            </h3>
            <p className="text-emerald-100 text-sm mt-0.5">
              Registro #{resultado.idObra} · {resultado.paginas} páginas procesadas
            </p>
          </div>

          <div className="p-6 space-y-5">
            {/* Hash */}
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Hash SHA-256
              </label>
              <div className="mt-1 flex items-center gap-2">
                <code className="flex-1 text-sm font-mono bg-slate-100 px-3 py-2 rounded-lg text-slate-700 truncate">
                  {resultado.hash}
                </code>
                <button
                  onClick={copyHash}
                  className="px-3 py-2 text-xs font-medium bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
                >
                  {copied ? "✅ Copiado" : "📋 Copiar"}
                </button>
              </div>
            </div>

            {/* TX link */}
            {resultado.txHash && (
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Transacción en blockchain
                </label>
                <a
                  href={`${EXPLORER_URL}/tx/${resultado.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 font-medium"
                >
                  <span className="truncate font-mono">{resultado.txHash}</span>
                  <span>↗</span>
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
