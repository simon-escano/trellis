```markdown
# 00_SYSTEM_MANIFEST.md — Trellis Platform Foundation

## 1. Project Overview & Identity
- **Project Name:** Trellis
- **Tagline:** Interactive Concept Mapping & Document Intelligence Platform
- **Core Purpose:** Transform dense, unstructured documents (everyday articles, study materials, research papers, and technical RFCs) into fluid, interactive visual concept maps and executive insights. Built with a high-throughput Rust GraphQL gateway, an asynchronous AI extraction worker, and a reactive Angular 18 graph canvas.
- **Product Philosophy:** Layman-friendly simplicity on the frontend (effortless drag-and-drop mind mapping inspired by Obsidian), powered by enterprise-grade distributed systems under the hood.

---

## 2. $0 Zero-Cost Development Strategy

The entire development and demo lifecycle is designed to run at **$0.00 total spend**:

| Layer | $0 Zero-Cost Solution | Fallback / Local Zero-Cost |
| :--- | :--- | :--- |
| **LLM Inference Engine** | **Groq Free Tier** (Llama 3.3 70B / 8B at 30 RPM, no credit card) or **Google AI Studio** (Gemini Flash free tier) | **Local Ollama** (`llama3.1:8b` / `mistral`) or local mock structured analyzer |
| **Database & Cache** | Local containerized **PostgreSQL 16** via Docker Compose | Local SQLite fallback |
| **Backend & Worker** | Local native compilation (**Rust `cargo`** & **Node.js LTS**) | Embedded in-memory channels |
| **Frontend & UI Assets** | Open-source **Angular 18**, **Tailwind CSS**, **vis-network**, and **Google Fonts (DM Sans)** | Self-hosted static build |

---

## 3. Monorepo Architecture & Directory Layout

```text
trellis/
├── .trellis-specs/               # Specifications, data contracts, and design skill guidelines
│   ├── 00_SYSTEM_MANIFEST.md
│   ├── 01_DATA_CONTRACTS.md
│   ├── 02_STEP_RUST_BACKEND.md
│   ├── 03_STEP_AI_WORKER.md
│   ├── 04_STEP_ANGULAR_UI.md
│   ├── 05_VERIFICATION_LOG.md
│   └── skills/                   # Taste, Vercel design rules, and design tokens
│       ├── TASTE_GUIDELINES.md
│       ├── VERCEL_DESIGN_RULES.md
│       └── DESIGN_SYSTEM.md
├── apps/
│   ├── server/                   # Headless Rust GraphQL Gateway (Axum + async-graphql + SQLx)
│   ├── worker/                   # TypeScript AI Extraction Worker (Zod + Groq/Gemini SDK + DB Queue)
│   └── web/                      # Angular 18 Fluid Canvas (Signals + vis-network + @motionone/dom)
├── docker/
│   └── init.sql                  # PostgreSQL table definitions, ENUMs, and GIN indexes
├── docker-compose.yml            # Local PostgreSQL 16 containerization
├── IMPLEMENTATION_LEDGER.md      # Master autonomous tracking checklist
└── package.json                  # Root monorepo workspace scripts

```

---

## 4. Technology Stack & Exact Versions

### A. Backend API Gateway (`apps/server`)

* **Language/Runtime:** Rust 1.78+ (Edition 2021)
* **Web Framework:** `axum` (0.7+) with `tokio` (1.38+) async runtime
* **GraphQL Engine:** `async-graphql` (7.0+) with `async-graphql-axum`
* **Database Driver:** `sqlx` (0.7+) with PostgreSQL features, connection pooling, and parameterized queries
* **Serialization & Utilities:** `serde`, `serde_json`, `uuid` (v4), `chrono`, `tracing`, `tracing-subscriber`, `dotenvy`
* **DX & Exploration:** Embedded GraphiQL IDE at `/graphql`

### B. AI & Extraction Worker (`apps/worker`)

* **Language/Runtime:** TypeScript 5.4+ / Node.js 20 LTS
* **Validation & Schemas:** `zod` (v3.23+) for strict structured JSON output validation
* **AI Provider:** `@ai-sdk/openai` (configured with Groq/OpenAI base URL) or `@google/genai` (Gemini Flash free tier)
* **Database Client:** `pg` (8.13+) with pooled transactional clients and automatic rollback safety

### C. Frontend Client (`apps/web`)

* **Framework:** Angular 18 (Strict Standalone Components, Signals, no `NgModules`)
* **Graph & Mind Map Engine:** `vis-network` (peer) with force-directed physics (`forceAtlas2Based`)
* **Micro-Animations:** `@motionone/dom` (lightweight spring physics engine)
* **Reactivity Paradigm:** Angular Signals (`signal`, `computed`, `effect`)
* **GraphQL Client:** `apollo-angular` (6.0+) + `@apollo/client`
* **Styling Engine:** Tailwind CSS 3.4+
* **Iconography:** `lucide-angular`

---

## 5. UI Design System, Typography & Taste Rules

Adheres strictly to the guidelines in `.trellis-specs/skills/` (Taste Skill, Vercel Web Design Guidelines, and Obsidian Canvas Aesthetics):

* **Typography Standards:**
* **Global Default (100% of UI & Canvas):** `'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif`
* **Monospace Isolation:** `'JetBrains Mono', monospace` is **strictly restricted** to raw JSON drawers, document payloads, and UUID debug pills.


* **Visual Theme (Obsidian Dark Canvas):**
* `trellis-bg`: `#070A0F` (Deep void background)
* `trellis-surface`: `#0D1420` (Glassmorphic cards and floating toolbars)
* `trellis-border`: `#1E293B` (Structural grid lines)
* `trellis-border-active`: `#334155` (Hover and focused card borders)
* `trellis-text-primary`: `#F8FAFC` (High-contrast reading text)
* `trellis-text-muted`: `#94A3B8` (Secondary descriptions and helper labels)
* `trellis-accent`: `#00E599` (Emerald Neon for primary concepts and success states)
* `trellis-cyan`: `#38BDF8` (Cyan for secondary topics and interactive connections)
* `trellis-amber`: `#F59E0B` (In-progress / queued mapping indicator)
* `trellis-rose`: `#F43F5E` (Validation error and failed states)


* **Layman User Experience Principles:**
* Clean, approachable copy (e.g., *"+ Map New Document"*, *"How Ideas Connect"*, *"Key Insights"*).
* Multi-persona demo presets (Everyday Sleep Science, History, Technical RFC) for instant 1-click evaluation.
* Fluid node repulsion, edge energy glow, and hover neighborhood illumination.



---

## 6. Development & Commit Protocol

1. **Autonomous Local Execution:** Follow `IMPLEMENTATION_LEDGER.md` step-by-step.
2. **Atomic Commits:** Make descriptive local commits after every verified micro-task:
* `feat(scope): ...`
* `fix(scope): ...`
* `chore(scope): ...`


3. **No Automatic Push:** Git commits remain strictly local on the `main` branch.

```

---

Save this file to `.trellis-specs/00_SYSTEM_MANIFEST.md`. Let me know when you are ready to review and generate **`01_DATA_CONTRACTS.md`**.

```