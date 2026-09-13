# 🏗️ ObraClara AI — Guía de Demo (3 minutos)

> **Blockchain** detecta que algo cambió · **La IA** explica qué cambió · **Una persona** decide qué hacer

---

## 🎯 Pitch de apertura (30 segundos)

> *"En Bolivia, los contratos de obras públicas se modifican sin que nadie se entere.
> Cambian la cantidad de metros, reducen el presupuesto, y el dinero desaparece.
> ObraClara AI resuelve esto con tres capas de protección:
> la blockchain detecta cualquier alteración, la inteligencia artificial
> explica exactamente qué cambió, y un administrador humano toma la decisión final."*

---

## Paso 1 — Registrar el contrato original (40 seg)

1. Abrir **http://localhost:5173**
2. Conectar **MetaMask** (red HSK Testnet)
3. En "Registrar Obra":
   - **Nombre**: `Limpieza canal de riego Quillacollo`
   - **Descripción**: `500 metros del canal principal, zona sur`
   - **PDF**: Subir `demo/contrato_original.pdf`
4. Click **"Registrar en Blockchain"**
5. **Mostrar al público**:
   - ✅ Hash SHA-256 registrado (inmutable en blockchain)
   - 🤖 Tabla con datos extraídos por la IA:
     - Trabajo: Limpieza de 500 metros
     - Presupuesto: Bs. 45.000
     - Responsable: Constructora Andina SRL
   - 🔗 Link a la transacción en el explorador de HSK Testnet

> **Frase clave**: *"Este hash es la huella digital del documento. Si alguien cambia
> una sola coma, el hash será completamente diferente."*

---

## Paso 2 — Subir versión alterada (40 seg)

1. Ir a **"Mis Obras"** → Obra recién creada
2. Click **"Verificar nueva versión"**
3. Subir `demo/contrato_modificado.pdf`
4. **Mostrar al público**:
   - ❄️ **OBRA CONGELADA** automáticamente (badge rojo parpadeante)
   - Los hashes son DIFERENTES → blockchain lo detectó

> **Frase clave**: *"Alguien cambió el documento. La blockchain lo detectó
> instantáneamente y congeló la obra. Nadie puede seguir trabajando
> hasta que un administrador revise el cambio."*

---

## Paso 3 — Reporte de la IA (30 seg)

1. En el modal de verificación, mostrar la **tabla de cambios**:

| Campo | Antes | Ahora | Riesgo |
|-------|-------|-------|--------|
| Cantidad | 500 metros | 300 metros | 🔴 ALTO |
| Presupuesto | Bs. 45.000 | Bs. 43.000 | 🔴 ALTO |

2. **Riesgo general: ALTO 🔴**

> **Frase clave**: *"La IA no solo detecta QUE algo cambió — explica exactamente
> QUÉ cambió. 500 metros se convirtieron en 300 metros, y el presupuesto
> se redujo Bs. 2.000. Ambos cambios son de riesgo ALTO porque modifican
> cantidades y montos."*

---

## Paso 4 — Decisión del administrador (30 seg)

1. Ir al **Detalle de la Obra** (`/obras/1`)
2. Mostrar la **alerta roja grande**: "⚠️ CAMBIO DETECTADO — Obra Congelada"
3. Click **"❌ RECHAZAR CAMBIO"**
4. **Mostrar al público**:
   - La obra **sigue congelada** (protección mantenida)
   - La versión queda marcada como **RECHAZADA** en blockchain

> **Frase clave**: *"El administrador rechazó el cambio. La obra sigue congelada.
> Si fuera un cambio legítimo — como una corrección técnica — podría APROBAR
> y registrar el nuevo hash."*

---

## Paso 5 — Historial auditable (20 seg)

1. En el **Detalle de la Obra**, bajar al **Timeline de Versiones**
2. Mostrar:
   - **v1**: Hash original ✅ APROBADA — Revisor: [tu wallet]
   - **v2**: Hash modificado ❌ RECHAZADA — Revisor: [tu wallet]
3. **Todo registrado en blockchain**, inmutable, auditable

> **Frase clave**: *"Todo queda registrado en blockchain. Quién subió qué, cuándo,
> y qué decisión se tomó. No se puede borrar. No se puede alterar.
> Es transparencia total."*

---

## Cierre (10 seg)

> *"ObraClara AI: tres capas de protección contra la corrupción en obras públicas.
> Blockchain, inteligencia artificial, y decisión humana.
> Porque el dinero público nos pertenece a todos."*

---

## Datos técnicos para preguntas del jurado

| Componente | Tecnología |
|-----------|-----------|
| Smart Contract | Solidity ^0.8.20 (ObraRegistry.sol) |
| Blockchain | HSK Chain Testnet (Chain ID 133, EVM compatible) |
| Backend | Node.js + Express + ethers.js v6 |
| IA | OpenAI gpt-4o-mini con response_format JSON + validación Zod |
| Frontend | React + Tailwind CSS + MetaMask |
| Hash | SHA-256 del PDF completo (buffer) |
| Verificación | Hash registrado on-chain vs hash del nuevo PDF |

### Diferenciadores clave

1. **No es solo blockchain**: La IA explica qué cambió en lenguaje humano
2. **No es solo IA**: La blockchain garantiza inmutabilidad del registro
3. **No es automatización ciega**: Un humano toma la decisión final
4. **Clasificación de riesgo fija**: No queda al criterio libre de la IA
5. **Auditable**: Historial completo de versiones on-chain
