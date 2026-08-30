# 05_VERIFICATION_LOG.md — Master Verification & Interview Playbook

## 1. Master Build & Run Sequence

To bring the entire Trellis platform online locally in three terminal panes:

### Step 1: Infrastructure & Database
```bash
# Start PostgreSQL 16 container with schema initialization
docker compose up -d

# Verify postgres is accepting connections
docker compose exec postgres pg_isready -U postgres
```

### Step 2: Rust Backend Gateway (`apps/server`)
```bash
cd apps/server
cargo check
cargo run
# Output: Server running on http://localhost:8080 (GraphiQL IDE at /graphql)
```

### Step 3: TypeScript AI Ingestion Worker (`apps/worker`)
```bash
cd apps/worker
npm install
npm run dev
# Output: [WORKER] Connected to PostgreSQL. Polling for queued documents...
```

### Step 4: Angular 18 Web Dashboard (`apps/web`)
```bash
cd apps/web
npm install
npm start
# Output: Angular Live Development Server is listening on localhost:4200
```

---

## 2. End-to-End Verification Checklist

| Milestone | Test Action | Expected Output | Status |
| :--- | :--- | :--- | :---: |
| **1. Database Schema** | Inspect tables via `psql` or DBeaver. | `documents`, `entities`, `entity_relationships` tables exist with GIN & BTree indexes. | [x] |
| **2. Rust GraphQL API** | Query `getDocuments` in GraphiQL (`:8080/graphql`). | Returns empty array `[]` or seed records with HTTP 200. | [x] |
| **3. UI Ingest Trigger** | Open `:4200`, click **+ Ingest Spec**, submit test payload. | Document immediately appears in sidebar with amber `QUEUED` badge. | [x] |
| **4. Worker AI Processing** | Watch `apps/worker` terminal stream logs. | Worker picks up UUID, prompts LLM, validates Zod schema, and commits transaction. | [x] |
| **5. DataLoader Batching** | Inspect Rust backend terminal during document load. | Single `SELECT * ... ANY($1)` query executed instead of N+1 child queries. | [x] |
| **6. Knowledge UI Render** | Select completed document in Angular dashboard. | Summary displays, entity tags render with category colors, connection cards animate in. | [x] |

---

## 3. Demo Architecture Sample (For Live Interview Demos)

Copy and paste this sample payload into the ingestion drawer to show off system capabilities:

```text
Title: RFC 404: Distributed Event Broker Architecture
Content:
The Trellis Event Broker service interfaces directly with the Ingestion Gateway via gRPC and buffers incoming telemetry into an AWS SQS queue. The Telemetry Ingestion Worker consumes messages from SQS, executes payload validation against strict schemas, and writes compressed traces to the PostgreSQL Primary Cluster. To reduce query latency, the Authentication Service caches active JSON Web Tokens within Redis Memory Store, while an AWS S3 Bucket provides durable object storage for raw diagnostic dumps.
```

**Extracted Result Expected in UI:**

* **Entities:** `Trellis Event Broker` (SERVICE), `Ingestion Gateway` (SERVICE), `AWS SQS` (INFRASTRUCTURE), `Telemetry Ingestion Worker` (SERVICE), `PostgreSQL Primary Cluster` (DATA_MODEL), `Authentication Service` (SERVICE), `Redis Memory Store` (DATA_MODEL), `AWS S3 Bucket` (INFRASTRUCTURE).
* **Relationships:**
  * `Trellis Event Broker` $\rightarrow$ `BUFFERS_INTO` $\rightarrow$ `AWS SQS`
  * `Telemetry Ingestion Worker` $\rightarrow$ `CONSUMES_FROM` $\rightarrow$ `AWS SQS`
  * `Telemetry Ingestion Worker` $\rightarrow$ `WRITES_TO` $\rightarrow$ `PostgreSQL Primary Cluster`
  * `Authentication Service` $\rightarrow$ `CACHES_INTO` $\rightarrow$ `Redis Memory Store`

---

## 4. Technical Defense & Interview Talking Points

### A. For Consumer Tech Ltd (Backend, Rust, AI Pipelines, AWS)

* **Why Rust for the GraphQL Gateway?**
> "We selected Rust with `Axum` and `async-graphql` to eliminate runtime garbage collection pauses and enforce type safety at compile time. By utilizing the **DataLoader pattern**, we batch entity and relationship queries into a single parameterized SQL query (`WHERE document_id = ANY($1)`), eliminating the classic GraphQL N+1 database problem."

* **How are AI Ingestion Failures Handled?**
> "The TypeScript worker relies on strict runtime schema validation via **Zod** (`DocumentAnalysisOutputSchema`). If an LLM returns malformed JSON or invalid entity categories, the schema parse fails before touching the database. The worker catches the error, rolls back the PostgreSQL transaction, and updates the document status to `FAILED` with detailed diagnostic traces."

* **How Does this Map to AWS Cloud Infrastructure?**
> "In production, the local polling worker maps directly to an **AWS Lambda** function triggered by an **AWS SQS** queue. File uploads stream to **AWS S3**, which emits an event to SQS. This decouples peak ingestion spikes from database write pressure."

### B. For Novanox (Full-Stack, Angular 18, Reactive Frontend)

* **Why Angular 18 Standalone Components & Signals?**
> "We used Angular 18's standalone component architecture to avoid legacy `NgModule` overhead. For state management, we adopted **Angular Signals** (`signal`, `computed`) to provide fine-grained reactivity. When Apollo fetches updated GraphQL payloads, only the affected components (the entity viewer or badge status) re-render rather than triggering entire sub-tree change detection cycles."

* **Design System & Motion Integration:**
> "The UI utilizes a technical dark obsidian palette with **DM Sans** for readability and **Tailwind CSS** for layout structure. Micro-interactions and card transitions are driven by `@motionone/dom`, applying GPU-accelerated spring physics without the bundle bloat of heavy animation libraries."

---

## 5. Final Code Quality & Safety Sanity Check

* [x] No raw API keys or secrets hardcoded in source files (verified `.env.example` in all subdirectories).
* [x] All database queries parameterized through `sqlx` (Rust) and `pg` (TypeScript) to prevent SQL injection.
* [x] Permissive local CORS limited strictly to `http://localhost:4200`.
* [x] Atomic git commit log maintained across all development phases.