# IMPLEMENTATION_LEDGER.md — Trellis Master Execution Ledger

> **Platform:** Trellis — High-Throughput Document AI & Knowledge Graph Platform  
> **Lead Systems Architect:** DeepMind / Antigravity AI  
> **Generated:** 2026-08-31  
> **Status:** Active Execution Tracking

---

# Section 1: Contract Consistency Audit

This section confirms the 1:1 cross-layer alignment across PostgreSQL DDL (`01_DATA_CONTRACTS.md`), GraphQL SDL (`01_DATA_CONTRACTS.md`), Rust Backend Models (`02_STEP_RUST_BACKEND.md`), TypeScript Zod Schemas & Worker Types (`01_DATA_CONTRACTS.md`, `03_STEP_AI_WORKER.md`), and Angular 18 Frontend Models (`04_STEP_ANGULAR_UI.md`).

---

### 1.1 Enumerations Alignment Matrix

| Canonical Value | PostgreSQL Type (`01`) | GraphQL Enum (`01`) | Rust Enum (`02`) | TypeScript Zod (`01`/`03`) | Angular Type (`04`) | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **QUEUED** | `processing_status` | `ProcessingStatus.QUEUED` | `ProcessingStatus::Queued` | `"QUEUED"` | `'QUEUED'` | **MATCH** |
| **PROCESSING** | `processing_status` | `ProcessingStatus.PROCESSING` | `ProcessingStatus::Processing` | `"PROCESSING"` | `'PROCESSING'` | **MATCH** |
| **COMPLETED** | `processing_status` | `ProcessingStatus.COMPLETED` | `ProcessingStatus::Completed` | `"COMPLETED"` | `'COMPLETED'` | **MATCH** |
| **FAILED** | `processing_status` | `ProcessingStatus.FAILED` | `ProcessingStatus::Failed` | `"FAILED"` | `'FAILED'` | **MATCH** |
| **SYSTEM** | `entity_category` | `EntityCategory.SYSTEM` | `EntityCategory::System` | `"SYSTEM"` | `'SYSTEM'` | **MATCH** |
| **SERVICE** | `entity_category` | `EntityCategory.SERVICE` | `EntityCategory::Service` | `"SERVICE"` | `'SERVICE'` | **MATCH** |
| **DATA_MODEL** | `entity_category` | `EntityCategory.DATA_MODEL` | `EntityCategory::DataModel` | `"DATA_MODEL"` | `'DATA_MODEL'` | **MATCH** |
| **INFRASTRUCTURE** | `entity_category` | `EntityCategory.INFRASTRUCTURE` | `EntityCategory::Infrastructure` | `"INFRASTRUCTURE"` | `'INFRASTRUCTURE'` | **MATCH** |
| **SECURITY_POLICY** | `entity_category` | `EntityCategory.SECURITY_POLICY` | `EntityCategory::SecurityPolicy` | `"SECURITY_POLICY"` | `'SECURITY_POLICY'` | **MATCH** |
| **API_ENDPOINT** | `entity_category` | `EntityCategory.API_ENDPOINT` | `EntityCategory::ApiEndpoint` | `"API_ENDPOINT"` | `'API_ENDPOINT'` | **MATCH** |
| **CONCEPT** | `entity_category` | `EntityCategory.CONCEPT` | `EntityCategory::Concept` | `"CONCEPT"` | `'CONCEPT'` | **MATCH** |

---

### 1.2 Entity & Model Field Mapping

#### A. Document Model

| Field Concept | PostgreSQL Column | GraphQL Field | Rust Model (`apps/server`) | Worker TypeScript | Angular Interface (`apps/web`) | Notes / Casing Rule |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Primary Key | `id UUID PK` | `id: ID!` | `pub id: Uuid` | `documentId: string` | `id: string` | Canonical UUID v4 |
| Document Title | `title VARCHAR(255)` | `title: String!` | `pub title: String` | `title: string` | `title: string` | Non-null string |
| Raw Text Content | `raw_content TEXT` | `rawContent: String!` | `pub raw_content: String` | `rawContent: string` | `rawContent: string` | SQL snake $\rightarrow$ GQL/TS camel |
| Executive Summary | `summary TEXT` | `summary: String` | `pub summary: Option<String>` | `summary: string` | `summary: string \| null` | Nullable until processed |
| Processing State | `status processing_status`| `status: ProcessingStatus!`| `pub status: ProcessingStatus` | `status: ProcessingStatus` | `status: ProcessingStatus` | Default `'QUEUED'` |
| Error Trace | `error_message TEXT` | `errorMessage: String` | `pub error_message: Option<String>` | `errorMessage?: string` | `errorMessage: string \| null` | Set upon extraction failure |
| Creation Timestamp | `created_at TIMESTAMPTZ` | `createdAt: String!` | `pub created_at: DateTime<Utc>`| N/A | `createdAt: string` | ISO 8601 string in API |
| Update Timestamp | `updated_at TIMESTAMPTZ` | `updatedAt: String!` | `pub updated_at: DateTime<Utc>`| N/A | `updatedAt: string` | ISO 8601 string in API |
| Child Entities | Foreign Key relation | `entities: [Entity!]!` | Resolved via DataLoader | Extracted array | `entities?: Entity[]` | Batch resolved via DataLoader |
| Child Relationships | Foreign Key relation | `relationships: [EntityRelationship!]!` | Resolved via DataLoader | Extracted array | `relationships?: EntityRelationship[]` | Batch resolved via DataLoader |

#### B. Entity Model

| Field Concept | PostgreSQL Column | GraphQL Field | Rust Model (`apps/server`) | Worker Zod Schema | Angular Interface (`apps/web`) | Notes / Casing Rule |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Entity ID | `id UUID PK` | `id: ID!` | `pub id: Uuid` | Generated on insert | `id: string` | UUID v4 |
| Document FK | `document_id UUID` | `documentId: ID!` | `pub document_id: Uuid` | Injected FK | `documentId: string` | SQL snake $\rightarrow$ GQL/TS camel |
| Entity Name | `name VARCHAR(255)` | `name: String!` | `pub name: String` | `name: z.string().min(1)` | `name: string` | Unique within doc context |
| Entity Category | `category entity_category` | `category: EntityCategory!` | `pub category: EntityCategory` | `category: EntityCategoryEnum` | `category: EntityCategory` | Strict 7-variant enum |
| Confidence Score | `confidence_score REAL` | `confidenceScore: Float!` | `pub confidence_score: f32` | `confidenceScore: z.number()` | `confidenceScore: number` | Range: `[0.0, 1.0]` |
| Entity Metadata | `metadata JSONB` | `metadata: String!` | `pub metadata: serde_json::Value` | `metadata: z.record(z.any())` | `metadata: string` | JSON string in GraphQL |
| Creation Timestamp | `created_at TIMESTAMPTZ` | `createdAt: String!` | `pub created_at: DateTime<Utc>`| N/A | `createdAt: string` | ISO 8601 string in API |

#### C. EntityRelationship Model

| Field Concept | PostgreSQL Column | GraphQL Field | Rust Model (`apps/server`) | Worker Zod Schema | Angular Interface (`apps/web`) | Notes / Casing Rule |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Relationship ID | `id UUID PK` | `id: ID!` | `pub id: Uuid` | Generated on insert | `id: string` | UUID v4 |
| Document FK | `document_id UUID` | `documentId: ID!` | `pub document_id: Uuid` | Injected FK | `documentId: string` | SQL snake $\rightarrow$ GQL/TS camel |
| Source Entity FK | `source_entity_id UUID` | `sourceEntity: Entity!` | `pub source_entity_id: Uuid` | `sourceEntityName: string` | `sourceEntity: Entity` | Worker resolves Name $\rightarrow$ FK |
| Target Entity FK | `target_entity_id UUID` | `targetEntity: Entity!` | `pub target_entity_id: Uuid` | `targetEntityName: string` | `targetEntity: Entity` | Worker resolves Name $\rightarrow$ FK |
| Relationship Verb | `relation_type VARCHAR(100)`| `relationType: String!` | `pub relation_type: String` | `relationType: z.string()` | `relationType: string` | e.g. `'CALLS'`, `'STORES_IN'` |
| Confidence Score | `confidence_score REAL` | `confidenceScore: Float!` | `pub confidence_score: f32` | `confidenceScore: z.number()` | `confidenceScore: number` | Range: `[0.0, 1.0]` |
| Creation Timestamp | `created_at TIMESTAMPTZ` | `createdAt: String!` | `pub created_at: DateTime<Utc>`| N/A | `createdAt: string` | ISO 8601 string in API |

#### D. SystemMetrics Contract & Potential Drift Audit

| Field Concept | GraphQL SDL (`01`) | Rust Resolver (`02`) | Angular Model Target (`04`) | Spec Drift Flag & Resolution |
| :--- | :--- | :--- | :--- | :--- |
| Total Docs | `totalDocuments: Int!` | `total_documents: i32` | `totalDocuments: number` | **RESOLVED:** `04` spec text mentioned `{ total, processed, queued, failed }` in brief prose, but GraphQL SDL strictly mandates `totalDocuments`, `processedCount`, `queuedCount`, `failedCount`. All frontend interfaces and queries **MUST** strictly use `totalDocuments`, `processedCount`, `queuedCount`, `failedCount`. |
| Processed Docs | `processedCount: Int!` | `processed_count: i32` | `processedCount: number` | **RESOLVED:** Casing matches `processedCount`. |
| Queued Docs | `queuedCount: Int!` | `queued_count: i32` | `queuedCount: number` | **RESOLVED:** Casing matches `queuedCount`. |
| Failed Docs | `failedCount: Int!` | `failed_count: i32` | `failedCount: number` | **RESOLVED:** Casing matches `failedCount`. |

---

### 1.3 Asynchronous Queue Contract

Payload format transferred between Rust Ingestion Mutation $\rightarrow$ Local Worker Channel / AWS SQS:

```json
{
  "jobId": "c4b8b6a2-9e32-49bb-b1d5-2e633d289012",
  "documentId": "8f31b64e-2895-46d4-8d9e-5e3692a7e781",
  "title": "RFC 9110: HTTP Semantics Overview",
  "rawContent": "HTTP is a stateless application-level protocol...",
  "enqueuedAt": "2026-08-31T04:45:00.000Z"
}
```

* **Contract Validation:** All 5 fields (`jobId`, `documentId`, `title`, `rawContent`, `enqueuedAt`) are non-null strings adhering to UUID and ISO-8601 formats.

---

# Section 2: Phased Micro-Task Checklist

Following the **AUTONOMOUS TASK RUNNER PROTOCOL**, tasks must be executed strictly in sequential order. Each task is marked with an atomic status checkbox (`- [ ]` / `- [x]`), prerequisites, target files, exact validation command, and conventional git commit message.

```
[x] Phase 0: Infrastructure & Workspace Foundation
    ├── [x] Task 0.1: Docker Infrastructure & PostgreSQL Initialization Schema
    └── [x] Task 0.2: Root Workspace Configuration & Environment Templates

[ ] Phase 1: Rust GraphQL Gateway (apps/server)
    ├── [x] Task 1.1: Server Cargo Manifest, Dependencies & Config Module
    ├── [ ] Task 1.2: SQLx Database Pool & Domain Entity Models
    ├── [ ] Task 1.3: Asynchronous In-Memory / Channel Queue Dispatcher
    ├── [ ] Task 1.4: DataLoader Implementation & GraphQL Types
    ├── [ ] Task 1.5: GraphQL Queries, Mutations & Schema Builder
    └── [ ] Task 1.6: Axum Server Setup, CORS & Embedded GraphiQL Playground

[ ] Phase 2: TypeScript AI Extraction Worker (apps/worker)
    ├── [ ] Task 2.1: Worker Workspace Scaffolding & Dependencies
    ├── [ ] Task 2.2: Database Client & Zod Extraction Contracts
    ├── [ ] Task 2.3: AI LLM Structured Output Extraction Service
    ├── [ ] Task 2.4: Transactional PostgreSQL Knowledge Graph Writer
    └── [ ] Task 2.5: Resilient Queue Polling Loop & Graceful Lifecycle

[ ] Phase 3: Angular 18 Reactive Web Client (apps/web)
    ├── [ ] Task 3.1: Angular 18 Standalone Project Scaffolding & Theme Config
    ├── [ ] Task 3.2: GraphQL Client & Reactive Signals State Service
    ├── [ ] Task 3.3: Obsidian Layout Shell, Navbar & System Metrics
    ├── [ ] Task 3.4: Ingest Document Modal & Demo Spec Loader
    ├── [ ] Task 3.5: Left Rail Document List & Animated Status Badges
    └── [ ] Task 3.6: Document Detail Viewer, Entity Inspector & Relationship Graph

[ ] Phase 4: System Integration, E2E Smoke Testing & Verification
    └── [ ] Task 4.1: End-to-End Pipeline Verification & Verification Log Finalization
```

---

## Phase 0: Infrastructure & Workspace Foundation

- [x] **Task 0.1: Docker Infrastructure & PostgreSQL Initialization Schema**
  - **Target Files:** `docker/init.sql`, `docker-compose.yml`
  - **Prerequisites:** None
  - **Validation Command:** `docker compose config`
  - **Git Commit Message:** `chore(infra): add docker compose and postgres initialization schema`

- [x] **Task 0.2: Root Workspace Configuration & Environment Templates**
  - **Target Files:** `package.json`, `.gitignore`, `.env.example`
  - **Prerequisites:** Task 0.1
  - **Validation Command:** `node -e "const pkg = require('./package.json'); console.log('Monorepo root:', pkg.name)"`
  - **Git Commit Message:** `chore(root): configure monorepo scripts and environment templates`

---

## Phase 1: Rust GraphQL Gateway (`apps/server`)

- [x] **Task 1.1: Server Cargo Manifest, Dependencies & Config Module**
  - **Target Files:** `apps/server/Cargo.toml`, `apps/server/.env.example`, `apps/server/src/config.rs`
  - **Prerequisites:** Task 0.2
  - **Validation Command:** `cargo check --manifest-path apps/server/Cargo.toml`
  - **Git Commit Message:** `chore(server): scaffold cargo workspace and dependencies`

- [ ] **Task 1.2: SQLx Database Pool & Domain Entity Models**
  - **Target Files:** `apps/server/src/db.rs`, `apps/server/src/models/mod.rs`, `apps/server/src/models/document.rs`, `apps/server/src/models/entity.rs`, `apps/server/src/models/relationship.rs`
  - **Prerequisites:** Task 1.1
  - **Validation Command:** `cargo check --manifest-path apps/server/Cargo.toml`
  - **Git Commit Message:** `feat(server): add sqlx database pool and domain models`

- [ ] **Task 1.3: Asynchronous In-Memory / Channel Queue Dispatcher**
  - **Target Files:** `apps/server/src/queue.rs`
  - **Prerequisites:** Task 1.2
  - **Validation Command:** `cargo check --manifest-path apps/server/Cargo.toml`
  - **Git Commit Message:** `feat(server): implement asynchronous queue dispatcher`

- [ ] **Task 1.4: DataLoader Implementation & GraphQL Types**
  - **Target Files:** `apps/server/src/graphql/mod.rs`, `apps/server/src/graphql/types.rs`, `apps/server/src/graphql/dataloaders.rs`
  - **Prerequisites:** Task 1.3
  - **Validation Command:** `cargo check --manifest-path apps/server/Cargo.toml`
  - **Git Commit Message:** `feat(server): implement dataloaders for entity and relationship batching`

- [ ] **Task 1.5: GraphQL Queries, Mutations & Schema Builder**
  - **Target Files:** `apps/server/src/graphql/query.rs`, `apps/server/src/graphql/mutation.rs`
  - **Prerequisites:** Task 1.4
  - **Validation Command:** `cargo check --manifest-path apps/server/Cargo.toml`
  - **Git Commit Message:** `feat(server): implement async-graphql schema queries and mutations`

- [ ] **Task 1.6: Axum Server Setup, CORS & Embedded GraphiQL Playground**
  - **Target Files:** `apps/server/src/main.rs`
  - **Prerequisites:** Task 1.5
  - **Validation Command:** `cargo check --manifest-path apps/server/Cargo.toml`
  - **Git Commit Message:** `feat(server): wire axum router cors and embedded graphiql playground`

---

## Phase 2: TypeScript AI Extraction Worker (`apps/worker`)

- [ ] **Task 2.1: Worker Workspace Scaffolding & Dependencies**
  - **Target Files:** `apps/worker/package.json`, `apps/worker/tsconfig.json`, `apps/worker/.env.example`, `apps/worker/src/config.ts`
  - **Prerequisites:** Task 0.2
  - **Validation Command:** `npm --prefix apps/worker run build`
  - **Git Commit Message:** `chore(worker): scaffold typescript worker workspace and dependencies`

- [ ] **Task 2.2: Database Client & Zod Extraction Contracts**
  - **Target Files:** `apps/worker/src/db.ts`, `apps/worker/src/contracts/extraction.ts`
  - **Prerequisites:** Task 2.1
  - **Validation Command:** `npm --prefix apps/worker run build`
  - **Git Commit Message:** `feat(worker): implement zod extraction schemas and database connection`

- [ ] **Task 2.3: AI LLM Structured Output Extraction Service**
  - **Target Files:** `apps/worker/src/services/llm.service.ts`
  - **Prerequisites:** Task 2.2
  - **Validation Command:** `npm --prefix apps/worker run build`
  - **Git Commit Message:** `feat(worker): build ai sdk prompt orchestration with zod structured outputs`

- [ ] **Task 2.4: Transactional PostgreSQL Knowledge Graph Writer**
  - **Target Files:** `apps/worker/src/services/storage.service.ts`
  - **Prerequisites:** Task 2.3
  - **Validation Command:** `npm --prefix apps/worker run build`
  - **Git Commit Message:** `feat(worker): create transactional postgres batch writer with rollback safety`

- [ ] **Task 2.5: Resilient Queue Polling Loop & Graceful Lifecycle**
  - **Target Files:** `apps/worker/src/queue/types.ts`, `apps/worker/src/queue/consumer.ts`, `apps/worker/src/index.ts`
  - **Prerequisites:** Task 2.4
  - **Validation Command:** `npm --prefix apps/worker run build`
  - **Git Commit Message:** `feat(worker): wire async polling event loop and graceful shutdown lifecycle`

---

## Phase 3: Angular 18 Reactive Web Client (`apps/web`)

- [ ] **Task 3.1: Angular 18 Standalone Project Scaffolding & Theme Config**
  - **Target Files:** `apps/web/package.json`, `apps/web/angular.json`, `apps/web/tsconfig.json`, `apps/web/tailwind.config.js`, `apps/web/src/index.html`, `apps/web/src/styles.css`, `apps/web/src/main.ts`
  - **Prerequisites:** Task 0.2
  - **Validation Command:** `npm --prefix apps/web run build`
  - **Git Commit Message:** `chore(web): scaffold angular 18 standalone project with tailwind and dm sans`

- [ ] **Task 3.2: GraphQL Client & Reactive Signals State Service**
  - **Target Files:** `apps/web/src/app/core/models/document.model.ts`, `apps/web/src/app/app.config.ts`, `apps/web/src/app/core/services/graphql.service.ts`, `apps/web/src/app/core/services/state.service.ts`
  - **Prerequisites:** Task 3.1
  - **Validation Command:** `npm --prefix apps/web run build`
  - **Git Commit Message:** `feat(web): configure apollo graphql client and reactive signals state service`

- [ ] **Task 3.3: Obsidian Layout Shell, Navbar & System Metrics**
  - **Target Files:** `apps/web/src/app/core/animation/motion.utils.ts`, `apps/web/src/app/components/navbar/navbar.component.ts`, `apps/web/src/app/app.component.ts`
  - **Prerequisites:** Task 3.2
  - **Validation Command:** `npm --prefix apps/web run build`
  - **Git Commit Message:** `feat(web): build obsidian shell layout navbar and live metrics pills`

- [ ] **Task 3.4: Ingest Document Modal & Demo Spec Loader**
  - **Target Files:** `apps/web/src/app/components/ingest-modal/ingest-modal.component.ts`
  - **Prerequisites:** Task 3.3
  - **Validation Command:** `npm --prefix apps/web run build`
  - **Git Commit Message:** `feat(web): implement glassmorphic ingest modal with demo architecture spec`

- [ ] **Task 3.5: Left Rail Document List & Animated Status Badges**
  - **Target Files:** `apps/web/src/app/components/document-list/document-list.component.ts`
  - **Prerequisites:** Task 3.4
  - **Validation Command:** `npm --prefix apps/web run build`
  - **Git Commit Message:** `feat(web): implement document sidebar list with reactive status badges`

- [ ] **Task 3.6: Document Detail Viewer, Entity Inspector & Relationship Graph**
  - **Target Files:** `apps/web/src/app/components/document-viewer/document-viewer.component.ts`, `apps/web/src/app/components/entity-inspector/entity-inspector.component.ts`, `apps/web/src/app/components/relationship-graph/relationship-graph.component.ts`
  - **Prerequisites:** Task 3.5
  - **Validation Command:** `npm --prefix apps/web run build`
  - **Git Commit Message:** `feat(web): implement document viewer entity inspector and relationship graph`

---

## Phase 4: System Integration, E2E Smoke Testing & Verification

- [ ] **Task 4.1: End-to-End Pipeline Verification & Verification Log Finalization**
  - **Target Files:** `.trellis-specs/05_VERIFICATION_LOG.md`, `README.md`
  - **Prerequisites:** Tasks 0.1 through 3.6
  - **Validation Command:** `npm test --if-present`
  - **Git Commit Message:** `chore(docs): finalize verification playbook and architecture documentation`

---

# Section 3: Implementor Handoff Prompts

Use the exact prompts below when instructing the coding agent to implement each discrete task.

---

### Task 0.1 Handoff Prompt
```text
Task ID: Task 0.1
Title: Docker Infrastructure & PostgreSQL Initialization Schema
Spec Reference: .trellis-specs/00_SYSTEM_MANIFEST.md and .trellis-specs/01_DATA_CONTRACTS.md

Instructions:
1. Create `docker/init.sql` implementing the exact PostgreSQL DDL from 01_DATA_CONTRACTS.md:
   - "uuid-ossp" extension.
   - `processing_status` enum: ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED').
   - `entity_category` enum: ('SYSTEM', 'SERVICE', 'DATA_MODEL', 'INFRASTRUCTURE', 'SECURITY_POLICY', 'API_ENDPOINT', 'CONCEPT').
   - Tables: `documents`, `entities`, `entity_relationships` with exact columns, checks, foreign keys (`ON DELETE CASCADE`), and default timestamps.
   - BTree and GIN indexes (`idx_documents_status`, `idx_documents_created_at`, `idx_entities_document_id`, `idx_entities_category`, `idx_entities_metadata_gin`, `idx_relationships_document_id`, `idx_relationships_source`, `idx_relationships_target`).
2. Create `docker-compose.yml` to run PostgreSQL 16 on port 5432 with username `postgres`, password `postgres`, database `trellis`, and mounting `docker/init.sql` to `/docker-entrypoint-initdb.d/init.sql`.

Validation:
Run `docker compose config` to verify YAML syntax.

Git Commit:
git add docker/init.sql docker-compose.yml IMPLEMENTATION_LEDGER.md
git commit -m "chore(infra): add docker compose and postgres initialization schema"
```

---

### Task 0.2 Handoff Prompt
```text
Task ID: Task 0.2
Title: Root Workspace Configuration & Environment Templates
Spec Reference: .trellis-specs/00_SYSTEM_MANIFEST.md

Instructions:
1. Create root `package.json` with monorepo npm scripts:
   - "dev:server": "cd apps/server && cargo run"
   - "dev:worker": "cd apps/worker && npm run dev"
   - "dev:web": "cd apps/web && npm start"
   - "build": "npm run build --workspaces --if-present"
2. Create `.gitignore` ignoring target/, node_modules/, dist/, .env, *.log, .DS_Store.
3. Create `.env.example` documenting root environment variables:
   - DATABASE_URL=postgres://postgres:postgres@localhost:5432/trellis
   - PORT=8080
   - OPENAI_API_KEY=your_key_here

Validation:
Run `node -e "const pkg = require('./package.json'); console.log('Monorepo root:', pkg.name)"`

Git Commit:
git add package.json .gitignore .env.example IMPLEMENTATION_LEDGER.md
git commit -m "chore(root): configure monorepo scripts and environment templates"
```

---

### Task 1.1 Handoff Prompt
```text
Task ID: Task 1.1
Title: Server Cargo Manifest, Dependencies & Config Module
Spec Reference: .trellis-specs/02_STEP_RUST_BACKEND.md

Instructions:
1. Create `apps/server/Cargo.toml` with dependencies:
   - tokio (1.38, features = ["full"])
   - axum (0.7, features = ["macros"])
   - tower-http (0.5, features = ["cors", "trace"])
   - async-graphql (7.0, features = ["chrono", "uuid", "dataloader"])
   - async-graphql-axum (7.0)
   - sqlx (0.7, features = ["runtime-tokio-native-tls", "postgres", "chrono", "uuid", "json"])
   - serde (1.0, features = ["derive"]), serde_json (1.0)
   - uuid (1.8, features = ["v4", "serde"]), chrono (0.4, features = ["serde"])
   - dotenvy (0.15), tracing (0.1), tracing-subscriber (0.3, features = ["env-filter"])
2. Create `apps/server/.env.example` with `DATABASE_URL` and `PORT=8080`.
3. Create `apps/server/src/config.rs` loading `Config` from environment with defaults (`PORT=8080`, `DATABASE_URL`).

Validation:
Run `cargo check --manifest-path apps/server/Cargo.toml`

Git Commit:
git add apps/server/Cargo.toml apps/server/.env.example apps/server/src/config.rs IMPLEMENTATION_LEDGER.md
git commit -m "chore(server): scaffold cargo workspace and dependencies"
```

---

### Task 1.2 Handoff Prompt
```text
Task ID: Task 1.2
Title: SQLx Database Pool & Domain Entity Models
Spec Reference: .trellis-specs/01_DATA_CONTRACTS.md and .trellis-specs/02_STEP_RUST_BACKEND.md

Instructions:
1. Create `apps/server/src/db.rs` with `init_db_pool(database_url: &str) -> Result<sqlx::PgPool, sqlx::Error>` configuring `PgPoolOptions` with `max_connections = 20`.
2. Create domain models matching PostgreSQL schemas:
   - `apps/server/src/models/document.rs`: `ProcessingStatus` enum (`Queued`, `Processing`, `Completed`, `Failed`) with `#[derive(sqlx::Type, async_graphql::Enum, Serialize, Deserialize, Clone, Copy, PartialEq, Eq)]` and `#[sqlx(type_name = "processing_status", rename_all = "SCREAMING_SNAKE_CASE")]`. `Document` struct deriving `sqlx::FromRow, Clone, Serialize, Deserialize`.
   - `apps/server/src/models/entity.rs`: `EntityCategory` enum (`System`, `Service`, `DataModel`, `Infrastructure`, `SecurityPolicy`, `ApiEndpoint`, `Concept`) with `#[derive(sqlx::Type, async_graphql::Enum, ...)]` and `#[sqlx(type_name = "entity_category", rename_all = "SCREAMING_SNAKE_CASE")]`. `Entity` struct deriving `sqlx::FromRow, Clone, Serialize, Deserialize`.
   - `apps/server/src/models/relationship.rs`: `EntityRelationship` struct deriving `sqlx::FromRow, Clone, Serialize, Deserialize`.
   - `apps/server/src/models/mod.rs` re-exporting all models and enums.

Validation:
Run `cargo check --manifest-path apps/server/Cargo.toml`

Git Commit:
git add apps/server/src/db.rs apps/server/src/models/ IMPLEMENTATION_LEDGER.md
git commit -m "feat(server): add sqlx database pool and domain models"
```

---

### Task 1.3 Handoff Prompt
```text
Task ID: Task 1.3
Title: Asynchronous In-Memory / Channel Queue Dispatcher
Spec Reference: .trellis-specs/01_DATA_CONTRACTS.md and .trellis-specs/02_STEP_RUST_BACKEND.md

Instructions:
1. Create `apps/server/src/queue.rs` defining `QueueJob`:
   - `job_id: Uuid`
   - `document_id: Uuid`
   - `title: String`
   - `raw_content: String`
   - `enqueued_at: DateTime<Utc>`
2. Implement `QueueDispatcher` using a `tokio::sync::mpsc::Sender<QueueJob>` (or broadcast channel) with `dispatch_job(&self, job: QueueJob) -> Result<String, String>`.
3. Provide helper `create_queue_dispatcher(buffer: usize) -> (QueueDispatcher, tokio::sync::mpsc::Receiver<QueueJob>)`.

Validation:
Run `cargo check --manifest-path apps/server/Cargo.toml`

Git Commit:
git add apps/server/src/queue.rs IMPLEMENTATION_LEDGER.md
git commit -m "feat(server): implement asynchronous queue dispatcher"
```

---

### Task 1.4 Handoff Prompt
```text
Task ID: Task 1.4
Title: DataLoader Implementation & GraphQL Types
Spec Reference: .trellis-specs/01_DATA_CONTRACTS.md and .trellis-specs/02_STEP_RUST_BACKEND.md

Instructions:
1. Create `apps/server/src/graphql/dataloaders.rs`:
   - `EntityLoader`: Batch loader fetching all entities for a list of document IDs via `SELECT * FROM entities WHERE document_id = ANY($1)`. Returns `HashMap<Uuid, Vec<Entity>>`.
   - `RelationshipLoader`: Batch loader fetching all relationships for a list of document IDs via `SELECT * FROM entity_relationships WHERE document_id = ANY($1)`. Returns `HashMap<Uuid, Vec<EntityRelationship>>`.
   - `SingleEntityLoader`: Batch loader fetching single entities by entity ID via `SELECT * FROM entities WHERE id = ANY($1)`. Returns `HashMap<Uuid, Entity>`.
2. Create `apps/server/src/graphql/types.rs`:
   - `EntityGql`: Wraps `Entity`, exposing GraphQL fields (`id`, `documentId`, `name`, `category`, `confidenceScore`, `metadata`, `createdAt`).
   - `EntityRelationshipGql`: Exposes GraphQL fields (`id`, `documentId`, `sourceEntity`, `targetEntity`, `relationType`, `confidenceScore`, `createdAt`), resolving `sourceEntity` and `targetEntity` via `SingleEntityLoader`.
   - `DocumentGql`: Exposes GraphQL fields (`id`, `title`, `rawContent`, `summary`, `status`, `errorMessage`, `createdAt`, `updatedAt`, `entities`, `relationships`), resolving child entities and relationships via `EntityLoader` and `RelationshipLoader`.
   - `SystemMetricsGql`: `{ totalDocuments: i32, processedCount: i32, queuedCount: i32, failedCount: i32 }`.
   - `IngestPayloadGql`: `{ document: DocumentGql, queueJobId: String }`.
   - `IngestDocumentInput`: `{ title: String, rawContent: String }`.
3. Create `apps/server/src/graphql/mod.rs` declaring schema types and builder aliases.

Validation:
Run `cargo check --manifest-path apps/server/Cargo.toml`

Git Commit:
git add apps/server/src/graphql/ IMPLEMENTATION_LEDGER.md
git commit -m "feat(server): implement dataloaders for entity and relationship batching"
```

---

### Task 1.5 Handoff Prompt
```text
Task ID: Task 1.5
Title: GraphQL Queries, Mutations & Schema Builder
Spec Reference: .trellis-specs/01_DATA_CONTRACTS.md and .trellis-specs/02_STEP_RUST_BACKEND.md

Instructions:
1. Create `apps/server/src/graphql/query.rs` implementing `QueryRoot`:
   - `getDocuments(&self, ctx: &Context<'_>, limit: Option<i32>, offset: Option<i32>) -> Result<Vec<DocumentGql>>`: Queries `documents` ordered by `created_at DESC` with limit/offset defaults (20 / 0).
   - `getDocument(&self, ctx: &Context<'_>, id: ID) -> Result<Option<DocumentGql>>`: Queries single document by ID.
   - `getMetrics(&self, ctx: &Context<'_>) -> Result<SystemMetricsGql>`: Aggregates metrics using SQL `COUNT(*)`, `COUNT(*) FILTER (WHERE status = 'COMPLETED')`, `COUNT(*) FILTER (WHERE status = 'QUEUED')`, `COUNT(*) FILTER (WHERE status = 'FAILED')`.
2. Create `apps/server/src/graphql/mutation.rs` implementing `MutationRoot`:
   - `ingestDocument(&self, ctx: &Context<'_>, input: IngestDocumentInput) -> Result<IngestPayloadGql>`: Inserts document with `QUEUED` status, dispatches job payload to `QueueDispatcher`, and returns `IngestPayloadGql`.
   - `reprocessDocument(&self, ctx: &Context<'_>, id: ID) -> Result<DocumentGql>`: Resets status to `QUEUED`, clears `summary` and `error_message`, and re-dispatches job payload.
   - `deleteDocument(&self, ctx: &Context<'_>, id: ID) -> Result<bool>`: Deletes document by ID (cascades via foreign keys).
3. Wire Query and Mutation roots in `apps/server/src/graphql/mod.rs` with `build_schema`.

Validation:
Run `cargo check --manifest-path apps/server/Cargo.toml`

Git Commit:
git add apps/server/src/graphql/query.rs apps/server/src/graphql/mutation.rs apps/server/src/graphql/mod.rs IMPLEMENTATION_LEDGER.md
git commit -m "feat(server): implement async-graphql schema queries and mutations"
```

---

### Task 1.6 Handoff Prompt
```text
Task ID: Task 1.6
Title: Axum Server Setup, CORS & Embedded GraphiQL Playground
Spec Reference: .trellis-specs/02_STEP_RUST_BACKEND.md

Instructions:
1. Create `apps/server/src/main.rs`:
   - Initialize `dotenvy`, `tracing_subscriber`.
   - Connect PostgreSQL pool with `db::init_db_pool(&config.database_url)`.
   - Instantiate DataLoaders (`EntityLoader`, `RelationshipLoader`, `SingleEntityLoader`) and `QueueDispatcher`.
   - Build `async_graphql::Schema` with DataLoaders and PgPool injected into context data.
   - Configure Axum Router:
     - `GET /graphql` -> `async_graphql::http::GraphiQLSource::build().endpoint("/graphql").finish()`
     - `POST /graphql` -> `GraphQLHandler` executing queries against the schema.
     - `GET /health` -> `axum::Json(serde_json::json!({"status": "healthy", "service": "trellis-backend"}))`
   - Configure Tower `CorsLayer` allowing `http://localhost:4200` with Any methods and Any headers.
   - Bind `tokio::net::TcpListener` to `0.0.0.0:8080` and serve Axum app.

Validation:
Run `cargo check --manifest-path apps/server/Cargo.toml`

Git Commit:
git add apps/server/src/main.rs IMPLEMENTATION_LEDGER.md
git commit -m "feat(server): wire axum router cors and embedded graphiql playground"
```

---

### Task 2.1 Handoff Prompt
```text
Task ID: Task 2.1
Title: Worker Workspace Scaffolding & Dependencies
Spec Reference: .trellis-specs/03_STEP_AI_WORKER.md

Instructions:
1. Create `apps/worker/package.json` with dependencies:
   - `@ai-sdk/openai`: `^0.0.60`
   - `ai`: `^3.4.0`
   - `dotenv`: `^16.4.5`
   - `pg`: `^8.13.0`
   - `zod`: `^3.23.8`
   - Dev: `@types/node` (`^20.14.0`), `@types/pg` (`^8.11.8`), `tsx` (`^4.19.0`), `typescript` (`^5.4.5`)
   - Scripts: "build": "tsc", "start": "node dist/index.js", "dev": "tsx watch src/index.ts"
2. Create `apps/worker/tsconfig.json` with `"target": "ES2022"`, `"module": "NodeNext"`, `"moduleResolution": "NodeNext"`, `"strict": true`, `"outDir": "./dist"`.
3. Create `apps/worker/.env.example` with `DATABASE_URL` and `OPENAI_API_KEY`.
4. Create `apps/worker/src/config.ts` exporting validated runtime configuration.

Validation:
Run `npm --prefix apps/worker run build`

Git Commit:
git add apps/worker/package.json apps/worker/tsconfig.json apps/worker/.env.example apps/worker/src/config.ts IMPLEMENTATION_LEDGER.md
git commit -m "chore(worker): scaffold typescript worker workspace and dependencies"
```

---

### Task 2.2 Handoff Prompt
```text
Task ID: Task 2.2
Title: Database Client & Zod Extraction Contracts
Spec Reference: .trellis-specs/01_DATA_CONTRACTS.md and .trellis-specs/03_STEP_AI_WORKER.md

Instructions:
1. Create `apps/worker/src/db.ts` initializing a pooled `pg.Pool` with connection error handling and query helper.
2. Create `apps/worker/src/contracts/extraction.ts`:
   - `EntityCategoryEnum`: `z.enum(["SYSTEM", "SERVICE", "DATA_MODEL", "INFRASTRUCTURE", "SECURITY_POLICY", "API_ENDPOINT", "CONCEPT"])`
   - `ExtractedEntitySchema`: `name` (string min 1 max 255), `category` (`EntityCategoryEnum`), `confidenceScore` (number 0..1), `metadata` (record(any) default `{}`).
   - `ExtractedRelationshipSchema`: `sourceEntityName` (string), `targetEntityName` (string), `relationType` (string max 100), `confidenceScore` (number 0..1 default 1.0).
   - `DocumentAnalysisOutputSchema`: `summary` (string min 10), `entities` (array min 1), `relationships` (array).
   - Export TypeScript types using `z.infer`.

Validation:
Run `npm --prefix apps/worker run build`

Git Commit:
git add apps/worker/src/db.ts apps/worker/src/contracts/extraction.ts IMPLEMENTATION_LEDGER.md
git commit -m "feat(worker): implement zod extraction schemas and database connection"
```

---

### Task 2.3 Handoff Prompt
```text
Task ID: Task 2.3
Title: AI LLM Structured Output Extraction Service
Spec Reference: .trellis-specs/03_STEP_AI_WORKER.md

Instructions:
1. Create `apps/worker/src/services/llm.service.ts`:
   - Implement `analyzeDocumentContent(rawText: string, title?: string): Promise<DocumentAnalysisOutput>`.
   - Configure OpenAI SDK provider or local fallback mock analyzer for testing without active API keys.
   - Design comprehensive system prompt instructing the model to act as an Enterprise Systems & Knowledge Graph Architect.
   - Use `generateObject` from `ai` package enforcing `schema: DocumentAnalysisOutputSchema`.
   - Handle extraction errors and guarantee fallback/mock analysis for demo resilience if API keys are unset.

Validation:
Run `npm --prefix apps/worker run build`

Git Commit:
git add apps/worker/src/services/llm.service.ts IMPLEMENTATION_LEDGER.md
git commit -m "feat(worker): build ai sdk prompt orchestration with zod structured outputs"
```

---

### Task 2.4 Handoff Prompt
```text
Task ID: Task 2.4
Title: Transactional PostgreSQL Knowledge Graph Writer
Spec Reference: .trellis-specs/03_STEP_AI_WORKER.md

Instructions:
1. Create `apps/worker/src/services/storage.service.ts`:
   - Implement `saveAnalysisResults(documentId: string, data: DocumentAnalysisOutput): Promise<void>`.
   - Acquire client from `pg.Pool` and execute `BEGIN`.
   - Update `documents`: `summary = $1, status = 'COMPLETED', updated_at = NOW(), error_message = NULL WHERE id = $2`.
   - Delete any existing entities/relationships for this document to handle re-processing idempotency (`DELETE FROM entities WHERE document_id = $1`).
   - Insert entities in batch, building a `Map<string, string>` mapping `entityName.toLowerCase() -> entityId (UUID)`.
   - Resolve `sourceEntityName` and `targetEntityName` from `data.relationships` to UUIDs. Skip or log unresolvable relations safely.
   - Insert resolved `entity_relationships` in batch with `relation_type` and `confidence_score`.
   - Execute `COMMIT`.
   - In `catch(err)`: Execute `ROLLBACK`, set document status to `'FAILED'` with `error_message = err.message`, and rethrow.
   - Ensure client is released in `finally`.

Validation:
Run `npm --prefix apps/worker run build`

Git Commit:
git add apps/worker/src/services/storage.service.ts IMPLEMENTATION_LEDGER.md
git commit -m "feat(worker): create transactional postgres batch writer with rollback safety"
```

---

### Task 2.5 Handoff Prompt
```text
Task ID: Task 2.5
Title: Resilient Queue Polling Loop & Graceful Lifecycle
Spec Reference: .trellis-specs/03_STEP_AI_WORKER.md

Instructions:
1. Create `apps/worker/src/queue/types.ts` defining queue interfaces and message payloads.
2. Create `apps/worker/src/queue/consumer.ts` implementing a resilient DB polling consumer:
   - Polls `SELECT id, title, raw_content FROM documents WHERE status = 'QUEUED' ORDER BY created_at ASC LIMIT 5 FOR UPDATE SKIP LOCKED`.
   - Updates picked document status to `'PROCESSING'`.
   - Passes document to `llm.service.ts` and saves results via `storage.service.ts`.
3. Create `apps/worker/src/index.ts`:
   - Initializes database connection and begins polling loop.
   - Adds graceful shutdown handlers on `SIGINT` and `SIGTERM` to allow active extraction jobs to drain and close the pool.

Validation:
Run `npm --prefix apps/worker run build`

Git Commit:
git add apps/worker/src/queue/ apps/worker/src/index.ts IMPLEMENTATION_LEDGER.md
git commit -m "feat(worker): wire async polling event loop and graceful shutdown lifecycle"
```

---

### Task 3.1 Handoff Prompt
```text
Task ID: Task 3.1
Title: Angular 18 Standalone Project Scaffolding & Theme Config
Spec Reference: .trellis-specs/00_SYSTEM_MANIFEST.md and .trellis-specs/04_STEP_ANGULAR_UI.md

Instructions:
1. Create `apps/web/package.json` with Angular 18, Apollo Angular, Tailwind CSS, Lucide Angular, and `@motionone/dom`.
2. Create `apps/web/angular.json` configuring browser build targets, standalone application assets, and styles.
3. Create `apps/web/tsconfig.json` and `apps/web/tsconfig.app.json` for Angular 18 standalone components.
4. Create `apps/web/tailwind.config.js` configuring DM Sans, JetBrains Mono, and the Trellis obsidian color palette (`trellis-bg: #070A0F`, `trellis-surface: #0D1420`, `trellis-border: #1E293B`, `trellis-accent: #00E599`, `trellis-cyan: #38BDF8`, `trellis-amber: #F59E0B`, `trellis-rose: #F43F5E`).
5. Create `apps/web/src/index.html` loading Google Fonts `DM Sans` and `JetBrains Mono`.
6. Create `apps/web/src/styles.css` with `@tailwind base; @tailwind components; @tailwind utilities;` and obsidian custom dark scrollbars.
7. Create `apps/web/src/main.ts` bootstrapping standalone `AppComponent`.

Validation:
Run `npm --prefix apps/web run build`

Git Commit:
git add apps/web/package.json apps/web/angular.json apps/web/tsconfig.json apps/web/tailwind.config.js apps/web/src/ apps/web/tsconfig.app.json IMPLEMENTATION_LEDGER.md
git commit -m "chore(web): scaffold angular 18 standalone project with tailwind and dm sans"
```

---

### Task 3.2 Handoff Prompt
```text
Task ID: Task 3.2
Title: GraphQL Client & Reactive Signals State Service
Spec Reference: .trellis-specs/01_DATA_CONTRACTS.md and .trellis-specs/04_STEP_ANGULAR_UI.md

Instructions:
1. Create `apps/web/src/app/core/models/document.model.ts` defining:
   - `ProcessingStatus`: `'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED'`
   - `EntityCategory`: `'SYSTEM' | 'SERVICE' | 'DATA_MODEL' | 'INFRASTRUCTURE' | 'SECURITY_POLICY' | 'API_ENDPOINT' | 'CONCEPT'`
   - `Entity`: `{ id: string; documentId: string; name: string; category: EntityCategory; confidenceScore: number; metadata: string; createdAt: string; }`
   - `EntityRelationship`: `{ id: string; documentId: string; sourceEntity: Entity; targetEntity: Entity; relationType: string; confidenceScore: number; createdAt: string; }`
   - `Document`: `{ id: string; title: string; rawContent: string; summary: string | null; status: ProcessingStatus; errorMessage: string | null; createdAt: string; updatedAt: string; entities?: Entity[]; relationships?: EntityRelationship[]; }`
   - `SystemMetrics`: `{ totalDocuments: number; processedCount: number; queuedCount: number; failedCount: number; }`
   - `IngestPayload`, `IngestDocumentInput`.
2. Create `apps/web/src/app/app.config.ts` providing `Apollo` targeting `http://localhost:8080/graphql` with `HttpLink` and `InMemoryCache`.
3. Create `apps/web/src/app/core/services/graphql.service.ts` defining GraphQL queries (`GET_DOCUMENTS`, `GET_DOCUMENT`, `GET_METRICS`) and mutations (`INGEST_DOCUMENT`, `REPROCESS_DOCUMENT`, `DELETE_DOCUMENT`).
4. Create `apps/web/src/app/core/services/state.service.ts` implementing Angular Signals reactive state:
   - `documents = signal<Document[]>([])`
   - `selectedDocumentId = signal<string | null>(null)`
   - `metrics = signal<SystemMetrics>({ totalDocuments: 0, processedCount: 0, queuedCount: 0, failedCount: 0 })`
   - `isLoading = signal<boolean>(false)`
   - `isIngestModalOpen = signal<boolean>(false)`
   - `activeDocument = computed(() => ...)`
   - Actions: `loadDocuments()`, `selectDocument(id)`, `ingestDocument(title, content)`, `reprocessDocument(id)`, `deleteDocument(id)`, `pollMetrics()`.

Validation:
Run `npm --prefix apps/web run build`

Git Commit:
git add apps/web/src/app/core/ apps/web/src/app/app.config.ts IMPLEMENTATION_LEDGER.md
git commit -m "feat(web): configure apollo graphql client and reactive signals state service"
```

---

### Task 3.3 Handoff Prompt
```text
Task ID: Task 3.3
Title: Obsidian Layout Shell, Navbar & System Metrics
Spec Reference: .trellis-specs/00_SYSTEM_MANIFEST.md and .trellis-specs/04_STEP_ANGULAR_UI.md

Instructions:
1. Create `apps/web/src/app/core/animation/motion.utils.ts` wrapping `@motionone/dom` for spring entrance animations.
2. Create `apps/web/src/app/components/navbar/navbar.component.ts` (standalone):
   - Brand logo and typography: **Trellis** with neon emerald dot.
   - Live system metrics pill rendering signals (`totalDocuments`, `processedCount`, `queuedCount`, `failedCount`).
   - Primary action button: `+ Ingest Spec` triggering `stateService.isIngestModalOpen.set(true)`.
3. Create `apps/web/src/app/app.component.ts` with 3-column split view (Document List Sidebar, Document Viewer Center, Knowledge Graph Entity Inspector Right Rail).

Validation:
Run `npm --prefix apps/web run build`

Git Commit:
git add apps/web/src/app/core/animation/motion.utils.ts apps/web/src/app/components/navbar/ apps/web/src/app/app.component.ts IMPLEMENTATION_LEDGER.md
git commit -m "feat(web): build obsidian shell layout navbar and live metrics pills"
```

---

### Task 3.4 Handoff Prompt
```text
Task ID: Task 3.4
Title: Ingest Document Modal & Demo Spec Loader
Spec Reference: .trellis-specs/04_STEP_ANGULAR_UI.md and .trellis-specs/05_VERIFICATION_LOG.md

Instructions:
1. Create `apps/web/src/app/components/ingest-modal/ingest-modal.component.ts` (standalone):
   - Glassmorphic modal backdrop and panel.
   - Form inputs for `title` and `rawContent` with validation.
   - "Load Demo RFC 404 Spec" button that auto-populates the demo RFC payload from 05_VERIFICATION_LOG.md.
   - Submits `ingestDocument` mutation, closes modal on success, and auto-selects new document.

Validation:
Run `npm --prefix apps/web run build`

Git Commit:
git add apps/web/src/app/components/ingest-modal/ IMPLEMENTATION_LEDGER.md
git commit -m "feat(web): implement glassmorphic ingest modal with demo architecture spec"
```

---

### Task 3.5 Handoff Prompt
```text
Task ID: Task 3.5
Title: Left Rail Document List & Animated Status Badges
Spec Reference: .trellis-specs/04_STEP_ANGULAR_UI.md

Instructions:
1. Create `apps/web/src/app/components/document-list/document-list.component.ts` (standalone):
   - Renders scrollable document items with title and relative timestamp.
   - Reactive status badge:
     - `QUEUED`: Amber pulsing badge.
     - `PROCESSING`: Cyan animated spinning indicator.
     - `COMPLETED`: Emerald green solid badge with entity count tag.
     - `FAILED`: Rose red badge with retry trigger.
   - Selection highlighting with border-active state.
   - Quick action: Delete document with optimistic UI removal.

Validation:
Run `npm --prefix apps/web run build`

Git Commit:
git add apps/web/src/app/components/document-list/ IMPLEMENTATION_LEDGER.md
git commit -m "feat(web): implement document sidebar list with reactive status badges"
```

---

### Task 3.6 Handoff Prompt
```text
Task ID: Task 3.6
Title: Document Detail Viewer, Entity Inspector & Relationship Graph
Spec Reference: .trellis-specs/04_STEP_ANGULAR_UI.md

Instructions:
1. Create `apps/web/src/app/components/document-viewer/document-viewer.component.ts` (standalone):
   - Displays active document header, status, timestamps, and reprocessing action.
   - Formatted executive summary card with high-contrast markdown-style typography.
   - Collapsible raw content viewer drawer in JetBrains Mono.
2. Create `apps/web/src/app/components/entity-inspector/entity-inspector.component.ts` (standalone):
   - Filterable entity chips with category-specific colors (`SERVICE` cyan, `SYSTEM` emerald, `DATA_MODEL` purple, `INFRASTRUCTURE` amber, etc.).
   - Confidence score indicators (`98%`, etc.).
   - Metadata key-value expandable inspector.
3. Create `apps/web/src/app/components/relationship-graph/relationship-graph.component.ts` (standalone):
   - Interactive directional connection cards: `[Source Entity] --[ RELATION_TYPE ]--> [Target Entity]`.
   - Motion spring animations on selection changes.

Validation:
Run `npm --prefix apps/web run build`

Git Commit:
git add apps/web/src/app/components/document-viewer/ apps/web/src/app/components/entity-inspector/ apps/web/src/app/components/relationship-graph/ IMPLEMENTATION_LEDGER.md
git commit -m "feat(web): implement document viewer entity inspector and relationship graph"
```

---

### Task 4.1 Handoff Prompt
```text
Task ID: Task 4.1
Title: End-to-End Pipeline Verification & Verification Log Finalization
Spec Reference: .trellis-specs/05_VERIFICATION_LOG.md

Instructions:
1. Review all steps in `.trellis-specs/05_VERIFICATION_LOG.md`.
2. Update `README.md` with complete architectural diagram, quick-start guide (`docker compose up -d`, `cargo run`, `npm run dev`, `npm start`), and demonstration flow.
3. Verify that all checkboxes in `IMPLEMENTATION_LEDGER.md` have been updated and that the repository cleanly builds and verifies end-to-end.

Validation:
Verify full repository status and documentation completeness.

Git Commit:
git add .trellis-specs/05_VERIFICATION_LOG.md README.md IMPLEMENTATION_LEDGER.md
git commit -m "chore(docs): finalize verification playbook and architecture documentation"
```
