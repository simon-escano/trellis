# IMPLEMENTATION_LEDGER.md — Master Execution Ledger & Handoff Directive

> **Trellis Platform Lead Systems Architect Execution Plan**  
> *Zero Drift • 1:1 Contract Parity • Autonomous Runner Alignment • $0 Zero-Cost Guarantee*

---

## Section 1: Cross-Layer Contract Consistency Audit

### 1.1 Enumerations Alignment Matrix

| Canonical Enum Value | PostgreSQL Enum (`01`) | GraphQL SDL Enum (`01`) | Rust Enum Variant (`02`) | TypeScript Zod Enum (`01`, `03`) | Angular 18 Type (`04`) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **QUEUED** | `'QUEUED'` | `QUEUED` | `ProcessingStatus::Queued` | `"QUEUED"` | `'QUEUED'` |
| **PROCESSING** | `'PROCESSING'` | `PROCESSING` | `ProcessingStatus::Processing` | `"PROCESSING"` | `'PROCESSING'` |
| **COMPLETED** | `'COMPLETED'` | `COMPLETED` | `ProcessingStatus::Completed` | `"COMPLETED"` | `'COMPLETED'` |
| **FAILED** | `'FAILED'` | `FAILED` | `ProcessingStatus::Failed` | `"FAILED"` | `'FAILED'` |
| **SYSTEM** | `'SYSTEM'` | `SYSTEM` | `EntityCategory::System` | `"SYSTEM"` | `'SYSTEM'` |
| **SERVICE** | `'SERVICE'` | `SERVICE` | `EntityCategory::Service` | `"SERVICE"` | `'SERVICE'` |
| **DATA_MODEL** | `'DATA_MODEL'` | `DATA_MODEL` | `EntityCategory::DataModel` | `"DATA_MODEL"` | `'DATA_MODEL'` |
| **INFRASTRUCTURE** | `'INFRASTRUCTURE'` | `INFRASTRUCTURE` | `EntityCategory::Infrastructure` | `"INFRASTRUCTURE"` | `'INFRASTRUCTURE'` |
| **SECURITY_POLICY** | `'SECURITY_POLICY'` | `SECURITY_POLICY` | `EntityCategory::SecurityPolicy` | `"SECURITY_POLICY"` | `'SECURITY_POLICY'` |
| **API_ENDPOINT** | `'API_ENDPOINT'` | `API_ENDPOINT` | `EntityCategory::ApiEndpoint` | `"API_ENDPOINT"` | `'API_ENDPOINT'` |
| **CONCEPT** | `'CONCEPT'` | `CONCEPT` | `EntityCategory::Concept` | `"CONCEPT"` | `'CONCEPT'` |

*Note on Rust Serde/SQLx Attributes:*  
Rust enums must derive `#[sqlx(type_name = "processing_status", rename_all = "SCREAMING_SNAKE_CASE")]` and `#[graphql(rename_items = "SCREAMING_SNAKE_CASE")]` to guarantee zero serialization divergence across SQLx, async-graphql, and JSON representations.

---

### 1.2 Entity & Model Field Mapping

#### Table A: `Document` Model Mapping
| PostgreSQL Column (`01`) | Type & Nullability | GraphQL Field (`01`) | Rust Struct Field (`02`) | TypeScript / Zod Property (`03`) | Angular Signal Model (`04`) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID PRIMARY KEY` (NN) | `id: ID!` | `pub id: uuid::Uuid` | `id: string` | `id: string` |
| `title` | `VARCHAR(255)` (NN) | `title: String!` | `pub title: String` | `title: string` | `title: string` |
| `raw_content` | `TEXT` (NN) | `rawContent: String!` | `pub raw_content: String` | `rawContent: string` | `rawContent: string` |
| `summary` | `TEXT` (NULL) | `summary: String` | `pub summary: Option<String>` | `summary?: string` | `summary: string \| null` |
| `status` | `processing_status` (NN) | `status: ProcessingStatus!` | `pub status: ProcessingStatus` | `status: ProcessingStatus` | `status: ProcessingStatus` |
| `error_message` | `TEXT` (NULL) | `errorMessage: String` | `pub error_message: Option<String>` | `errorMessage?: string \| null` | `errorMessage: string \| null` |
| `created_at` | `TIMESTAMPTZ` (NN) | `createdAt: String!` | `pub created_at: DateTime<Utc>` | `createdAt: string` | `createdAt: string` |
| `updated_at` | `TIMESTAMPTZ` (NN) | `updatedAt: String!` | `pub updated_at: DateTime<Utc>` | `updatedAt: string` | `updatedAt: string` |
| *N/A (Relational)* | *Foreign Keys* | `entities: [Entity!]!` | Resolved via `EntityLoader` | `entities: ExtractedEntity[]` | `entities: Entity[]` |
| *N/A (Relational)* | *Foreign Keys* | `relationships: [EntityRelationship!]!` | Resolved via `RelationshipLoader` | `relationships: ExtractedRelationship[]` | `relationships: EntityRelationship[]` |

*(NN = NOT NULL, NULL = Nullable)*

---

#### Table B: `Entity` Model Mapping
| PostgreSQL Column (`01`) | Type & Nullability | GraphQL Field (`01`) | Rust Struct Field (`02`) | TypeScript / Zod Property (`03`) | Angular Signal Model (`04`) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID PRIMARY KEY` (NN) | `id: ID!` | `pub id: uuid::Uuid` | `id: string` | `id: string` |
| `document_id` | `UUID` (NN, FK) | `documentId: ID!` | `pub document_id: uuid::Uuid` | `documentId: string` | `documentId: string` |
| `name` | `VARCHAR(255)` (NN) | `name: String!` | `pub name: String` | `name: string` | `name: string` |
| `category` | `entity_category` (NN) | `category: EntityCategory!` | `pub category: EntityCategory` | `category: EntityCategoryEnum` | `category: EntityCategory` |
| `confidence_score` | `REAL` (NN, 0.0–1.0) | `confidenceScore: Float!` | `pub confidence_score: f32` | `confidenceScore: number` | `confidenceScore: number` |
| `metadata` | `JSONB` (NN, default `{}`) | `metadata: String!` *(JSON String)* | `pub metadata: serde_json::Value` | `metadata: Record<string, any>` | `metadata: string \| Record<string, any>` |
| `created_at` | `TIMESTAMPTZ` (NN) | `createdAt: String!` | `pub created_at: DateTime<Utc>` | `createdAt: string` | `createdAt: string` |

---

#### Table C: `EntityRelationship` Model Mapping
| PostgreSQL Column (`01`) | Type & Nullability | GraphQL Field (`01`) | Rust Struct Field (`02`) | TypeScript / Zod Property (`03`) | Angular Signal Model (`04`) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID PRIMARY KEY` (NN) | `id: ID!` | `pub id: uuid::Uuid` | `id: string` | `id: string` |
| `document_id` | `UUID` (NN, FK) | `documentId: ID!` | `pub document_id: uuid::Uuid` | `documentId: string` | `documentId: string` |
| `source_entity_id` | `UUID` (NN, FK) | `sourceEntity: Entity!` | `pub source_entity_id: uuid::Uuid` | `sourceEntityName: string` *(pre-persist)* | `sourceEntity: Entity` |
| `target_entity_id` | `UUID` (NN, FK) | `targetEntity: Entity!` | `pub target_entity_id: uuid::Uuid` | `targetEntityName: string` *(pre-persist)* | `targetEntity: Entity` |
| `relation_type` | `VARCHAR(100)` (NN) | `relationType: String!` | `pub relation_type: String` | `relationType: string` | `relationType: string` |
| `confidence_score` | `REAL` (NN, 0.0–1.0) | `confidenceScore: Float!` | `pub confidence_score: f32` | `confidenceScore: number` | `confidenceScore: number` |
| `created_at` | `TIMESTAMPTZ` (NN) | `createdAt: String!` | `pub created_at: DateTime<Utc>` | `createdAt: string` | `createdAt: string` |

---

#### Table D: `SystemMetrics` Model Mapping
| Metric Name | GraphQL Field (`01`) | Rust Struct Field (`02`) | SQL Aggregation Expression | Angular UI Model (`04`) |
| :--- | :--- | :--- | :--- | :--- |
| **Total Documents** | `totalDocuments: Int!` | `pub total_documents: i32` | `COUNT(*)::INT` | `totalDocuments: number` |
| **Processed Count** | `processedCount: Int!` | `pub processed_count: i32` | `COUNT(*) FILTER (WHERE status = 'COMPLETED')::INT` | `processedCount: number` |
| **Queued Count** | `queuedCount: Int!` | `pub queued_count: i32` | `COUNT(*) FILTER (WHERE status = 'QUEUED')::INT` | `queuedCount: number` |
| **Failed Count** | `failedCount: Int!` | `pub failed_count: i32` | `COUNT(*) FILTER (WHERE status = 'FAILED')::INT` | `failedCount: number` |

---

### 1.3 Asynchronous Queue Contract

Payload transferred between Rust Gateway Ingestion $\rightarrow$ In-Memory / DB Queue $\rightarrow$ TypeScript AI Worker:

```json
{
  "jobId": "c4b8b6a2-9e32-49bb-b1d5-2e633d289012",
  "documentId": "8f31b64e-2895-46d4-8d9e-5e3692a7e781",
  "title": "How Caffeine Affects Sleep Architecture",
  "rawContent": "Caffeine acts as an adenosine receptor antagonist in the brain...",
  "enqueuedAt": "2026-08-31T04:45:00.000Z"
}
```

*Delivery Semantics & Invariants:*
- **Producer (Rust Server):** On `ingestDocument` mutation, row is inserted into PostgreSQL with status `'QUEUED'`. An in-memory dispatch event or database notification is emitted. Returns `IngestPayload` with `queueJobId`.
- **Consumer (TypeScript Worker):** Polls PostgreSQL safely using `SELECT id, title, raw_content FROM documents WHERE status = 'QUEUED' ORDER BY created_at ASC LIMIT 1 FOR UPDATE SKIP LOCKED`.
- **Worker Lock Transition:** Immediately executes `UPDATE documents SET status = 'PROCESSING', updated_at = NOW() WHERE id = $1` before invoking structured LLM extraction.

---

### 1.4 Spec Drift Log & Resolutions

1. **Specification File Duplication & Phase Alignment Drift:**
   - *Audit Finding:* In `.trellis-specs/`, `03_STEP_AI_WORKER.md` inadvertently mirrored `02_STEP_RUST_BACKEND.md`, and `04_STEP_ANGULAR_UI.md` mirrored Phase 2 worker text.
   - *Resolution:* Normalized and formalized all Phase 3 Angular 18 tasks (Tasks 3.1 through 3.6) directly within this Ledger, codifying Standalone Components, Signal Store reactivity, Apollo Client, `vis-network` physics canvas (`forceAtlas2Based`), `@motionone/dom` spring physics, DM Sans typography, and multi-persona demo presets.
2. **Metadata JSON Typing (PostgreSQL `JSONB` vs GraphQL `String!` vs TypeScript `Record`):**
   - *Audit Finding:* PostgreSQL schema stores `metadata` as native `JSONB`, TypeScript worker handles `z.record(z.any())`, while GraphQL SDL defines `metadata: String!`.
   - *Resolution:* Rust gateway converts `metadata` (`serde_json::Value`) to a serialized JSON string in `EntityGql` resolvers (`serde_json::to_string(&self.metadata).unwrap_or_else(|_| "{}".to_string())`). Angular client provides a parser helper to decode this into typed key-value pairs for the visual Inspector drawer.
3. **Entity Relationship Resolution (Name Matching vs Relational UUIDs):**
   - *Audit Finding:* The LLM returns relational edges by entity names (`sourceEntityName`, `targetEntityName`), but PostgreSQL requires foreign key UUIDs (`source_entity_id`, `target_entity_id`).
   - *Resolution:* `storage.service.ts` in the worker performs a transactional batch insert of entities first, constructs an in-memory lowercase lookup map `Map<string, string>` (Entity Name $\rightarrow$ Generated Entity UUID), resolves the foreign keys, and safely discards unresolvable edges before batch-inserting into `entity_relationships`.
4. **Rust GraphQL Enum Casing Serialization:**
   - *Audit Finding:* Rust enum variants default to PascalCase (`DataModel`, `SecurityPolicy`), whereas PostgreSQL and GraphQL expect SCREAMING_SNAKE_CASE (`DATA_MODEL`, `SECURITY_POLICY`).
   - *Resolution:* Explicitly annotated Rust models with `#[sqlx(type_name = "...", rename_all = "SCREAMING_SNAKE_CASE")]` and `#[graphql(rename_items = "SCREAMING_SNAKE_CASE")]`.

---

## Section 2: Phased Micro-Task Checklist

### Phase 0: Infrastructure & Workspace Foundation
- [x] **Task 0.1: Monorepo Workspace Configuration & Root Scripts**
  - **Target Files:** `package.json`, `.gitignore`, `README.md`
  - **Prerequisites:** None
  - **Validation Command:** `node -e "const pkg = require('./package.json'); if (!pkg.workspaces || !pkg.workspaces.includes('apps/*')) process.exit(1);"`
  - **Git Commit Message:** `chore(workspace): initialize monorepo root structure and npm workspaces`

- [x] **Task 0.2: PostgreSQL 16 Containerization & Initial DDL**
  - **Target Files:** `docker-compose.yml`, `docker/init.sql`
  - **Prerequisites:** Task 0.1
  - **Validation Command:** `docker compose config`
  - **Git Commit Message:** `feat(infra): add postgresql 16 docker compose configuration and ddl schema`

---

### Phase 1: Rust GraphQL Gateway — `apps/server`
- [x] **Task 1.1: Cargo Workspace & Dependency Scaffolding**
  - **Target Files:** `apps/server/Cargo.toml`, `apps/server/.env.example`
  - **Prerequisites:** Task 0.2
  - **Validation Command:** `cargo check --manifest-path apps/server/Cargo.toml`
  - **Git Commit Message:** `chore(server): scaffold cargo workspace and dependencies`

- [x] **Task 1.2: Environment Config & Database Pool**
  - **Target Files:** `apps/server/src/config.rs`, `apps/server/src/db.rs`
  - **Prerequisites:** Task 1.1
  - **Validation Command:** `cargo check --manifest-path apps/server/Cargo.toml`
  - **Git Commit Message:** `feat(server): implement environment configuration and sqlx postgres pool`

- [x] **Task 1.3: Domain Models & SQLx Mappings**
  - **Target Files:** `apps/server/src/models/mod.rs`, `apps/server/src/models/document.rs`, `apps/server/src/models/entity.rs`, `apps/server/src/models/relationship.rs`
  - **Prerequisites:** Task 1.2
  - **Validation Command:** `cargo check --manifest-path apps/server/Cargo.toml`
  - **Git Commit Message:** `feat(server): define domain models and screaming snake case enum mappings`

- [x] **Task 1.4: Asynchronous Queue Dispatcher**
  - **Target Files:** `apps/server/src/queue.rs`
  - **Prerequisites:** Task 1.3
  - **Validation Command:** `cargo check --manifest-path apps/server/Cargo.toml`
  - **Git Commit Message:** `feat(server): implement asynchronous in-memory queue dispatcher`

- [ ] **Task 1.5: Batch DataLoaders & GraphQL Schema Resolvers**
  - **Target Files:** `apps/server/src/graphql/mod.rs`, `apps/server/src/graphql/types.rs`, `apps/server/src/graphql/dataloaders.rs`, `apps/server/src/graphql/query.rs`, `apps/server/src/graphql/mutation.rs`
  - **Prerequisites:** Task 1.4
  - **Validation Command:** `cargo check --manifest-path apps/server/Cargo.toml`
  - **Git Commit Message:** `feat(server): implement async-graphql schema with batch dataloaders`

- [ ] **Task 1.6: Axum HTTP Server, CORS & GraphiQL Playground**
  - **Target Files:** `apps/server/src/main.rs`
  - **Prerequisites:** Task 1.5
  - **Validation Command:** `cargo check --manifest-path apps/server/Cargo.toml`
  - **Git Commit Message:** `feat(server): wire axum router with cors, health endpoint, and graphiql playground`

---

### Phase 2: TypeScript AI Extraction Worker — `apps/worker`
- [ ] **Task 2.1: TypeScript Worker Workspace & Configuration**
  - **Target Files:** `apps/worker/package.json`, `apps/worker/tsconfig.json`, `apps/worker/.env.example`, `apps/worker/src/config.ts`
  - **Prerequisites:** Task 0.2
  - **Validation Command:** `npm --prefix apps/worker run build`
  - **Git Commit Message:** `chore(worker): scaffold typescript worker workspace and runtime config`

- [ ] **Task 2.2: Database Pool & Zod Extraction Contracts**
  - **Target Files:** `apps/worker/src/db.ts`, `apps/worker/src/contracts/extraction.ts`
  - **Prerequisites:** Task 2.1
  - **Validation Command:** `npm --prefix apps/worker run build`
  - **Git Commit Message:** `feat(worker): implement postgres pool client and zod extraction contracts`

- [ ] **Task 2.3: AI LLM Structured Extraction Service & Mock Fallback**
  - **Target Files:** `apps/worker/src/services/llm.service.ts`
  - **Prerequisites:** Task 2.2
  - **Validation Command:** `npm --prefix apps/worker run build`
  - **Git Commit Message:** `feat(worker): implement ai structured extraction service with zero-cost mock fallback`

- [ ] **Task 2.4: Transactional PostgreSQL Knowledge Graph Writer**
  - **Target Files:** `apps/worker/src/services/storage.service.ts`
  - **Prerequisites:** Task 2.3
  - **Validation Command:** `npm --prefix apps/worker run build`
  - **Git Commit Message:** `feat(worker): implement transactional knowledge graph batch persistence with rollback`

- [ ] **Task 2.5: Resilient Queue Polling Consumer & Lifecycle**
  - **Target Files:** `apps/worker/src/queue/types.ts`, `apps/worker/src/queue/consumer.ts`, `apps/worker/src/index.ts`
  - **Prerequisites:** Task 2.4
  - **Validation Command:** `npm --prefix apps/worker run build`
  - **Git Commit Message:** `feat(worker): wire database queue polling consumer and graceful shutdown lifecycle`

---

### Phase 3: Angular 18 Reactive Web Client — `apps/web`
- [ ] **Task 3.1: Angular 18 Standalone Scaffolding & Tailwind CSS Theme**
  - **Target Files:** `apps/web/package.json`, `apps/web/angular.json`, `apps/web/tsconfig.json`, `apps/web/tailwind.config.js`, `apps/web/src/styles.css`, `apps/web/src/index.html`
  - **Prerequisites:** Task 0.1
  - **Validation Command:** `npm --prefix apps/web run build`
  - **Git Commit Message:** `chore(web): scaffold angular 18 standalone app with obsidian dark tailwind theme and dm sans`

- [ ] **Task 3.2: GraphQL Apollo Client & Signal Store State Management**
  - **Target Files:** `apps/web/src/app/core/models/document.model.ts`, `apps/web/src/app/core/services/graphql.service.ts`, `apps/web/src/app/core/state/document.store.ts`
  - **Prerequisites:** Task 3.1
  - **Validation Command:** `npm --prefix apps/web run build`
  - **Git Commit Message:** `feat(web): configure apollo graphql client and reactive angular signal store`

- [ ] **Task 3.3: Obsidian Canvas Mind Map Engine (`vis-network`)**
  - **Target Files:** `apps/web/src/app/features/canvas/canvas.component.ts`, `apps/web/src/app/features/canvas/canvas.component.html`, `apps/web/src/app/features/canvas/canvas.component.css`
  - **Prerequisites:** Task 3.2
  - **Validation Command:** `npm --prefix apps/web run build`
  - **Git Commit Message:** `feat(web): build interactive obsidian mind map canvas with forceAtlas2 physics`

- [ ] **Task 3.4: Executive Summary Drawer & Concept Inspector**
  - **Target Files:** `apps/web/src/app/features/inspector/inspector.component.ts`, `apps/web/src/app/features/inspector/inspector.component.html`
  - **Prerequisites:** Task 3.3
  - **Validation Command:** `npm --prefix apps/web run build`
  - **Git Commit Message:** `feat(web): create executive summary drawer and concept inspector with spring physics`

- [ ] **Task 3.5: Ingestion Modal with 3-Preset Persona Loader**
  - **Target Files:** `apps/web/src/app/core/data/demo-presets.ts`, `apps/web/src/app/features/ingest-modal/ingest-modal.component.ts`, `apps/web/src/app/features/ingest-modal/ingest-modal.component.html`
  - **Prerequisites:** Task 3.4
  - **Validation Command:** `npm --prefix apps/web run build`
  - **Git Commit Message:** `feat(web): implement document ingestion modal with 3-persona one-click demo presets`

- [ ] **Task 3.6: Header Toolbar, System Metrics & Live Status Stream**
  - **Target Files:** `apps/web/src/app/features/header/header.component.ts`, `apps/web/src/app/features/header/header.component.html`, `apps/web/src/app/app.component.ts`, `apps/web/src/app/app.component.html`
  - **Prerequisites:** Task 3.5
  - **Validation Command:** `npm --prefix apps/web run build`
  - **Git Commit Message:** `feat(web): build header navigation with live metrics and full canvas orchestration`

---

### Phase 4: System Integration & E2E Smoke Verification
- [ ] **Task 4.1: End-to-End Multi-Persona Verification & Documentation**
  - **Target Files:** `README.md`, `docker-compose.yml`
  - **Prerequisites:** Tasks 0.1–3.6
  - **Validation Command:** `npm --prefix apps/web run build && npm --prefix apps/worker run build && cargo check --manifest-path apps/server/Cargo.toml`
  - **Git Commit Message:** `docs: add end-to-end multi-persona verification playbook and project documentation`

---

## Section 3: Implementor Handoff Prompts

### Task 0.1: Monorepo Workspace Configuration & Root Scripts
```markdown
You are implementing Task 0.1 for Trellis.
Spec Reference: .trellis-specs/00_SYSTEM_MANIFEST.md

### Requirements:
1. Initialize the monorepo root package.json with npm workspaces covering `["apps/*"]`.
2. Add root convenience scripts:
   - "dev:server": "cargo run --manifest-path apps/server/Cargo.toml"
   - "dev:worker": "npm --prefix apps/worker run dev"
   - "dev:web": "npm --prefix apps/web start"
   - "build:all": "npm --prefix apps/worker run build && npm --prefix apps/web run build && cargo build --manifest-path apps/server/Cargo.toml"
3. Create a comprehensive .gitignore ignoring target/, node_modules/, dist/, .env, .DS_Store, and IDE artifacts.
4. Scaffold the directories: `apps/server`, `apps/worker`, `apps/web`, and `docker`.

### Verification Command:
node -e "const pkg = require('./package.json'); if (!pkg.workspaces || !pkg.workspaces.includes('apps/*')) process.exit(1);"

### Git Commit Command:
git add package.json .gitignore README.md IMPLEMENTATION_LEDGER.md && git commit -m "chore(workspace): initialize monorepo root structure and npm workspaces"
```

---

### Task 0.2: PostgreSQL 16 Containerization & Initial DDL
```markdown
You are implementing Task 0.2 for Trellis.
Spec Reference: .trellis-specs/01_DATA_CONTRACTS.md (Section 1)

### Requirements:
1. Create `docker-compose.yml` at the repository root defining a PostgreSQL 16 service (`trellis-postgres`) on port 5432 with credentials postgres/postgres and database `trellis`. Mount `docker/init.sql` to `/docker-entrypoint-initdb.d/init.sql`.
2. Create `docker/init.sql` implementing the exact DDL schema from 01_DATA_CONTRACTS.md:
   - Extension: `uuid-ossp`
   - ENUM `processing_status` ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED')
   - ENUM `entity_category` ('SYSTEM', 'SERVICE', 'DATA_MODEL', 'INFRASTRUCTURE', 'SECURITY_POLICY', 'API_ENDPOINT', 'CONCEPT')
   - Table `documents` (id, title, raw_content, summary, status, error_message, created_at, updated_at)
   - Table `entities` (id, document_id, name, category, confidence_score, metadata, created_at)
   - Table `entity_relationships` (id, document_id, source_entity_id, target_entity_id, relation_type, confidence_score, created_at)
   - Performance Indexes: status, created_at, document_id, category, metadata GIN index, source/target foreign key indexes.
3. Boot the container with `docker compose up -d` to verify PostgreSQL initializes `docker/init.sql` cleanly with zero SQL syntax errors.

### Verification Command:
docker compose config

### Git Commit Command:
git add docker-compose.yml docker/init.sql IMPLEMENTATION_LEDGER.md && git commit -m "feat(infra): add postgresql 16 docker compose configuration and ddl schema"
```

---

### Task 1.1: Cargo Workspace & Dependency Scaffolding
```markdown
You are implementing Task 1.1 for Trellis.
Spec Reference: .trellis-specs/02_STEP_RUST_BACKEND.md (Sections 2 & 3)

### Requirements:
1. Initialize Rust package in `apps/server` with Cargo.toml:
   - tokio (1.38+, features = ["full"])
   - axum (0.7+, features = ["macros"])
   - tower-http (0.5+, features = ["cors", "trace"])
   - async-graphql (7.0+, features = ["chrono", "uuid", "dataloader"])
   - async-graphql-axum (7.0+)
   - sqlx (0.7+, features = ["runtime-tokio-native-tls", "postgres", "chrono", "uuid", "json"])
   - serde, serde_json, uuid (v4, serde), chrono (serde), dotenvy, tracing, tracing-subscriber (env-filter)
2. Create `apps/server/.env.example` with `DATABASE_URL=postgres://postgres:postgres@localhost:5432/trellis` and `PORT=8080`.
3. Create placeholder `apps/server/src/main.rs` that compiles cleanly.

### Verification Command:
cargo check --manifest-path apps/server/Cargo.toml

### Git Commit Command:
git add apps/server/Cargo.toml apps/server/.env.example apps/server/src/main.rs IMPLEMENTATION_LEDGER.md && git commit -m "chore(server): scaffold cargo workspace and dependencies"
```

---

### Task 1.2: Environment Config & Database Pool
```markdown
You are implementing Task 1.2 for Trellis.
Spec Reference: .trellis-specs/02_STEP_RUST_BACKEND.md (Step 2.1 & Step 2.2)

### Requirements:
1. Implement `apps/server/src/config.rs`:
   - Define `Config` struct holding `database_url: String` and `port: u16`.
   - Implement `Config::from_env()` loading `.env` via `dotenvy::dotenv()` with defaults (`localhost:5432`, `8080`).
2. Implement `apps/server/src/db.rs`:
   - Implement `init_db_pool(database_url: &str) -> Result<sqlx::PgPool, sqlx::Error>`.
   - Configure `sqlx::postgres::PgPoolOptions` with `max_connections = 20`, connect timeout (5s), and idle timeout (10m).

### Verification Command:
cargo check --manifest-path apps/server/Cargo.toml

### Git Commit Command:
git add apps/server/src/config.rs apps/server/src/db.rs IMPLEMENTATION_LEDGER.md && git commit -m "feat(server): implement environment configuration and sqlx postgres pool"
```

---

### Task 1.3: Domain Models & SQLx Mappings
```markdown
You are implementing Task 1.3 for Trellis.
Spec Reference: .trellis-specs/01_DATA_CONTRACTS.md, 02_STEP_RUST_BACKEND.md (Step 2.2)

### Requirements:
1. Create `apps/server/src/models/document.rs`:
   - `ProcessingStatus` enum: `Queued`, `Processing`, `Completed`, `Failed`. Derives `sqlx::Type, async_graphql::Enum, Serialize, Deserialize, Clone, Copy, PartialEq, Eq`. Annotate with `#[sqlx(type_name = "processing_status", rename_all = "SCREAMING_SNAKE_CASE")]` and `#[graphql(rename_items = "SCREAMING_SNAKE_CASE")]`.
   - `Document` struct: `id: Uuid`, `title: String`, `raw_content: String`, `summary: Option<String>`, `status: ProcessingStatus`, `error_message: Option<String>`, `created_at: DateTime<Utc>`, `updated_at: DateTime<Utc>`. Derives `sqlx::FromRow, Clone, Serialize, Deserialize`.
2. Create `apps/server/src/models/entity.rs`:
   - `EntityCategory` enum: `System`, `Service`, `DataModel`, `Infrastructure`, `SecurityPolicy`, `ApiEndpoint`, `Concept`. Annotate with `#[sqlx(type_name = "entity_category", rename_all = "SCREAMING_SNAKE_CASE")]` and `#[graphql(rename_items = "SCREAMING_SNAKE_CASE")]`.
   - `Entity` struct: `id: Uuid`, `document_id: Uuid`, `name: String`, `category: EntityCategory`, `confidence_score: f32`, `metadata: serde_json::Value`, `created_at: DateTime<Utc>`.
3. Create `apps/server/src/models/relationship.rs`:
   - `EntityRelationship` struct: `id: Uuid`, `document_id: Uuid`, `source_entity_id: Uuid`, `target_entity_id: Uuid`, `relation_type: String`, `confidence_score: f32`, `created_at: DateTime<Utc>`.
4. Re-export all models in `apps/server/src/models/mod.rs`.

### Verification Command:
cargo check --manifest-path apps/server/Cargo.toml

### Git Commit Command:
git add apps/server/src/models/ IMPLEMENTATION_LEDGER.md && git commit -m "feat(server): define domain models and screaming snake case enum mappings"
```

---

### Task 1.4: Asynchronous Queue Dispatcher
```markdown
You are implementing Task 1.4 for Trellis.
Spec Reference: .trellis-specs/02_STEP_RUST_BACKEND.md (Step 2.3)

### Requirements:
1. Implement `apps/server/src/queue.rs`:
   - Define `QueueJob` struct: `job_id: Uuid`, `document_id: Uuid`, `title: String`, `raw_content: String`, `enqueued_at: DateTime<Utc>`. Derives `Serialize, Deserialize, Clone, Debug`.
   - Define `QueueDispatcher` wrapping `tokio::sync::mpsc::Sender<QueueJob>`.
   - Implement `QueueDispatcher::new(buffer: usize) -> (Self, tokio::sync::mpsc::Receiver<QueueJob>)`.
   - Implement `QueueDispatcher::dispatch(&self, job: QueueJob) -> Result<(), String>`.
   - Ensure channel dispatch is non-blocking so GraphQL mutations return immediately.

### Verification Command:
cargo check --manifest-path apps/server/Cargo.toml

### Git Commit Command:
git add apps/server/src/queue.rs IMPLEMENTATION_LEDGER.md && git commit -m "feat(server): implement asynchronous in-memory queue dispatcher"
```

---

### Task 1.5: Batch DataLoaders & GraphQL Schema Resolvers
```markdown
You are implementing Task 1.5 for Trellis.
Spec Reference: .trellis-specs/01_DATA_CONTRACTS.md (Section 2), 02_STEP_RUST_BACKEND.md (Steps 2.4 & 2.5)

### Requirements:
1. Implement `apps/server/src/graphql/dataloaders.rs`:
   - `EntityLoader` implementing `Loader<Uuid>`: Batch resolves entities by `document_id` using `SELECT * FROM entities WHERE document_id = ANY($1)`.
   - `RelationshipLoader` implementing `Loader<Uuid>`: Batch resolves relationships by `document_id` using `SELECT * FROM entity_relationships WHERE document_id = ANY($1)`.
   - `SingleEntityLoader` implementing `Loader<Uuid>`: Batch resolves individual entities by `id` using `SELECT * FROM entities WHERE id = ANY($1)` for resolving `sourceEntity` and `targetEntity`.
2. Implement `apps/server/src/graphql/types.rs`:
   - `DocumentGql`: Resolves `entities` and `relationships` via injected DataLoader context.
   - `EntityGql`: Serializes `metadata` JSON to String.
   - `EntityRelationshipGql`: Resolves `sourceEntity` and `targetEntity` via `SingleEntityLoader`.
   - `SystemMetricsGql`: `totalDocuments`, `processedCount`, `queuedCount`, `failedCount`.
   - `IngestDocumentInput`, `IngestPayloadGql`.
3. Implement `apps/server/src/graphql/query.rs`:
   - `getDocuments(limit: i32 = 20, offset: i32 = 0) -> Result<Vec<DocumentGql>>`.
   - `getDocument(id: Uuid) -> Result<Option<DocumentGql>>`.
   - `getMetrics() -> Result<SystemMetricsGql>`.
4. Implement `apps/server/src/graphql/mutation.rs`:
   - `ingestDocument(input: IngestDocumentInput) -> Result<IngestPayloadGql>`: Inserts into DB as `QUEUED`, dispatches `QueueJob`, returns payload.
   - `reprocessDocument(id: Uuid) -> Result<DocumentGql>`: Resets status to `QUEUED`, clears summary/error, re-dispatches job.
   - `deleteDocument(id: Uuid) -> Result<bool>`: Deletes document (cascades in DB).
5. Build and re-export schema in `apps/server/src/graphql/mod.rs`.

### Verification Command:
cargo check --manifest-path apps/server/Cargo.toml

### Git Commit Command:
git add apps/server/src/graphql/ IMPLEMENTATION_LEDGER.md && git commit -m "feat(server): implement async-graphql schema with batch dataloaders"
```

---

### Task 1.6: Axum HTTP Server, CORS & GraphiQL Playground
```markdown
You are implementing Task 1.6 for Trellis.
Spec Reference: .trellis-specs/02_STEP_RUST_BACKEND.md (Step 2.6)

### Requirements:
1. Implement `apps/server/src/main.rs`:
   - Initialize `tracing_subscriber` with `EnvFilter`.
   - Load `Config::from_env()`.
   - Initialize PostgreSQL pool using `init_db_pool()`.
   - Initialize DataLoaders (`DataLoader::new(EntityLoader::new(pool.clone()), tokio::spawn)`, etc.).
   - Initialize `QueueDispatcher` and spawn a background task draining the receiver.
   - Build `async_graphql::Schema` with Pool, DataLoaders, and QueueDispatcher in context.
   - Configure Tower `CorsLayer` allowing `http://localhost:4200`, `GET`, `POST`, `OPTIONS`, `Content-Type`.
   - Bind routes:
     - `GET /health` -> `{"status": "healthy", "service": "trellis-server"}`
     - `GET /graphql` -> `async_graphql::http::graphiql_source("/graphql", None)`
     - `POST /graphql` -> `GraphQLHandler` receiving queries and returning responses.
   - Bind listener to `0.0.0.0:PORT` using `tokio::net::TcpListener`.

### Verification Command:
cargo check --manifest-path apps/server/Cargo.toml

### Git Commit Command:
git add apps/server/src/main.rs IMPLEMENTATION_LEDGER.md && git commit -m "feat(server): wire axum router with cors, health endpoint, and graphiql playground"
```

---

### Task 2.1: TypeScript Worker Workspace & Configuration
```markdown
You are implementing Task 2.1 for Trellis.
Spec Reference: .trellis-specs/03_STEP_AI_WORKER.md (Sections 2 & 3, Step 3.1)

### Requirements:
1. Create `apps/worker/package.json`:
   - dependencies: `@ai-sdk/openai` (^0.0.60), `ai` (^3.4.0), `dotenv` (^16.4.5), `pg` (^8.13.0), `zod` (^3.23.8).
   - devDependencies: `@types/node` (^20.14.0), `@types/pg` (^8.11.8), `tsx` (^4.19.0), `typescript` (^5.4.5).
   - scripts: "build": "tsc", "start": "node dist/index.js", "dev": "tsx watch src/index.ts".
2. Create `apps/worker/tsconfig.json` with NodeNext module resolution, ES2022 target, strict mode.
3. Create `apps/worker/.env.example` defining `DATABASE_URL`, `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `AI_MODEL`, `POLL_INTERVAL_MS=3000`.
4. Create `apps/worker/src/config.ts` parsing and exporting typed environment settings.

### Verification Command:
npm --prefix apps/worker run build

### Git Commit Command:
git add apps/worker/package.json apps/worker/tsconfig.json apps/worker/.env.example apps/worker/src/config.ts IMPLEMENTATION_LEDGER.md && git commit -m "chore(worker): scaffold typescript worker workspace and runtime config"
```

---

### Task 2.2: Database Pool & Zod Extraction Contracts
```markdown
You are implementing Task 2.2 for Trellis.
Spec Reference: .trellis-specs/01_DATA_CONTRACTS.md (Section 4), 03_STEP_AI_WORKER.md (Step 3.2)

### Requirements:
1. Create `apps/worker/src/db.ts`:
   - Export PostgreSQL pool instance using `pg.Pool` initialized with `config.databaseUrl`.
   - Add error listener for idle client errors.
2. Create `apps/worker/src/contracts/extraction.ts`:
   - Define `EntityCategoryEnum` zod enum: `['SYSTEM', 'SERVICE', 'DATA_MODEL', 'INFRASTRUCTURE', 'SECURITY_POLICY', 'API_ENDPOINT', 'CONCEPT']`.
   - Define `ExtractedEntitySchema`: `name` (string min 1 max 255), `category` (EntityCategoryEnum default 'CONCEPT'), `confidenceScore` (number min 0 max 1 default 0.95), `metadata` (record default {}).
   - Define `ExtractedRelationshipSchema`: `sourceEntityName` (string), `targetEntityName` (string), `relationType` (string max 100), `confidenceScore` (number min 0 max 1 default 1.0).
   - Define `DocumentAnalysisOutputSchema`: `summary` (string min 10), `entities` (array of ExtractedEntitySchema min 1), `relationships` (array of ExtractedRelationshipSchema).
   - Export inferred TypeScript types: `ExtractedEntity`, `ExtractedRelationship`, `DocumentAnalysisOutput`.

### Verification Command:
npm --prefix apps/worker run build

### Git Commit Command:
git add apps/worker/src/db.ts apps/worker/src/contracts/extraction.ts IMPLEMENTATION_LEDGER.md && git commit -m "feat(worker): implement postgres pool client and zod extraction contracts"
```

---

### Task 2.3: AI LLM Structured Extraction Service & Mock Fallback
```markdown
You are implementing Task 2.3 for Trellis.
Spec Reference: .trellis-specs/03_STEP_AI_WORKER.md (Step 3.3), 00_SYSTEM_MANIFEST.md ($0 Zero-Cost Guarantee)

### Requirements:
1. Create `apps/worker/src/services/llm.service.ts`:
   - Implement `analyzeDocumentContent(rawText: string, title?: string): Promise<DocumentAnalysisOutput>`.
   - **Zero-Cost Deterministic Fallback (`generateMockAnalysis`):**
     If `OPENAI_API_KEY` is undefined/empty:
     - Generate a high-quality summary in plain language breaking down key concepts.
     - Extract 3 to 8 key concepts from the title and sentences, categorizing them sensibly (`CONCEPT`, `SYSTEM`, `SERVICE`, `DATA_MODEL`).
     - Build active directional links between adjacent/related concepts (`BLOCKS`, `POWERS`, `TRIGGERS`, `CONNECTS_TO`, `REGULATES`).
     - Return valid `DocumentAnalysisOutput` without throwing errors.
   - **LLM Extraction with Vercel AI SDK:**
     If `OPENAI_API_KEY` is present:
     - Use `generateObject` with `@ai-sdk/openai` using OpenAI or Groq base URL.
     - Provide a system prompt establishing the persona as a **Master Concept & Knowledge Architect**.
     - Pass `DocumentAnalysisOutputSchema` for strict Zod validation.

### Verification Command:
npm --prefix apps/worker run build

### Git Commit Command:
git add apps/worker/src/services/llm.service.ts IMPLEMENTATION_LEDGER.md && git commit -m "feat(worker): implement ai structured extraction service with zero-cost mock fallback"
```

---

### Task 2.4: Transactional PostgreSQL Knowledge Graph Writer
```markdown
You are implementing Task 2.4 for Trellis.
Spec Reference: .trellis-specs/03_STEP_AI_WORKER.md (Step 3.4)

### Requirements:
1. Create `apps/worker/src/services/storage.service.ts`:
   - Implement `saveAnalysisResults(documentId: string, data: DocumentAnalysisOutput): Promise<void>`.
   - Acquire a client from the pg pool and execute in a transaction (`BEGIN`):
     1. Update `documents` row: `summary = $1`, `status = 'COMPLETED'`, `error_message = NULL`, `updated_at = NOW()`.
     2. Delete any existing child entities and relationships for `document_id = $1` (idempotent re-processing).
     3. Insert all extracted entities into `entities`, returning generated `id` and `name`.
     4. Build an in-memory name lookup `Map<string, string>` (lowercase name $\rightarrow$ entity UUID).
     5. Resolve `source_entity_id` and `target_entity_id` for each relationship using the map. Skip relationships with unresolvable entities safely.
     6. Batch-insert resolved relationships into `entity_relationships`.
     7. Execute `COMMIT;`.
   - In `catch` block: Execute `ROLLBACK;`, update `documents` with `status = 'FAILED'`, `error_message = err.message`, then rethrow.
   - Ensure `client.release()` is called in `finally`.

### Verification Command:
npm --prefix apps/worker run build

### Git Commit Command:
git add apps/worker/src/services/storage.service.ts IMPLEMENTATION_LEDGER.md && git commit -m "feat(worker): implement transactional knowledge graph batch persistence with rollback"
```

---

### Task 2.5: Resilient Queue Polling Consumer & Lifecycle
```markdown
You are implementing Task 2.5 for Trellis.
Spec Reference: .trellis-specs/03_STEP_AI_WORKER.md (Step 3.5)

### Requirements:
1. Create `apps/worker/src/queue/types.ts`: Define `QueueJobPayload` and `ProcessingResult`.
2. Create `apps/worker/src/queue/consumer.ts`:
   - Implement `pollAndProcessJobs(pool: pg.Pool): Promise<boolean>`.
   - Query: `SELECT id, title, raw_content FROM documents WHERE status = 'QUEUED' ORDER BY created_at ASC LIMIT 1 FOR UPDATE SKIP LOCKED;`.
   - If row found:
     - Mark document status `'PROCESSING'` immediately.
     - Call `analyzeDocumentContent(row.raw_content, row.title)`.
     - Call `saveAnalysisResults(row.id, analysis)`.
     - Log step transitions: `[Job] Picked doc -> [AI] Analyzed -> [DB] Transaction Committed`.
3. Create `apps/worker/src/index.ts`:
   - Bootstrap polling loop with `setInterval` or recursive delay using `config.pollIntervalMs`.
   - Listen for `SIGINT` and `SIGTERM` signals: set shutdown flag, wait for inflight job to complete, call `pool.end()`, and exit cleanly.

### Verification Command:
npm --prefix apps/worker run build

### Git Commit Command:
git add apps/worker/src/queue/ apps/worker/src/index.ts IMPLEMENTATION_LEDGER.md && git commit -m "feat(worker): wire database queue polling consumer and graceful shutdown lifecycle"
```

---

### Task 3.1: Angular 18 Standalone Scaffolding & Tailwind CSS Theme
```markdown
You are implementing Task 3.1 for Trellis.
Spec Reference: .trellis-specs/00_SYSTEM_MANIFEST.md (Section 4C, Section 5)

### Requirements:
1. Initialize Angular 18 application in `apps/web` with Standalone Components (strict mode, no NgModules).
2. Configure `angular.json` using the standard Angular 18 `@angular-devkit/build-angular:application` builder (esbuild/Vite) with `"browser": "src/main.ts"` entry point (do not use legacy `@angular-devkit/build-angular:browser` Webpack schema).
3. Install dependencies:
   - `@apollo/client`, `apollo-angular`, `graphql`, `vis-network`, `@motionone/dom`, `lucide-angular` (or SVG icon equivalents), `tailwindcss`, `postcss`, `autoprefixer`.
4. Configure `apps/web/tailwind.config.js` with the Obsidian dark canvas color palette:
   - `trellis-bg`: `#070A0F`
   - `trellis-surface`: `#0D1420`
   - `trellis-border`: `#1E293B`
   - `trellis-border-active`: `#334155`
   - `trellis-text-primary`: `#F8FAFC`
   - `trellis-text-muted`: `#94A3B8`
   - `trellis-accent`: `#00E599`
   - `trellis-cyan`: `#38BDF8`
   - `trellis-amber`: `#F59E0B`
   - `trellis-rose`: `#F43F5E`
5. In `apps/web/src/index.html`:
   - Import Google Font **DM Sans** (weights 400, 500, 700) and **JetBrains Mono** (400, 600).
6. In `apps/web/src/styles.css`:
   - Apply DM Sans as universal font: `font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;`.
   - Restrict JetBrains Mono strictly to monospace code/JSON utility classes (`font-mono`).

### Verification Command:
npm --prefix apps/web run build

### Git Commit Command:
git add apps/web/ IMPLEMENTATION_LEDGER.md && git commit -m "chore(web): scaffold angular 18 standalone app with obsidian dark tailwind theme and dm sans"
```

---

### Task 3.2: GraphQL Apollo Client & Signal Store State Management
```markdown
You are implementing Task 3.2 for Trellis.
Spec Reference: .trellis-specs/01_DATA_CONTRACTS.md (Section 2)

### Requirements:
1. Create `apps/web/src/app/core/models/document.model.ts`:
   - Interfaces: `Document`, `Entity`, `EntityRelationship`, `SystemMetrics`, `IngestPayload`, `ProcessingStatus`, `EntityCategory`.
2. Create `apps/web/src/app/core/services/graphql.service.ts`:
   - Provide Apollo Client pointed at `http://localhost:8080/graphql`.
   - GraphQL queries & mutations:
     - `GET_DOCUMENTS`: Fetch document list, status, summary, timestamps.
     - `GET_DOCUMENT`: Fetch single document with child entities and relationships graph.
     - `GET_METRICS`: Fetch totalDocuments, processedCount, queuedCount, failedCount.
     - `INGEST_DOCUMENT`: Mutation `ingestDocument(input: { title, rawContent })`.
     - `REPROCESS_DOCUMENT`: Mutation `reprocessDocument(id: $id)`.
     - `DELETE_DOCUMENT`: Mutation `deleteDocument(id: $id)`.
3. Create `apps/web/src/app/core/state/document.store.ts`:
   - Implement Angular Signal Store managing:
     - `documents = signal<Document[]>([])`
     - `selectedDocument = signal<Document | null>(null)`
     - `selectedEntity = signal<Entity | null>(null)`
     - `metrics = signal<SystemMetrics>({ totalDocuments: 0, processedCount: 0, queuedCount: 0, failedCount: 0 })`
     - `isLoading = signal<boolean>(false)`
     - Computed signals: `activeConceptCount`, `activeRelationshipCount`, `hasSelectedDocument`.
   - Methods: `loadDocuments()`, `selectDocument(id: string)`, `ingest(title: string, rawContent: string)`, `reprocess(id: string)`, `delete(id: string)`, `loadMetrics()`, `pollActiveDocument()`.

### Verification Command:
npm --prefix apps/web run build

### Git Commit Command:
git add apps/web/src/app/core/ IMPLEMENTATION_LEDGER.md && git commit -m "feat(web): configure apollo graphql client and reactive angular signal store"
```

---

### Task 3.3: Obsidian Canvas Mind Map Engine (`vis-network`)
```markdown
You are implementing Task 3.3 for Trellis.
Spec Reference: .trellis-specs/00_SYSTEM_MANIFEST.md (Section 5), 04_STEP_ANGULAR_UI.md

### Requirements:
1. Create `apps/web/src/app/features/canvas/canvas.component.ts`, `.html`, `.css`:
   - Standalone component wrapping `vis-network` Network instance.
   - **Physics Configuration:**
     - Solver: `forceAtlas2Based`
     - Parameters: `gravitationalConstant: -50`, `centralGravity: 0.01`, `springLength: 120`, `springConstant: 0.08`, `damping: 0.4`.
   - **Visual Styling:**
     - Background: Transparent / `#070A0F`.
     - Nodes: Rounded box/pill shapes, border `#1E293B`, background `#0D1420`, font `'DM Sans'`, text `#F8FAFC`.
     - Category Color Accents:
       - `CONCEPT` $\rightarrow$ Emerald Neon (`#00E599`)
       - `SERVICE` / `SYSTEM` $\rightarrow$ Cyan (`#38BDF8`)
       - `DATA_MODEL` $\rightarrow$ Amber (`#F59E0B`)
       - `INFRASTRUCTURE` / `SECURITY_POLICY` / `API_ENDPOINT` $\rightarrow$ Rose / Purple.
     - Edges: Smooth curves, arrows to target, color `#334155`, font `'DM Sans'` (size 11, color `#94A3B8`).
   - **Interactions:**
     - Hover & Click: Highlight connected neighborhood (nodes + edges), dim background nodes.
     - Node click event triggers `documentStore.selectEntity(entity)`.
     - Auto-fit camera view on graph data changes.

### Verification Command:
npm --prefix apps/web run build

### Git Commit Command:
git add apps/web/src/app/features/canvas/ IMPLEMENTATION_LEDGER.md && git commit -m "feat(web): build interactive obsidian mind map canvas with forceAtlas2 physics"
```

---

### Task 3.4: Executive Summary Drawer & Concept Inspector
```markdown
You are implementing Task 3.4 for Trellis.
Spec Reference: .trellis-specs/00_SYSTEM_MANIFEST.md (Section 5), 05_VERIFICATION_LOG.md

### Requirements:
1. Create `apps/web/src/app/features/inspector/inspector.component.ts`, `.html`:
   - Standalone glassmorphic drawer displaying:
     - **"Executive Summary" / "Key Insights":** Readable summary card with plain-language bullet points and high-contrast typography in DM Sans.
     - **"How Ideas Connect":** Relationship list showing `Source Concept` $\rightarrow$ `[RELATION_TYPE]` $\rightarrow$ `Target Concept`.
     - **"Concept Inspector":** When an entity node is selected, shows entity category badge, confidence score progress meter, and JSON metadata drawer (rendered in JetBrains Mono font).
   - Use `@motionone/dom` for smooth slide-in and spring-damping animations on drawer open/close.
   - Include action buttons: "Reprocess Document" (amber) and "Delete Document" (rose).

### Verification Command:
npm --prefix apps/web run build

### Git Commit Command:
git add apps/web/src/app/features/inspector/ IMPLEMENTATION_LEDGER.md && git commit -m "feat(web): create executive summary drawer and concept inspector with spring physics"
```

---

### Task 3.5: Ingestion Modal with 3-Preset Persona Loader
```markdown
You are implementing Task 3.5 for Trellis.
Spec Reference: .trellis-specs/05_VERIFICATION_LOG.md (Section 3: Demo Scenarios)

### Requirements:
1. Create `apps/web/src/app/core/data/demo-presets.ts`:
   - Define 3 rich demo payloads:
     1. **Everyday Science:** *"How Caffeine Affects Sleep Architecture"*
     2. **World History:** *"The Steam Engine & Industrial Revolution"*
     3. **Technical RFC:** *"RFC 404: Distributed Event Broker Architecture"*
2. Create `apps/web/src/app/features/ingest-modal/ingest-modal.component.ts`, `.html`:
   - Glassmorphic modal with spring entry animation powered by `@motionone/dom`.
   - Title: **"Turn Text into Mind Map"** (Layman-friendly headline).
   - One-click preset loader pills: Clicking a preset fills the Title and Raw Content fields instantly.
   - Reactive form validation: Title (required, max 255), Content (required, min 10 chars).
   - Submit button: **"Generate Visual Map"** (Emerald neon button with loading spinner).
   - Error states highlighted in `#F43F5E` (rose).

### Verification Command:
npm --prefix apps/web run build

### Git Commit Command:
git add apps/web/src/app/core/data/demo-presets.ts apps/web/src/app/features/ingest-modal/ IMPLEMENTATION_LEDGER.md && git commit -m "feat(web): implement document ingestion modal with 3-persona one-click demo presets"
```

---

### Task 3.6: Header Toolbar, System Metrics & Live Status Stream
```markdown
You are implementing Task 3.6 for Trellis.
Spec Reference: .trellis-specs/00_SYSTEM_MANIFEST.md, 05_VERIFICATION_LOG.md

### Requirements:
1. Create `apps/web/src/app/features/header/header.component.ts`, `.html`:
   - Brand header: "Trellis" with Emerald glow icon and tagline *"Interactive Concept Mapping"*.
   - Live System Metrics Pills: Total Documents, Processed (emerald), Queued (amber), Failed (rose).
   - Document Selector dropdown: Quick switch between mapped documents with live status indicators.
   - Primary CTA: **"+ Map New Document"** opening the ingest modal.
2. In `apps/web/src/app/app.component.ts`, `.html`:
   - Assemble full application shell: Header, Canvas (center stage), Inspector Drawer (right/overlay), and Ingest Modal.
   - Implement polling effect on active document status (`QUEUED` $\rightarrow$ `PROCESSING` $\rightarrow$ `COMPLETED`) to auto-refresh the visual canvas when worker finishes extraction.

### Verification Command:
npm --prefix apps/web run build

### Git Commit Command:
git add apps/web/src/app/features/header/ apps/web/src/app/app.component.* IMPLEMENTATION_LEDGER.md && git commit -m "feat(web): build header navigation with live metrics and full canvas orchestration"
```

---

### Task 4.1: End-to-End Multi-Persona Verification & Documentation
```markdown
You are implementing Task 4.1 for Trellis.
Spec Reference: .trellis-specs/05_VERIFICATION_LOG.md

### Requirements:
1. Verify the entire system across all 3 persona demo presets:
   - Preset 1: Everyday Science (Caffeine & Sleep Architecture)
   - Preset 2: World History (Steam Engine & Industrial Revolution)
   - Preset 3: Technical RFC (Distributed Event Broker Architecture)
2. Verify zero-cost pipeline fallback when no LLM API key is provided.
3. Create root `README.md`:
   - System Overview & Architecture Diagram (Rust Gateway + TS AI Worker + Angular 18 Canvas).
   - Quick-Start Guide (Docker, Cargo, Worker, Web).
   - Demo Playbook & GraphQL sample queries.
4. Verify all tasks in `IMPLEMENTATION_LEDGER.md` are completed.

### Verification Command:
npm --prefix apps/web run build && npm --prefix apps/worker run build && cargo check --manifest-path apps/server/Cargo.toml

### Git Commit Command:
git add README.md docker-compose.yml IMPLEMENTATION_LEDGER.md && git commit -m "docs: add end-to-end multi-persona verification playbook and project documentation"
```
