export default function Footer() {
  return (
    <footer className="bg-slate-50 border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-2xl mx-auto">
            <span className="text-brand-600">Blockchain</span> detecta que algo
            cambió ·{" "}
            <span className="text-accent-600">La IA</span> explica qué cambió ·{" "}
            <span className="text-slate-700">Una persona</span> decide qué hacer
          </p>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
            <span>ObraClara AI</span>
            <span>·</span>
            <span>HSK Chain Testnet</span>
            <span>·</span>
            <span>Bolivia 🇧🇴</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
