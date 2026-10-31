# OmniSure™ Enterprise Insurance Operations Suite

Comprehensive multi-line insurance platform covering **Life Insurance**, **Property & Casualty (Commercial P&C)**, **Homeowners Insurance (HO-3)**, and **Personal Auto Insurance (PAP)**.

Features:
- **Claims Management Hub**: Multi-line claims registry, First Notice of Loss (FNOL) intake wizard, financial reserve adjustments, and adjudication workbench.
- **Fraud Detection Engine**: Multi-factor algorithmic risk scoring (0-100 scale), explainable heuristic breakdown, interactive parameter simulator, and Special Investigation Unit (SIU) dispatch brief generator.
- **Customer Service RAG Assistant**: Retrieval-Augmented Generation over statutory policy forms (PP 00 01, HO-3, TL-2024, ISO CG 00 01 / CP 00 30) with grounding citations and active claim context lookup.
- **Policy Form Repository**: Contract clauses, insuring agreements, statutory exclusions, and deductible guidelines.

---

## Getting Started Locally

### Prerequisites
- Node.js 18+ or 20+
- npm, pnpm, or bun

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (Optional)
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Add your Gemini API Key if you want dynamic AI-generated answers:
```env
GEMINI_API_KEY="your-gemini-api-key"
```
*(Note: If no API key is provided, the platform automatically uses its built-in deterministic Grounded RAG synthesizer and rule-based heuristic fraud scoring without downtime).*

### 3. Start Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:3000`.

### 4. Build for Production
```bash
npm run build
npm start
```
