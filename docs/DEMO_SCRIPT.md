# ObraClara AI — Demo Script (3 + 2 Minutes)

> **Format**: 3-minute showcase + 2-minute Q&A  
> **Presenter**: [Your name]  
> **Required**: MetaMask connected to HSK Testnet, backend running on :3001, frontend on :5173

---

## Pre-Demo Checklist

- [ ] Backend running (`node backend/src/index.js`)
- [ ] Frontend running (`npx vite frontend/ --host`)
- [ ] MetaMask connected to HSK Chain Testnet with HSK tokens
- [ ] Contract deployed and `CONTRACT_ADDRESS` set in `.env`
- [ ] `GEMINI_API_KEY` set in `.env` (optional but recommended for live demo)
- [ ] Demo documents generated (`demo/contrato_original.pdf` and `demo/contrato_modificado.pdf`)
- [ ] Browser open to `http://localhost:5173`
- [ ] Terminal visible for showing backend logs (optional but impressive)

---

## Minute 0:00 – 0:30 · Opening Pitch

> *"In Bolivia, public works contracts worth millions are modified after signing.
> Someone changes the number of meters, reduces the budget, and the difference disappears.
> Nobody notices because paper documents can be altered without a trace.*
>
> *ObraClara AI solves this with three layers of protection:*
> - *The **blockchain** detects that something changed*
> - *The **AI** explains what changed*
> - *A **human** decides what to do about it*
>
> *Let me show you how it works — live."*

**[Action]**: Point to the screen showing ObraClara AI's home page.

---

## Minute 0:30 – 1:10 · Step 1: Register the Original Document

**[Action]**: On the "Registrar Obra" page:

1. **Name**: Type `Limpieza canal de riego Quillacollo`
2. **Description**: Type `500 metros del canal principal, zona sur`
3. **Document**: Upload `demo/contrato_original.pdf`
4. Click **"🔗 Registrar en Blockchain"**

**[Wait for result — ~5-10 seconds]**

**[Narrate while waiting]**:
> *"Right now, two things are happening simultaneously:*
> 1. *The text is being extracted from the document*
> 2. *The SHA-256 hash of the complete file is being registered on HSK Chain"*

**[When result appears, point to each element]**:
> *"Here we can see:*
> - *The **hash** — this is the cryptographic fingerprint of the document. It's now permanently on the blockchain.*
> - *And here's the **transaction hash** — anyone can verify this on the HSK Chain explorer."*

---

## Minute 1:10 – 1:50 · Step 2: Upload the Tampered Version

**[Action]**: Navigate to **"Mis Obras"**

> *"Now, let's say a corrupt official quietly changes the contract.
> They reduce the work from 500 meters to 300 meters, and skim Bs. 2,000 from the budget.
> Let's see what happens."*

**[Action]**:
1. Click **"🔍 Verificar"** on the obra card
2. Upload `demo/contrato_modificado.pdf`
3. Click **"Comparar con blockchain"**

**[Wait for result]**

**[When result appears — DRAMATIC MOMENT]**:
> *"**BOOM.** The obra is now FROZEN. ❄️*
>
> *Look at what happened: the blockchain compared the new hash with the original and they're DIFFERENT.
> The smart contract automatically froze the obra — nobody can continue working on it until an administrator reviews this."*

**[Point to the differences list]**:
> *"And here's where the AI comes in. Gemini 2.0 Flash doesn't just say 'something changed' — it tells you EXACTLY what changed:*
> - *➕ ADDED content, ➖ REMOVED content, ✏️ MODIFIED text*
> - *Each change shows **Before → After** with the exact text*
> - *Risk: 🔴 HIGH for amounts and quantities, 🟡 MEDIUM for dates*
>
> *The risk classification follows a fixed table — it's deterministic, not random.
> And if the AI isn't available, a local text diff still catches every change."*

---

## Minute 1:50 – 2:30 · Step 3: Administrator Decision

**[Action]**: Close the modal, click **"Ver detalle"** on the obra card.

> *"Now let's look at the administrator's view."*

**[Point to the detail page]**:
> *"The administrator sees the full alert with all the details.
> Because my wallet is the one that registered this obra, I can see the APPROVE and REJECT buttons."*

**[Action]**: Click **"❌ RECHAZAR CAMBIO"**

> *"I'm rejecting this change. The obra stays frozen. If this were a legitimate correction — like fixing a typo — I could approve it and register the new hash."*

---

## Minute 2:30 – 3:00 · Step 4: Audit Trail + Closing

**[Point to the version timeline]**:
> *"Everything is recorded on the blockchain:*
> - *Version 1: original hash, APPROVED ✅*
> - *Version 2: modified hash, REJECTED ❌*
>
> *Who uploaded what, when, and what decision was made. It cannot be deleted. It cannot be altered. Total transparency."*

**[Closing statement — deliver with conviction]**:

> *"**Blockchain** tells us that something changed.*
> *The **AI** helps us understand what changed.*
> *And a **person** decides what to do.*
>
> *This is ObraClara AI — because public money belongs to everyone."*

---

## Minute 3:00 – 5:00 · Q&A

### Prepared Answers

---

**Q: "Why blockchain and not just a database?"**

> *"A database is controlled by whoever owns the server. If a corrupt official can change a contract, they can also change the database. Blockchain removes that single point of trust — the hash is stored on a decentralized network that no single entity controls. Any citizen with internet can verify the document's integrity independently, without needing access to any government system."*

---

**Q: "What if the AI makes a mistake in its analysis?"**

> *"Great question. That's exactly why we have the human-in-the-loop. The AI doesn't make decisions — it provides analysis. The detection itself is purely cryptographic: hash A ≠ hash B is a mathematical fact, not an AI opinion. The AI only helps explain WHAT changed. And even if the AI's explanation is imperfect, the obra is already frozen by the blockchain. The administrator reviews the actual documents before deciding. We also have a 3-level fallback: Gemini API → local text diff → minimal report. The system never breaks."*

---

**Q: "Why Gemini 2.0 Flash instead of GPT-4?"**

> *"Three reasons: it's free (no API costs for the hackathon or production), it's fast (under 5 seconds per comparison), and it supports native JSON output. We use the REST API directly with fetch() — no SDK, zero extra dependencies. And if the API is unavailable, our local text diff catches every change anyway."*

---

**Q: "Don't digital signatures already solve this?"**

> *"Digital signatures prove WHO signed a document, but they don't prevent the same authorized person from signing a DIFFERENT version later. ObraClara's approach is different: we register the CONTENT hash of the original document. If anyone uploads any version — even if it's properly signed by authorized officials — and the content is different, the blockchain detects it. We're verifying document integrity, not identity."*

---

**Q: "Is this just for Bolivia?"**

> *"The problem is universal — hidden contract modifications happen everywhere, especially in developing countries. Bolivia is our starting point because it's where we understand the problem deeply. But the architecture is chain-agnostic (standard Solidity/EVM), language-agnostic (the AI can analyze documents in any language), and the smart contract is deployable on any EVM-compatible chain."*

---

**Q: "How does this scale? Isn't it expensive to put everything on-chain?"**

> *"We're very deliberate about what goes on-chain. Only hashes (32 bytes), states, and timestamps — NOT the actual documents. The PDFs, extracted text, and AI analysis stay off-chain. An on-chain hash comparison is a single SLOAD operation, one of the cheapest things you can do on EVM. We ran 25 tests on HSK Testnet with minimal gas usage."*

---

**Q: "Can the administrator be corrupt too?"**

> *"Yes, and that's why everything is on the blockchain. If an administrator approves a suspicious change, that decision is permanently recorded — their wallet address, the timestamp, the hash they approved. This creates accountability. In a production system, you could add multi-sig governance (requiring multiple administrators to approve) or DAO-based oversight. But even in the current design, the public audit trail makes corruption visible."*

---

## Emergency Fallbacks

**If the backend is slow**: *"The blockchain transaction is being confirmed on HSK Chain — this typically takes a few seconds on testnet."*

**If MetaMask errors**: *"Let me reconnect the wallet — blockchain interactions require signing transactions."*

**If AI returns diff_local data**: *"The AI comparison is running locally — it still catches every change, just without risk classification. In production with the Gemini API key configured, you get full risk analysis."*

**If the audience asks for the demo documents**: *"The demo documents are in the repository under `/demo/`. The original has 500 meters and Bs. 45,000; the modified version has 300 meters and Bs. 43,000. Everything else is identical."*
