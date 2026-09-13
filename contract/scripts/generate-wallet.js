// ============================================
// Generador de Wallet para HSK Chain Testnet
// ============================================
// Uso: node contract/scripts/generate-wallet.js
//
// Genera una wallet nueva con ethers.Wallet.createRandom()
// e imprime la dirección pública y la private key.
//
// ⚠️  SOLO PARA DESARROLLO / TESTNET — NUNCA uses esta wallet en mainnet
//     sin antes transferir los fondos a una wallet segura (hardware wallet).

const { ethers } = require("ethers");

function main() {
  const wallet = ethers.Wallet.createRandom();

  console.log("═══════════════════════════════════════════════════════════");
  console.log("  🔑  Nueva Wallet Generada — HSK Chain Testnet");
  console.log("═══════════════════════════════════════════════════════════\n");

  console.log("📍 Dirección pública:");
  console.log(`   ${wallet.address}\n`);

  console.log("🔐 Clave privada:");
  console.log(`   ${wallet.privateKey}\n`);

  console.log("📝 Frase mnemónica (12 palabras):");
  console.log(`   ${wallet.mnemonic.phrase}\n`);

  console.log("═══════════════════════════════════════════════════════════");
  console.log("  ⚠️   ADVERTENCIAS DE SEGURIDAD");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("");
  console.log("  1. GUARDA la clave privada en un lugar SEGURO.");
  console.log("     Si la pierdes, pierdes acceso a los fondos.");
  console.log("");
  console.log("  2. NUNCA compartas tu clave privada con nadie.");
  console.log("     Quien tenga la clave controla la wallet.");
  console.log("");
  console.log("  3. NUNCA subas la clave privada a GitHub u otro repositorio.");
  console.log("     Usa archivos .env (que estén en .gitignore).");
  console.log("");
  console.log("  4. Esta wallet es para TESTNET únicamente.");
  console.log("     Para mainnet, usa una hardware wallet (Ledger, Trezor).");
  console.log("");
  console.log("═══════════════════════════════════════════════════════════\n");

  console.log("📋 Próximos pasos:");
  console.log("   1. Copia la clave privada (sin el prefijo 0x) en tu archivo .env:");
  console.log(`      PRIVATE_KEY=${wallet.privateKey.slice(2)}`);
  console.log("");
  console.log("   2. Solicita fondos de testnet en:");
  console.log("      https://hskchain.net/faucet");
  console.log("");
  console.log("   3. Despliega tu contrato:");
  console.log("      cd contract && npx hardhat run scripts/deploy.js --network hskTestnet");
  console.log("");
}

main();
