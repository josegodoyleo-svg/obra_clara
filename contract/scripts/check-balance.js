// Script para consultar el saldo de la wallet de despliegue en HSK Chain Testnet
// Uso: node contract/scripts/check-balance.js

const { ethers } = require("ethers");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

async function main() {
  const privKey = process.env.PRIVATE_KEY;
  const rpcUrl = process.env.RPC_URL || "https://133.rpc.thirdweb.com";

  if (!privKey) {
    console.error("❌ Error: No se encontró PRIVATE_KEY en el archivo .env");
    process.exit(1);
  }

  // Quitar prefijo 0x si existe para validar la longitud exacta de 64 caracteres
  const rawKey = privKey.trim().replace(/^0x/, "");

  if (!/^[0-9a-fA-F]{64}$/.test(rawKey)) {
     console.error("❌ Error: PRIVATE_KEY no tiene un formato válido (se esperan 64 caracteres hex)");
     process.exit(1);
  }

  // Ethers v6 espera la clave con prefijo 0x
  const cleanKey = `0x${rawKey}`;

  try {
    console.log(`📡 Conectando a RPC: ${rpcUrl}`);
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // Testear conexión RPC
    const network = await provider.getNetwork();
    console.log(`✅ Conectado a la red. Chain ID: ${network.chainId}`);

    const wallet = new ethers.Wallet(cleanKey, provider);
    console.log(`\n📍 Dirección de la wallet: ${wallet.address}`);

    const balanceWei = await provider.getBalance(wallet.address);
    const balanceHsk = ethers.formatEther(balanceWei);

    console.log(`\n💰 Saldo actual: ${balanceHsk} HSK`);
    
    if (parseFloat(balanceHsk) === 0) {
        console.log("\n⚠️  No tienes saldo. Pide HSK de prueba en el faucet antes de desplegar:");
        console.log("   https://hskchain.net/faucet");
    } else {
        console.log("\n✅ ¡Tienes saldo suficiente! Listo para desplegar.");
    }

  } catch (error) {
    console.error("\n❌ Error al conectar o consultar saldo:", error.message);
  }
}

main();
