import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WalletProvider } from "./context/WalletContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import RegistrarObra from "./pages/RegistrarObra";
import MisObras from "./pages/MisObras";
import DetalleObra from "./pages/DetalleObra";

function App() {
  return (
    <WalletProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-slate-50">
          <Header />
          <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto w-full">
            <Routes>
              <Route path="/" element={<RegistrarObra />} />
              <Route path="/obras" element={<MisObras />} />
              <Route path="/obras/:id" element={<DetalleObra />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </WalletProvider>
  );
}

export default App;
