# 03_STEP_AI_WORKER.md — Phase 2: TypeScript AI Extraction Worker

## 1. Objective & Deliverables
Implement an asynchronous, resilient background worker in `apps/worker` using **TypeScript**, **Node.js 20+**, **Zod**, and an **LLM SDK** (OpenAI / Cerebras / Groq / Anthropic). The worker polls pending ingestion jobs, chunks and prompts an LLM with strict Zod structured outputs, validates the extracted entity-relationship graph, and transactionally persists the knowledge model into **PostgreSQL**.

---

## 2. Directory Structure (`apps/worker`)

```text
apps/worker/
├── package.json
├── tsconfig.json
├── .env.example
└── src/
    ├── index.ts             # Worker event loop & queue polling lifecycle
    ├── config.ts            # Environment variables & runtime validation
    ├── db.ts                # PostgreSQL connection pool (pg / postgres.js)
    ├── contracts/
    │   └── extraction.ts    # Zod schemas (Entity, Relationship, Analysis)
    ├── services/
    │   ├── llm.service.ts   # Model orchestration, system prompts, structured outputs
    │   └── storage.service.ts # Transactional database batch writer
    └── queue/
        ├── consumer.ts      # Queue listener (SQS / DB Polling fallback)
        └── types.ts         # Ingestion job payload definitions

```

---

## 3. Dependency Manifest (`package.json`)

```json
{
  "name": "trellis-worker",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "tsx watch src/index.ts"
  },
  "dependencies": {
    "@ai-sdk/openai": "^0.0.60",
    "ai": "^3.4.0",
    "dotenv": "^16.4.5",
    "pg": "^8.13.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/node": "^20.14.0",
    "@types/pg": "^8.11.8",
    "tsx": "^4.19.0",
    "typescript": "^5.4.5"
  }
}

```

---

## 4. Implementation Steps

### Step 3.1: Environment & Database Setup

1. Configure `.env` with `DATABASE_URL=postgres://postgres:postgres@localhost:5432/trellis` and `OPENAI_API_KEY` (or `CEREBRAS_API_KEY` / `GROQ_API_KEY`).
2. Implement `src/db.ts` creating a reusable `pg.Pool` with error handlers and connection release safeguards.

### Step 3.2: Zod Schema & System Prompt Design

1. Import `DocumentAnalysisOutputSchema` in `src/contracts/extraction.ts` (matching `01_DATA_CONTRACTS.md`).
2. In `src/services/llm.service.ts`, implement `analyzeDocumentContent(rawText: string)`:
* **System Prompt:** Instruct the model to act as an Enterprise Systems & Knowledge Graph Architect.
* **Extraction Guidelines:** Identify core systems, services, data models, infrastructure nodes, and explicit directional dependencies (`CALLS`, `WRITES_TO`, `SUBSCRIBES_TO`, `AUTHENTICATES`).
* **Output Enforcement:** Use the AI SDK's `generateObject` with `schema: DocumentAnalysisOutputSchema` to guarantee 100% JSON-compliant outputs without runtime parsing errors.



### Step 3.3: Transactional Database Writer

In `src/services/storage.service.ts`, implement `saveAnalysisResults(documentId: string, data: DocumentAnalysisOutput)`:

1. Open a dedicated database client and execute `BEGIN`.
2. Update the parent `documents` table: set `summary = $1`, `status = 'COMPLETED'`, `updated_at = NOW()`.
3. Batch insert `entities` and return the newly generated UUIDs mapped by entity name.
4. Resolve `sourceEntityName` and `targetEntityName` from relationships against the generated UUID map.
5. Batch insert `entity_relationships` with resolved `source_entity_id` and `target_entity_id`.
6. Execute `COMMIT`. In any error scenario, execute `ROLLBACK` and set document status to `'FAILED'` with the caught `error_message`.

### Step 3.4: Queue Polling & Execution Loop

In `src/index.ts`:

1. Build a non-blocking queue consumer polling `documents` where `status = 'QUEUED'` (or polling an AWS SQS queue).
2. Set document status to `'PROCESSING'` immediately to lock the record.
3. Pass content to `llm.service.ts`, write results via `storage.service.ts`, and log structured metrics.
4. Implement graceful shutdown handlers (`SIGTERM`, `SIGINT`) to close database pools cleanly.

---

## 5. Verification & Smoke Test Checklist

Execute these terminal commands to verify Phase 2:

```bash
# 1. Type check and start worker in dev mode
cd apps/worker
npm run dev

# 2. Trigger an ingestion job via the Rust GraphiQL Playground (localhost:8080/graphql):
# mutation {
#   ingestDocument(input: {
#     title: "Trellis Architecture RFC",
#     rawContent: "Trellis utilizes an Axum Rust GraphQL gateway that writes events to SQS. The TypeScript AI Worker consumes SQS and persists entities into PostgreSQL."
#   }) {
#     document { id status }
#   }
# }

# 3. Verify terminal output in worker:
# [WORKER] Received document [uuid] for extraction...
# [WORKER] LLM extraction completed. 3 entities, 2 relationships found.
# [WORKER] Transaction committed. Document status updated to COMPLETED.

```

---

## 6. Git Commit Checkpoints

Execute these commits locally in sequence during Phase 2:

1. `chore(worker): scaffold typescript worker workspace and dependencies`
2. `feat(worker): implement zod extraction schemas and ai sdk prompt orchestration`
3. `feat(worker): create transactional postgres batch writer with rollback safety`
4. `feat(worker): wire async polling event loop and graceful shutdown lifecycle`