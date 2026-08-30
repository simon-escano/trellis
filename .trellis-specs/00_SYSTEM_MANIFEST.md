# 00_SYSTEM_MANIFEST.md — Trellis Platform Foundation

## 1. Project Overview & Identity
- **Project Name:** Trellis
- **Tagline:** High-Throughput Document AI & Knowledge Graph Platform
- **Core Purpose:** Ingest unstructured technical RFCs, specs, and clinical literature; extract relational entity graphs and executive insights via an asynchronous AI pipeline; and serve data through a type-safe Rust GraphQL gateway to a reactive Angular 18 workspace.

---

## 2. Monorepo Architecture & Directory Layout

```text
trellis/
├── .trellis-specs/               # Architectural manifests, data contracts, and step execution plans
│   ├── 00_SYSTEM_MANIFEST.md
│   ├── 01_DATA_CONTRACTS.md
│   ├── 02_STEP_RUST_BACKEND.md
│   ├── 03_STEP_AI_WORKER.md
│   ├── 04_STEP_ANGULAR_UI.md
│   └── 05_VERIFICATION_LOG.md
├── apps/
│   ├── server/                   # Rust GraphQL Gateway (Axum + async-graphql + SQLx)
│   ├── worker/                   # TypeScript AI Extraction Worker (Zod + LLM SDK + SQS/Queue consumer)
│   └── web/                      # Angular 18 Standalone Dashboard (Apollo + Tailwind + Signals)
├── docker/
│   └── init.sql                  # PostgreSQL table definitions, ENUMs, and GIN indexes
├── docker-compose.yml            # Local PostgreSQL 16 + LocalStack / queue orchestration
└── package.json                  # Root monorepo workspace scripts

```

---

## 3. Technology Stack & Exact Versions

### A. Backend API Gateway (`apps/server`)

* **Language/Runtime:** Rust 1.78+ (Edition 2021)
* **Web Framework:** `axum` (0.7+) with `tokio` multi-threaded async runtime
* **GraphQL Engine:** `async-graphql` (7.0+) with `async-graphql-axum`
* **Database Driver:** `sqlx` (0.7+) with PostgreSQL features, compile-time query verification, and connection pooling
* **Serialization & Utilities:** `serde`, `serde_json`, `uuid` (v4), `chrono`, `tracing`, `tracing-subscriber`, `dotenvy`
* **Testing / DX:** Embedded GraphiQL IDE at `/graphql`

### B. AI & Ingestion Worker (`apps/worker`)

* **Language/Runtime:** TypeScript 5.4+ / Node.js 20 LTS
* **Validation & Schemas:** `zod` (v3.23+) for strict JSON Schema output enforcement
* **AI Orchestration:** `@ai-sdk/openai` / Cerebras SDK / LangChain Core primitives
* **Queue & Cloud SDK:** `@aws-sdk/client-sqs`, `@aws-sdk/client-s3` (with local fallback mock support)
* **Database Client:** `pg` (node-postgres) or `postgres.js` with pooled connections

### C. Frontend Client (`apps/web`)

* **Framework:** Angular 18 (Strict Standalone Components, no `NgModules`)
* **Reactivity Paradigm:** Angular Signals (`signal`, `computed`, `effect`) + RxJS for event streams
* **GraphQL Client:** `apollo-angular` + `@apollo/client`
* **Styling Engine:** Tailwind CSS 3.4+
* **Typography:** `DM Sans` (Primary UI) + `JetBrains Mono` (Code & Data contracts)
* **Micro-Animations:** `@motionone/dom` (High-performance vanilla motion engine)
* **Iconography:** `lucide-angular`

### D. Data & Infrastructure Layer

* **Database:** PostgreSQL 16 (Relational tables + `JSONB` document stores + `btree`/`gin` indexing)
* **Local Containerization:** Docker & Docker Compose

---

## 4. UI Design System & Tokens

* **Typography:**
* **Headings & Body:** `'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
* **Monospace & Metadata:** `'JetBrains Mono', monospace`


* **Color Palette (Deep Obsidian / Technical Slate):**
* `trellis-bg`: `#070A0F` (Deep void base)
* `trellis-surface`: `#0D1420` (Card and panel background)
* `trellis-border`: `#1E293B` (Structural grid lines)
* `trellis-border-active`: `#334155` (Hover/focus states)
* `trellis-text-primary`: `#F8FAFC` (High-contrast reading text)
* `trellis-text-muted`: `#94A3B8` (Secondary metadata)
* `trellis-accent`: `#00E599` (Emerald Neon for active states and success)
* `trellis-cyan`: `#38BDF8` (Graph connection nodes and streaming indicators)
* `trellis-amber`: `#F59E0B` (Queued / in-progress warning state)
* `trellis-rose`: `#F43F5E` (Validation error and failed job states)



---

## 5. Development & Commit Protocol

To guarantee clean version control throughout development:

1. **Atomic Commits:** Make descriptive local commits after completing each discrete module or milestone.
2. **Conventional Commit Standard:**
* `feat(scope): ...` (New functionality or endpoints)
* `fix(scope): ...` (Bug fixes, borrow checker fixes, type resolution)
* `refactor(scope): ...` (Code restructuring without behavior changes)
* `chore(scope): ...` (Config, Docker, dependencies)


3. **No Automatic Push:** The AI agent must **never** execute `git push`. All commits remain local until manual user review.
4. **Execution Flow:** Complete tasks sequentially. No jumping ahead until current step builds and passes basic verification.

```