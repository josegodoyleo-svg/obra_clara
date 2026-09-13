// Script de despliegue del contrato ObraRegistry en HSK Chain Testnet
// Uso: npx hardhat run scripts/deploy.js --network hskTestnet

const hre = require("hardhat");

async function main() {
  console.log("🚀 Desplegando ObraRegistry en", hre.network.name, "...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📋 Cuenta desplegadora:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Balance:", hre.ethers.formatEther(balance), "HSK\n");

  // Compilar y desplegar
  const ObraRegistry = await hre.ethers.getContractFactory("ObraRegistry");
  const contract = await ObraRegistry.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();

  console.log("✅ ObraRegistry desplegado exitosamente!");
  console.log("\n📝 Copia y pega esto en tu archivo .env:");
  console.log(`CONTRACT_ADDRESS=${address}`);
  console.log(`VITE_CONTRACT_ADDRESS=${address}`);
  console.log("\n🔗 Verificar en el explorador:");
  console.log(`https://testnet-explorer.hskchain.net/address/${address}`);
}

main().catch((error) => {
  console.error("\n❌ Error en despliegue:");
  if (error.message.includes("could not coalesce error") || error.message.includes("timeout") || error.message.includes("network")) {
    console.error("   Problema de conexión con el RPC de HSK Testnet.");
    console.error("   💡 Reintenta en 1 minuto, el RPC puede estar saturado o inestable.");
  } else {
    console.error("  ", error.message);
  }
  process.exitCode = 1;
});
