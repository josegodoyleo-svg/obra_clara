// Test completo del contrato ObraRegistry
// Simula el flujo: registrar → reportar cambio → verificar congelamiento → aprobar → verificar descongelamiento
// Uso: npx hardhat test

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ObraRegistry", function () {
  let registry;
  let admin, auditor, tercero;

  // Hashes de ejemplo (simulando SHA-256 de PDFs)
  const hashOriginal = ethers.keccak256(ethers.toUtf8Bytes("contrato_original.pdf"));
  const hashModificado = ethers.keccak256(ethers.toUtf8Bytes("contrato_modificado.pdf"));
  const hashCorregido = ethers.keccak256(ethers.toUtf8Bytes("contrato_corregido.pdf"));

  beforeEach(async function () {
    [admin, auditor, tercero] = await ethers.getSigners();

    const ObraRegistry = await ethers.getContractFactory("ObraRegistry");
    registry = await ObraRegistry.deploy();
    await registry.waitForDeployment();
  });

  // =========================================================================
  //  1. REGISTRAR OBRA
  // =========================================================================

  describe("registrarObra", function () {
    it("Debe registrar una obra nueva con versión inicial APROBADA", async function () {
      const tx = await registry.registrarObra(
        "Puente Río Mamoré",
        "Construcción de puente vehicular de 200 metros",
        hashOriginal
      );

      // Verificar que emitió el evento
      await expect(tx)
        .to.emit(registry, "ObraRegistrada")
        .withArgs(1, "Puente Río Mamoré", admin.address, hashOriginal);

      // Verificar datos de la obra
      const obra = await registry.obtenerObra(1);
      expect(obra.id).to.equal(1);
      expect(obra.nombre).to.equal("Puente Río Mamoré");
      expect(obra.descripcion).to.equal("Construcción de puente vehicular de 200 metros");
      expect(obra.congelada).to.equal(false);
      expect(obra.administrador).to.equal(admin.address);
      expect(obra.totalVersiones).to.equal(1);
    });

    it("Debe incrementar el contador total de obras", async function () {
      expect(await registry.totalObras()).to.equal(0);

      await registry.registrarObra("Obra 1", "Desc 1", hashOriginal);
      expect(await registry.totalObras()).to.equal(1);

      await registry.registrarObra("Obra 2", "Desc 2", hashModificado);
      expect(await registry.totalObras()).to.equal(2);
    });

    it("Debe fallar si el nombre está vacío", async function () {
      await expect(
        registry.registrarObra("", "Descripción", hashOriginal)
      ).to.be.revertedWith("El nombre no puede estar vacio");
    });

    it("Debe fallar si el hash es nulo", async function () {
      await expect(
        registry.registrarObra("Obra", "Desc", ethers.ZeroHash)
      ).to.be.revertedWith("El hash no puede ser nulo");
    });

    it("La primera versión debe estar APROBADA con el hash correcto", async function () {
      await registry.registrarObra("Obra Test", "Desc", hashOriginal);

      const versiones = await registry.obtenerVersiones(1);
      expect(versiones.length).to.equal(1);
      expect(versiones[0].hash).to.equal(hashOriginal);
      expect(versiones[0].estado).to.equal(1); // 1 = APROBADA
      expect(versiones[0].revisor).to.equal(admin.address);
    });
  });

  // =========================================================================
  //  2. REPORTAR CAMBIO
  // =========================================================================

  describe("reportarCambio", function () {
    beforeEach(async function () {
      // Registrar una obra de prueba
      await registry.registrarObra(
        "Carretera Oruro-Potosí",
        "Pavimentación de 150 km",
        hashOriginal
      );
    });

    it("Debe congelar la obra si el hash es DIFERENTE al aprobado", async function () {
      const tx = await registry.connect(auditor).reportarCambio(1, hashModificado);

      // Verificar evento CambioDetectado
      await expect(tx)
        .to.emit(registry, "CambioDetectado")
        .withArgs(1, hashOriginal, hashModificado);

      // Verificar que la obra está congelada
      const obra = await registry.obtenerObra(1);
      expect(obra.congelada).to.equal(true);
    });

    it("No debe hacer nada si el hash es IGUAL al aprobado", async function () {
      const tx = await registry.connect(auditor).reportarCambio(1, hashOriginal);

      // No debe emitir evento CambioDetectado
      await expect(tx).to.not.emit(registry, "CambioDetectado");

      // La obra no debe estar congelada
      const obra = await registry.obtenerObra(1);
      expect(obra.congelada).to.equal(false);

      // No debe agregar nueva versión
      expect(obra.totalVersiones).to.equal(1);
    });

    it("Debe agregar una versión PENDIENTE cuando detecta cambio", async function () {
      await registry.connect(auditor).reportarCambio(1, hashModificado);

      const versiones = await registry.obtenerVersiones(1);
      expect(versiones.length).to.equal(2);
      expect(versiones[1].hash).to.equal(hashModificado);
      expect(versiones[1].estado).to.equal(0); // 0 = PENDIENTE
      expect(versiones[1].revisor).to.equal(ethers.ZeroAddress);
    });

    it("Debe fallar si la obra ya está congelada", async function () {
      await registry.connect(auditor).reportarCambio(1, hashModificado);

      await expect(
        registry.connect(auditor).reportarCambio(1, hashCorregido)
      ).to.be.revertedWith("La obra ya esta congelada");
    });

    it("Debe fallar si la obra no existe", async function () {
      await expect(
        registry.connect(auditor).reportarCambio(999, hashModificado)
      ).to.be.revertedWith("Obra no existe");
    });
  });

  // =========================================================================
  //  3. APROBAR CAMBIO
  // =========================================================================

  describe("aprobarCambio", function () {
    beforeEach(async function () {
      await registry.registrarObra("Hospital El Alto", "Fase 2", hashOriginal);
      await registry.connect(auditor).reportarCambio(1, hashModificado);
    });

    it("Debe descongelar la obra al aprobar", async function () {
      const tx = await registry.aprobarCambio(1, hashModificado);

      // Verificar evento
      await expect(tx)
        .to.emit(registry, "CambioAprobado")
        .withArgs(1, hashModificado, admin.address);

      // Verificar que la obra ya no está congelada
      const obra = await registry.obtenerObra(1);
      expect(obra.congelada).to.equal(false);
    });

    it("Debe actualizar la versión a APROBADA", async function () {
      await registry.aprobarCambio(1, hashModificado);

      const versiones = await registry.obtenerVersiones(1);
      const ultimaVersion = versiones[versiones.length - 1];

      expect(ultimaVersion.estado).to.equal(1); // 1 = APROBADA
      expect(ultimaVersion.hash).to.equal(hashModificado);
      expect(ultimaVersion.revisor).to.equal(admin.address);
    });

    it("El hash aprobado debe actualizarse al nuevo hash", async function () {
      await registry.aprobarCambio(1, hashModificado);

      const hashAprobado = await registry.obtenerHashAprobado(1);
      expect(hashAprobado).to.equal(hashModificado);
    });

    it("Debe fallar si no es el administrador", async function () {
      await expect(
        registry.connect(auditor).aprobarCambio(1, hashModificado)
      ).to.be.revertedWith("Solo el administrador puede ejecutar esta accion");
    });

    it("Debe fallar si la obra no está congelada", async function () {
      // Primero aprobar para descongelar
      await registry.aprobarCambio(1, hashModificado);

      // Intentar aprobar de nuevo
      await expect(
        registry.aprobarCambio(1, hashCorregido)
      ).to.be.revertedWith("La obra no esta congelada");
    });
  });

  // =========================================================================
  //  4. RECHAZAR CAMBIO
  // =========================================================================

  describe("rechazarCambio", function () {
    beforeEach(async function () {
      await registry.registrarObra("Escuela Rurrenabaque", "Ampliación", hashOriginal);
      await registry.connect(auditor).reportarCambio(1, hashModificado);
    });

    it("Debe mantener la obra congelada al rechazar", async function () {
      const tx = await registry.rechazarCambio(1);

      // Verificar evento
      await expect(tx)
        .to.emit(registry, "CambioRechazado")
        .withArgs(1, hashModificado, admin.address);

      // La obra SIGUE congelada
      const obra = await registry.obtenerObra(1);
      expect(obra.congelada).to.equal(true);
    });

    it("Debe marcar la versión como RECHAZADA", async function () {
      await registry.rechazarCambio(1);

      const versiones = await registry.obtenerVersiones(1);
      const ultimaVersion = versiones[versiones.length - 1];

      expect(ultimaVersion.estado).to.equal(2); // 2 = RECHAZADA
      expect(ultimaVersion.revisor).to.equal(admin.address);
    });

    it("El hash aprobado debe seguir siendo el original", async function () {
      await registry.rechazarCambio(1);

      const hashAprobado = await registry.obtenerHashAprobado(1);
      expect(hashAprobado).to.equal(hashOriginal);
    });

    it("Debe fallar si no es el administrador", async function () {
      await expect(
        registry.connect(tercero).rechazarCambio(1)
      ).to.be.revertedWith("Solo el administrador puede ejecutar esta accion");
    });
  });

  // =========================================================================
  //  5. GETTERS
  // =========================================================================

  describe("Getters públicos", function () {
    it("totalObras() debe reflejar la cantidad correcta", async function () {
      expect(await registry.totalObras()).to.equal(0);
      await registry.registrarObra("Obra A", "Desc A", hashOriginal);
      await registry.registrarObra("Obra B", "Desc B", hashModificado);
      expect(await registry.totalObras()).to.equal(2);
    });

    it("obtenerHashAprobado() debe retornar el hash correcto", async function () {
      await registry.registrarObra("Obra C", "Desc C", hashOriginal);

      expect(await registry.obtenerHashAprobado(1)).to.equal(hashOriginal);
    });

    it("obtenerObra() debe fallar para ID inexistente", async function () {
      await expect(registry.obtenerObra(42)).to.be.revertedWith("Obra no existe");
    });

    it("obtenerVersiones() debe fallar para ID inexistente", async function () {
      await expect(registry.obtenerVersiones(0)).to.be.revertedWith("Obra no existe");
    });
  });

  // =========================================================================
  //  6. FLUJO COMPLETO E2E
  // =========================================================================

  describe("🔄 Flujo completo E2E", function () {
    it("Registrar → Reportar cambio → Verificar congelamiento → Aprobar → Verificar descongelamiento", async function () {
      // --- PASO 1: Registrar obra ---
      console.log("    📝 Paso 1: Registrando obra...");
      await registry.registrarObra(
        "Puente Beni",
        "Construcción puente vehicular 500m",
        hashOriginal
      );

      let obra = await registry.obtenerObra(1);
      expect(obra.congelada).to.equal(false);
      expect(obra.totalVersiones).to.equal(1);
      console.log("    ✅ Obra registrada. Congelada:", obra.congelada);

      // --- PASO 2: Verificar con hash idéntico (no debe congelar) ---
      console.log("\n    🔍 Paso 2: Verificando con hash idéntico...");
      await registry.connect(auditor).reportarCambio(1, hashOriginal);

      obra = await registry.obtenerObra(1);
      expect(obra.congelada).to.equal(false);
      expect(obra.totalVersiones).to.equal(1); // No se agregó versión
      console.log("    ✅ Hash idéntico, obra no congelada");

      // --- PASO 3: Reportar hash diferente (debe congelar) ---
      console.log("\n    🚨 Paso 3: Reportando hash diferente...");
      await registry.connect(auditor).reportarCambio(1, hashModificado);

      obra = await registry.obtenerObra(1);
      expect(obra.congelada).to.equal(true);
      expect(obra.totalVersiones).to.equal(2);
      console.log("    ❄️  Obra CONGELADA. Versiones:", obra.totalVersiones.toString());

      // --- PASO 4: Intentar reportar otro cambio (debe fallar, ya congelada) ---
      console.log("\n    🚫 Paso 4: Intentando reportar otro cambio (debe fallar)...");
      await expect(
        registry.connect(auditor).reportarCambio(1, hashCorregido)
      ).to.be.revertedWith("La obra ya esta congelada");
      console.log("    ✅ Correctamente bloqueado");

      // --- PASO 5: Tercero intenta aprobar (debe fallar) ---
      console.log("\n    🚫 Paso 5: Tercero intenta aprobar (debe fallar)...");
      await expect(
        registry.connect(tercero).aprobarCambio(1, hashModificado)
      ).to.be.revertedWith("Solo el administrador puede ejecutar esta accion");
      console.log("    ✅ Correctamente bloqueado");

      // --- PASO 6: Administrador aprueba el cambio ---
      console.log("\n    ✅ Paso 6: Administrador aprueba el cambio...");
      await registry.aprobarCambio(1, hashModificado);

      obra = await registry.obtenerObra(1);
      expect(obra.congelada).to.equal(false);
      expect(obra.totalVersiones).to.equal(2);
      console.log("    🔓 Obra DESCONGELADA");

      // --- PASO 7: Verificar hash aprobado actualizado ---
      const hashFinal = await registry.obtenerHashAprobado(1);
      expect(hashFinal).to.equal(hashModificado);
      console.log("    📋 Hash aprobado actualizado correctamente");

      // --- PASO 8: Verificar historial completo ---
      console.log("\n    📜 Paso 7: Historial de versiones:");
      const versiones = await registry.obtenerVersiones(1);
      expect(versiones.length).to.equal(2);

      const estados = ["PENDIENTE", "APROBADA", "RECHAZADA"];
      versiones.forEach((v, i) => {
        console.log(
          `       v${i + 1}: ${v.hash.slice(0, 16)}... | ${estados[Number(v.estado)]} | Revisor: ${v.revisor.slice(0, 10)}...`
        );
      });
    });

    it("Registrar → Reportar cambio → Rechazar → Verificar que sigue congelada", async function () {
      // Registrar y reportar cambio
      await registry.registrarObra("Alcantarillado Sucre", "Fase 3", hashOriginal);
      await registry.connect(auditor).reportarCambio(1, hashModificado);

      // Rechazar
      await registry.rechazarCambio(1);

      // Verificar que sigue congelada
      const obra = await registry.obtenerObra(1);
      expect(obra.congelada).to.equal(true);

      // El hash aprobado sigue siendo el original
      expect(await registry.obtenerHashAprobado(1)).to.equal(hashOriginal);

      // La versión rechazada está marcada correctamente
      const versiones = await registry.obtenerVersiones(1);
      expect(versiones[1].estado).to.equal(2); // RECHAZADA
    });
  });
});
