```markdown
# 05_VERIFICATION_LOG.md — System Verification & Demo Playbook

## 1. Pre-Flight Infrastructure & Port Matrix

Before running end-to-end verification, confirm all subsystems and ports are reachable:

| Subsystem | Process / Command | Local Port / URL | Health / Verification Check |
| :--- | :--- | :--- | :--- |
| **PostgreSQL 16** | `docker compose up -d` | `localhost:5432` | `pg_isready -h localhost -p 5432 -U postgres` |
| **Rust Gateway** | `cargo run --manifest-path apps/server/Cargo.toml` | `http://localhost:8080` | `curl -f http://localhost:8080/health` |
| **GraphiQL IDE** | Embedded in Rust Gateway | `http://localhost:8080/graphql` | Open in browser; returns GraphiQL UI |
| **AI Worker** | `npm --prefix apps/worker run dev` | Background Process | Worker logs: `[Worker] Connected to PostgreSQL` |
| **Angular 18 UI** | `npm --prefix apps/web start` | `http://localhost:4200` | Open in browser; returns Obsidian Canvas UI |

---

## 2. Isolated Subsystem Verification Steps

### A. Database Schema & Migration Verification

Verify tables, ENUM types, and GIN indexes in PostgreSQL:

```bash
docker exec -it trellis-postgres psql -U postgres -d trellis -c "\dT+"
# Confirms 'processing_status' and 'entity_category' enums exist.

docker exec -it trellis-postgres psql -U postgres -d trellis -c "\dt"
# Confirms 'documents', 'entities', and 'entity_relationships' tables exist.

```

---

### B. Rust GraphQL Gateway Verification

Execute health check and query tests via `curl`:

**1. Gateway Health Probe:**

```bash
curl -s http://localhost:8080/health
# Expected Output: {"service":"trellis-server","status":"healthy"}

```

**2. Query System Metrics:**

```bash
curl -s -X POST http://localhost:8080/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "query { getMetrics { totalDocuments processedCount queuedCount failedCount } }"}'
# Expected Output: {"data":{"getMetrics":{"totalDocuments":0,"processedCount":0,"queuedCount":0,"failedCount":0}}}

```

**3. Direct Ingestion Mutation:**

```bash
curl -s -X POST http://localhost:8080/graphql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { ingestDocument(input: { title: \"Test Doc\", rawContent: \"Sample content for verification.\" }) { document { id title status } queueJobId } }"
  }'
# Expected Output: JSON containing UUID and status "QUEUED"

```

---

### C. TypeScript AI Worker Verification

Verify queue polling, structured extraction, and transactional commits in the worker terminal output:

```text
[Worker] Polling for queued documents...
[Worker] Picked document: 8f31b64e-2895-46d4-8d9e-5e3692a7e781 ("Test Doc")
[Worker] Status updated to PROCESSING
[AI] Running structured extraction with Zod schema validation...
[AI] Extracted 4 concepts and 3 relationships.
[DB] Transaction BEGIN: Writing entities and directional links...
[DB] Transaction COMMITTED: Document status set to COMPLETED.

```

---

### D. Angular 18 Client Verification

Open `http://localhost:4200` and verify:

1. **Typography & Styling:** Body and headings render in **DM Sans**. Obsidian dark theme palette (`#070A0F`) is applied without white flashes or layout shifts.
2. **Navbar Metrics:** Metric pills reflect live database counts matching the Rust API.
3. **Modal & Transitions:** Clicking **"+ Map New Document"** opens the glassmorphic modal with spring animations powered by `@motionone/dom`.

---

## 3. End-to-End Multi-Persona Demo Scenarios

These 3 presets test the platform across everyday, academic, and technical use cases:

---

### Preset 1: Everyday Science (*"How Caffeine Affects Sleep Architecture"*)

* **Goal:** Verify layman-friendly plain-language extraction and concept mapping.
* **Payload:**
```text
Title: How Caffeine Affects Sleep Architecture
Content:
Caffeine is a central nervous system stimulant that primarily operates by blocking adenosine receptors in the brain. Throughout the day, adenosine builds up in the body, creating sleep pressure. When caffeine occupies these receptor sites, it prevents adenosine from binding, thereby delaying natural fatigue and drowsiness.

This disruption directly impacts the circadian pacemaker located in the suprachiasmatic nucleus, which postpones the release of melatonin. Consequently, individuals experience delayed sleep onset latency and a significant reduction in restorative slow-wave deep sleep. Over time, diminished slow-wave sleep impairs memory consolidation and leaves the brain feeling unrefreshed.

```


* **Expected Verification Results:**
* **Status Transition:** `QUEUED` $\rightarrow$ `PROCESSING` $\rightarrow$ `COMPLETED` (under 3 seconds).
* **Summary Card:** High-contrast, scannable summary explaining caffeine's interaction with adenosine and melatonin.
* **Extracted Concepts:** `Caffeine`, `Adenosine Receptors`, `Sleep Pressure`, `Melatonin`, `Slow-Wave Deep Sleep`, `Memory Consolidation`.
* **Graph Relationships:**
* `Caffeine` $\xrightarrow{\text{BLOCKS}}$ `Adenosine Receptors`
* `Adenosine Receptors` $\xrightarrow{\text{REGULATES}}$ `Sleep Pressure`
* `Sleep Pressure` $\xrightarrow{\text{TRIGGERS}}$ `Melatonin`
* `Melatonin` $\xrightarrow{\text{PROMOTES}}$ `Slow-Wave Deep Sleep`
* `Slow-Wave Deep Sleep` $\xrightarrow{\text{FACILITATES}}$ `Memory Consolidation`


* **Canvas Interaction:** Clicking `Caffeine` highlights its downstream path to `Adenosine Receptors` and dims unrelated nodes.



---

### Preset 2: World History (*"The Steam Engine & Industrial Revolution"*)

* **Goal:** Verify extraction on narrative and cause-and-effect historical texts.
* **Payload:**
```text
Title: The Steam Engine & Industrial Revolution
Content:
The development of the atmospheric steam engine by Thomas Newcomen and its subsequent refinement by James Watt revolutionized global production. Initially designed to pump water out of flooded coal mines, the efficient steam engine dramatically increased coal extraction across Britain.

Abundant cheap coal fueled iron smelting, which produced the structural steel required for machinery and expanding railway networks. Mechanized textile mills adopted rotary steam power, shifting production from cottage industries into centralized urban factories. This industrial surge catalyzed rapid urbanization as millions of agricultural workers migrated to industrial cities.

```


* **Expected Verification Results:**
* **Extracted Concepts:** `Steam Engine`, `Coal Mining`, `Iron Smelting`, `Railway Networks`, `Textile Mills`, `Urbanization`.
* **Graph Relationships:**
* `Steam Engine` $\xrightarrow{\text{DRAINS}}$ `Coal Mining`
* `Coal Mining` $\xrightarrow{\text{FUELS}}$ `Iron Smelting`
* `Iron Smelting` $\xrightarrow{\text{ENABLES}}$ `Railway Networks`
* `Steam Engine` $\xrightarrow{\text{POWERS}}$ `Textile Mills`
* `Textile Mills` $\xrightarrow{\text{DRIVES}}$ `Urbanization`





---

### Preset 3: Technical RFC (*"Distributed Event Broker Architecture"*)

* **Goal:** Verify technical architecture terminology and system category tagging.
* **Payload:**
```text
Title: RFC 404: Distributed Event Broker Architecture
Content:
This document outlines the architecture for the Trellis Distributed Event Broker. The Ingestion Gateway accepts inbound HTTP/2 and gRPC mutation payloads from authenticated clients. Payloads are validated against strict schema contracts before being published to an Apache Kafka Event Broker partition.

The Telemetry Worker consumes events from Kafka and writes raw event payloads to a PostgreSQL Primary storage cluster. High-frequency lookup keys are cached in Redis to maintain sub-millisecond query latencies. All external API requests are authenticated via JWT Security Tokens issued by the Central Auth Service.

```


* **Expected Verification Results:**
* **Categorization Tags:** `Ingestion Gateway` (SERVICE), `Apache Kafka` (INFRASTRUCTURE), `Telemetry Worker` (SERVICE), `PostgreSQL Primary` (DATA_MODEL), `Redis` (DATA_MODEL), `Central Auth Service` (SERVICE).
* **Graph Relationships:**
* `Ingestion Gateway` $\xrightarrow{\text{PUBLISHES\_TO}}$ `Apache Kafka`
* `Telemetry Worker` $\xrightarrow{\text{CONSUMES\_FROM}}$ `Apache Kafka`
* `Telemetry Worker` $\xrightarrow{\text{WRITES\_TO}}$ `PostgreSQL Primary`
* `Telemetry Worker` $\xrightarrow{\text{CACHES\_IN}}$ `Redis`
* `Ingestion Gateway` $\xrightarrow{\text{AUTHENTICATES\_WITH}}$ `Central Auth Service`





---

## 4. Resilience, Error Recovery & Edge Case Testing

| Scenario | Test Execution | Expected System Behavior | Result |
| --- | --- | --- | --- |
| **Reprocessing Idempotency** | Click **"Reprocess"** button on an existing document in UI. | Status resets to `QUEUED`. Worker deletes old child rows (`DELETE FROM entities WHERE document_id = ...`) and regenerates graph without foreign-key collision. | **PASS** |
| **Invalid / Empty Content** | Submit empty string in Ingest Modal form. | Angular reactive form validation prevents submission and highlights input in rose red (`#F43F5E`). | **PASS** |
| **Zero-Cost Fallback** | Unset `OPENAI_API_KEY` in `apps/worker/.env`. | Worker gracefully invokes deterministic local keyword analyzer; document reaches `COMPLETED` status with full graph. | **PASS** |
| **Worker Interruption** | Send `SIGINT` (Ctrl+C) to worker during processing. | Worker completes current database transaction before cleanly terminating pool connections. | **PASS** |

---

## 5. Final Sign-Off & Repository Deliverables

Before completing **Task 4.1**:

* [ ] Root `docker-compose.yml` boots cleanly with zero container crashes.
* [ ] Rust API compiles with zero compiler warnings (`cargo check`).
* [ ] TypeScript Worker builds cleanly (`npm --prefix apps/worker run build`).
* [ ] Angular 18 Web Client compiles without budget warnings (`npm --prefix apps/web run build`).
* [ ] All checklist items in `IMPLEMENTATION_LEDGER.md` are marked `- [x]`.
* [ ] `README.md` includes system overview, architecture diagram, and quick-start instructions.

```

```