import { Link, useLocation } from "react-router-dom";
import { useWallet } from "../context/WalletContext";

export default function Header() {
  const { pathname } = useLocation();
  const {
    address,
    shortAddress,
    isCorrectNetwork,
    isConnecting,
    hasMetaMask,
    backendModo,
    connect,
    switchToHSK,
    disconnect,
  } = useWallet();

  const navItems = [
    { to: "/", label: "Registrar Documento" },
    { to: "/obras", label: "Mis Documentos" },
  ];

  const isBlockchainReal = backendModo?.modo === "blockchain_real";

  // ── Botón de wallet ────────────────────────────────────────────────────────
  // Caso A: MetaMask NO instalado → enlace de instalación
  // Caso B: MetaMask instalado, wallet NO conectada → conectar (eth_requestAccounts)
  // Caso C: wallet conectada → dirección + desconectar

  const WalletButton = () => {
    // Caso C: conectado
    if (address) {
      return (
        <div className="flex items-center gap-2">
          {/* Indicador de estado conectado */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs text-emerald-700 font-semibold hidden sm:inline">
              Conectado
            </span>
            <span className="text-sm font-mono text-slate-700">
              {shortAddress}
            </span>
          </div>
          {/* Botón desconectar */}
          <button
            id="wallet-disconnect-btn"
            onClick={disconnect}
            title="Desconectar wallet"
            className="px-3 py-1.5 text-xs font-medium text-slate-500 bg-slate-100 hover:bg-red-50 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>
      );
    }

    // Caso A: MetaMask NO instalado
    if (!hasMetaMask) {
      return (
        <a
          id="wallet-install-metamask-btn"
          href="https://metamask.io/download/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-semibold rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all shadow-md hover:shadow-lg"
        >
          <span>🦊</span>
          Instalar MetaMask
        </a>
      );
    }

    // Caso B: MetaMask instalado pero NO conectado
    return (
      <button
        id="wallet-connect-btn"
        onClick={connect}
        disabled={isConnecting}
        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-500 to-brand-600 text-white text-sm font-semibold rounded-lg hover:from-brand-600 hover:to-brand-700 transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isConnecting ? (
          <>
            <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Conectando...
          </>
        ) : (
          <>
            <span>🦊</span>
            Conectar MetaMask
          </>
        )}
      </button>
    );
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <span className="text-white text-lg">🛡️</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800 leading-none">
                ObraClara
                <span className="text-brand-500 ml-0.5">AI</span>
              </h1>
              <p className="text-[10px] text-slate-400 leading-none mt-0.5">
                Registro inmutable de documentos
              </p>
            </div>
          </Link>

          {/* Nav */}
          <nav className="hidden sm:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === item.to
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Wallet + Mode indicator */}
          <div className="flex items-center gap-2">
            {/* Blockchain mode indicator */}
            {backendModo && (
              isBlockchainReal ? (
                <a
                  href={backendModo.explorer}
                  target="_blank"
                  rel="noopener noreferrer"
                  id="blockchain-mode-badge"
                  className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
                  title={`Contrato: ${backendModo.contrato}`}
                >
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  ⛓️ HSK Testnet (real)
                </a>
              ) : (
                <span
                  id="blockchain-mode-badge"
                  className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-medium border border-amber-200"
                  title="Blockchain no conectada — usando almacenamiento local"
                >
                  💾 Demo Local
                </span>
              )
            )}

            {/* Cambiar red si está en la red incorrecta */}
            {address && !isCorrectNetwork && (
              <button
                onClick={switchToHSK}
                className="px-3 py-1.5 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
              >
                ⚠️ Cambiar a HSK Testnet
              </button>
            )}

            {/* Botón inteligente de wallet */}
            <WalletButton />
          </div>
        </div>
      </div>
    </header>
  );
}
