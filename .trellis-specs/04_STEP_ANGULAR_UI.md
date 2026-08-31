```markdown
# 03_STEP_AI_WORKER.md — Phase 2: TypeScript AI Extraction Worker

## 1. Objective & Deliverables
Implement an asynchronous, resilient background worker in `apps/worker` using **TypeScript**, **Zod**, and **Vercel AI SDK / OpenAI / Groq SDK**.

The worker:
1. Polls PostgreSQL safely for `QUEUED` documents using `FOR UPDATE SKIP LOCKED`.
2. Transitions document status to `PROCESSING`.
3. Orchestrates structured LLM extraction to generate an engaging summary, identify core topics/entities, and map directional relationship links.
4. Executes atomic, transactional PostgreSQL writes (`BEGIN` / `COMMIT` / `ROLLBACK`) to persist the graph nodes and edges.
5. Handles failures gracefully by recording error traces and updating the document status to `FAILED`.
6. Provides a built-in mock analyzer fallback so the entire pipeline runs at **$0 zero-cost** even without an active AI API key.

---

## 2. Directory Structure (`apps/worker`)

```text
apps/worker/
├── package.json
├── tsconfig.json
├── .env.example
└── src/
    ├── index.ts                     # Lifecycle bootstrap & graceful shutdown listeners
    ├── config.ts                    # Runtime environment validation
    ├── db.ts                        # Pooled PostgreSQL client & query helpers
    ├── contracts/
    │   └── extraction.ts            # Zod extraction schema and TypeScript interfaces
    ├── services/
    │   ├── llm.service.ts           # AI SDK prompt orchestration & structured outputs
    │   └── storage.service.ts       # Transactional graph persistence with rollback
    └── queue/
        ├── types.ts                 # Queue payload definitions
        └── consumer.ts              # Resilient DB polling loop (FOR UPDATE SKIP LOCKED)

```

---

## 3. Dependency Manifest (`package.json`)

```json
{
  "name": "trellis-worker",
  "version": "0.1.0",
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

### Step 3.1: Workspace Scaffolding & Configuration (`src/config.ts`)

* Create `apps/worker/.env.example` defining:
* `DATABASE_URL=postgres://postgres:postgres@localhost:5432/trellis`
* `OPENAI_API_KEY=` (optional if using Groq or local mock analyzer)
* `OPENAI_BASE_URL=` (optional, e.g., `https://api.groq.com/openai/v1`)
* `AI_MODEL=gpt-4o-mini` (or `llama-3.3-70b-versatile`)
* `POLL_INTERVAL_MS=3000`


* Create `src/config.ts` exporting validated runtime environment settings.

### Step 3.2: Database Client & Zod Schemas (`src/db.ts`, `src/contracts/extraction.ts`)

* In `src/db.ts`: Initialize a connection pool with `new pg.Pool({ connectionString: config.databaseUrl })` with error handling on idle clients.
* In `src/contracts/extraction.ts`: Re-export the canonical Zod extraction contracts defined in `01_DATA_CONTRACTS.md`:
* `EntityCategoryEnum`: `['SYSTEM', 'SERVICE', 'DATA_MODEL', 'INFRASTRUCTURE', 'SECURITY_POLICY', 'API_ENDPOINT', 'CONCEPT']`
* `ExtractedEntitySchema`: `name`, `category`, `confidenceScore`, `metadata`.
* `ExtractedRelationshipSchema`: `sourceEntityName`, `targetEntityName`, `relationType`, `confidenceScore`.
* `DocumentAnalysisOutputSchema`: `summary`, `entities`, `relationships`.



### Step 3.3: AI LLM Structured Output Extraction Service (`src/services/llm.service.ts`)

* Implement `analyzeDocumentContent(rawText: string, title?: string): Promise<DocumentAnalysisOutput>`.
* **Zero-Cost Resilience & Mock Fallback:**
* If `OPENAI_API_KEY` is not present, invoke `generateMockAnalysis(rawText, title)` to extract keywords, synthesize summary points, and build graph links deterministically without throwing errors.


* **System Prompt Strategy:**
* Instruct the model to act as a **Master Concept & Systems Knowledge Architect**.
* Mandate clear, layman-accessible summaries with high-impact takeaways.
* Extract 3 to 12 core concepts and 2 to 10 directional relationships.
* Use active relationship verbs (e.g., `TRIGGERS`, `BLOCKS`, `POWERS`, `CONNECTS_TO`, `CALLS`).



### Step 3.4: Transactional PostgreSQL Knowledge Graph Writer (`src/services/storage.service.ts`)

* Implement `saveAnalysisResults(documentId: string, data: DocumentAnalysisOutput): Promise<void>`.
* **Transaction Lifecycle:**
1. Acquire a client from the pool and execute `BEGIN;`.
2. Update `documents`: set `summary = $1`, `status = 'COMPLETED'`, `error_message = NULL`, `updated_at = NOW()`.
3. Delete any stale child entities/relationships for this document to ensure idempotency on reprocessing (`DELETE FROM entities WHERE document_id = $1`).
4. Batch-insert all extracted entities into `entities`, recording a mapping of `entityName.toLowerCase() -> entityId (UUID)`.
5. Resolve `sourceEntityName` and `targetEntityName` from relationships using the ID map. If a target or source entity is unresolvable, log a warning and skip safely.
6. Batch-insert valid relationships into `entity_relationships`.
7. Execute `COMMIT;`.


* **Error Handling:**
* In the `catch` block: Execute `ROLLBACK;`, update `documents` with `status = 'FAILED'` and `error_message = err.message`, then rethrow.
* Always release the client in the `finally` block.



### Step 3.5: Resilient Queue Polling Loop & Graceful Lifecycle (`src/queue/consumer.ts`, `src/index.ts`)

* In `src/queue/consumer.ts`:
* Implement `pollAndProcessJobs()` running on a configurable interval (`POLL_INTERVAL_MS`).
* Query next job safely:
```sql
SELECT id, title, raw_content 
FROM documents 
WHERE status = 'QUEUED' 
ORDER BY created_at ASC 
LIMIT 1 
FOR UPDATE SKIP LOCKED;

```


* Update picked row to `status = 'PROCESSING'`.
* Pass raw text to `analyzeDocumentContent()` and pipe results to `saveAnalysisResults()`.


* In `src/index.ts`:
* Boot the polling consumer.
* Register `process.on('SIGINT')` and `process.on('SIGTERM')` handlers to allow inflight processing jobs to finish before calling `pool.end()`.



---

## 5. Verification & Smoke Test Checklist

Execute these terminal commands to verify Phase 2:

```bash
# 1. Type-check and build TypeScript worker
npm --prefix apps/worker run build

# 2. Run the worker in development watch mode
npm --prefix apps/worker run dev
# Verified when terminal outputs: "[Worker] Connected to PostgreSQL. Polling for queued documents..."

# 3. Trigger Ingestion via GraphiQL (http://localhost:8080/graphql)
# Watch worker logs transition: [Job] Picked doc -> [AI] Analyzed -> [DB] Transaction Committed.

```

---

## 6. Git Commit Checkpoints

1. `chore(worker): scaffold typescript worker workspace and dependencies`
2. `feat(worker): implement zod extraction schemas and database connection`
3. `feat(worker): build ai sdk prompt orchestration with zod structured outputs`
4. `feat(worker): create transactional postgres batch writer with rollback safety`
5. `feat(worker): wire async polling event loop and graceful shutdown lifecycle`

```

---

Save this to `.trellis-specs/03_STEP_AI_WORKER.md`. Let me know when you're ready to proceed to **`04_STEP_ANGULAR_UI.md`**.

```