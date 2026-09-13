import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { ethers } from "ethers";
import { obtenerModo } from "../services/api";

const WalletContext = createContext(null);

// HSK Chain Testnet configuration
const HSK_TESTNET = {
  chainId: "0x85", // 133 in hex
  chainName: "HSKChain Testnet",
  nativeCurrency: { name: "HSK", symbol: "HSK", decimals: 18 },
  rpcUrls: ["https://testnet.hsk.xyz", "https://133.rpc.thirdweb.com", "https://rpc.testnet.hashkeychain.com"],
  blockExplorerUrls: ["https://testnet-explorer.hskchain.net"],
};

/**
 * Detección robusta de MetaMask.
 * Soporta entornos con múltiples wallets (ej: MetaMask + Coinbase Wallet)
 * donde window.ethereum puede ser el agregador y los providers individuales
 * están en window.ethereum.providers[].
 */
function detectarMetaMask() {
  if (typeof window === "undefined") return false;
  const eth = window.ethereum;
  if (!eth) return false;
  // Caso 1: múltiples wallets instaladas — providers array
  if (eth.providers?.length) {
    return eth.providers.some((p) => p.isMetaMask);
  }
  // Caso 2: MetaMask es la única wallet instalada
  return !!eth.isMetaMask;
}

/**
 * Obtiene el provider de MetaMask cuando conviven múltiples wallets.
 * Retorna window.ethereum directamente si es el único provider.
 */
function getMetaMaskProvider() {
  const eth = window.ethereum;
  if (!eth) return null;
  if (eth.providers?.length) {
    return eth.providers.find((p) => p.isMetaMask) || null;
  }
  return eth.isMetaMask ? eth : null;
}

export function WalletProvider({ children }) {
  const [address, setAddress] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  // Backend blockchain mode (fetched from /api/modo)
  const [backendModo, setBackendModo] = useState(null);

  const isCorrectNetwork = chainId === 133;
  // hasMetaMask: alias de detección robusta (retrocompatibilidad)
  const hasMetaMask = detectarMetaMask();
  const isMetaMaskDetected = hasMetaMask;

  // Fetch backend blockchain mode on mount
  useEffect(() => {
    obtenerModo()
      .then((modo) => setBackendModo(modo))
      .catch(() => {
        // Backend not available — default to unknown
        setBackendModo({
          modo: "demo_local",
          label: "💾 Modo Demo Local",
          contrato: null,
          explorer: null,
          rpc: null,
          escritura: false,
        });
      });
  }, []);

  // Listen for account/chain changes
  useEffect(() => {
    if (!isMetaMaskDetected) return;
    const provider = getMetaMaskProvider();
    if (!provider) return;

    const handleAccountsChanged = (accounts) => {
      setAddress(accounts[0] || null);
    };

    const handleChainChanged = (hexChainId) => {
      setChainId(parseInt(hexChainId, 16));
    };

    provider.on("accountsChanged", handleAccountsChanged);
    provider.on("chainChanged", handleChainChanged);

    // Check if already connected
    provider
      .request({ method: "eth_accounts" })
      .then((accounts) => {
        if (accounts.length > 0) setAddress(accounts[0]);
      })
      .catch(() => {});

    provider
      .request({ method: "eth_chainId" })
      .then((hexId) => setChainId(parseInt(hexId, 16)))
      .catch(() => {});

    return () => {
      provider.removeListener("accountsChanged", handleAccountsChanged);
      provider.removeListener("chainChanged", handleChainChanged);
    };
  }, [isMetaMaskDetected]);

  const connect = useCallback(async () => {
    if (!isMetaMaskDetected) {
      setError("MetaMask no está instalado");
      return;
    }
    const provider = getMetaMaskProvider();
    if (!provider) return;

    setIsConnecting(true);
    setError(null);
    try {
      const accounts = await provider.request({
        method: "eth_requestAccounts",
      });
      setAddress(accounts[0]);
      const hexId = await provider.request({ method: "eth_chainId" });
      setChainId(parseInt(hexId, 16));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsConnecting(false);
    }
  }, [isMetaMaskDetected]);

  const switchToHSK = useCallback(async () => {
    if (!isMetaMaskDetected) return;
    const provider = getMetaMaskProvider();
    if (!provider) return;
    try {
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: HSK_TESTNET.chainId }],
      });
    } catch (switchError) {
      // Chain not added yet — add it
      if (switchError.code === 4902) {
        try {
          await provider.request({
            method: "wallet_addEthereumChain",
            params: [HSK_TESTNET],
          });
        } catch (addError) {
          setError(addError.message);
        }
      } else {
        setError(switchError.message);
      }
    }
  }, [isMetaMaskDetected]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setChainId(null);
  }, []);

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : null;

  return (
    <WalletContext.Provider
      value={{
        address,
        shortAddress,
        chainId,
        isCorrectNetwork,
        isConnecting,
        hasMetaMask,
        isMetaMaskDetected,
        error,
        backendModo,
        connect,
        switchToHSK,
        disconnect,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
