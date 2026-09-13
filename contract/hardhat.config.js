const path = require("path");
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

// Validar y normalizar la clave privada
const privKey = process.env.PRIVATE_KEY || "";
const cleanKey = privKey.trim().replace(/^0x/, "");
const isValidKey = /^[0-9a-fA-F]{64}$/.test(cleanKey);
const formattedKey = isValidKey ? `0x${cleanKey}` : undefined;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    // Red de desarrollo local
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    
    // HSK Chain Testnet (HashKey Chain)
    // Solo se registra la red si hay una clave privada válida,
    // de lo contrario Hardhat falla al intentar cargar cuentas vacías
    ...(isValidKey && {
      hskTestnet: {
        url: process.env.RPC_URL || "https://testnet.hsk.xyz",
        chainId: 133,
        accounts: [formattedKey],
      },
    }),
  },
};
