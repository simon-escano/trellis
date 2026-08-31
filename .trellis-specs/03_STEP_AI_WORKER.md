```markdown
# 02_STEP_RUST_BACKEND.md — Phase 1: Rust GraphQL Gateway

## 1. Objective & Deliverables
Implement a high-performance, memory-safe backend gateway in `apps/server` using **Axum 0.7**, **async-graphql 7.0**, and **SQLx 0.7**. 

The gateway:
1. Connects to PostgreSQL with connection pooling.
2. Serves a GraphQL API at `/graphql` and an interactive GraphiQL playground in the browser.
3. Optimizes nested relational queries using the **DataLoader pattern** to prevent N+1 database roundtrips.
4. Accepts document ingestion mutations and dispatches processing jobs asynchronously to the worker pipeline.

---

## 2. Directory Structure (`apps/server`)

```text
apps/server/
├── Cargo.toml
├── .env.example
└── src/
    ├── main.rs              # Server bootstrap, CORS configuration, Axum routing
    ├── config.rs            # Environment configuration loader
    ├── db.rs                # SQLx PostgreSQL connection pool
    ├── queue.rs             # Asynchronous in-memory channel dispatcher
    ├── models/
    │   ├── mod.rs           # Re-exports domain models & enums
    │   ├── document.rs      # Document struct & ProcessingStatus enum
    │   ├── entity.rs        # Entity struct & EntityCategory enum
    │   └── relationship.rs  # EntityRelationship struct
    └── graphql/
        ├── mod.rs           # Schema builder & type aliases
        ├── query.rs         # Query resolvers (getDocuments, getDocument, getMetrics)
        ├── mutation.rs      # Mutation resolvers (ingestDocument, reprocess, delete)
        ├── types.rs         # GraphQL Object types & input definitions
        └── dataloaders.rs   # Batch DataLoaders for entity & relationship resolution

```

---

## 3. Dependency Manifest (`Cargo.toml`)

```toml
[package]
name = "trellis-server"
version = "0.1.0"
edition = "2021"

[dependencies]
# Async Runtime & Web Framework
tokio = { version = "1.38", features = ["full"] }
axum = { version = "0.7", features = ["macros"] }
tower-http = { version = "0.5", features = ["cors", "trace"] }

# GraphQL
async-graphql = { version = "7.0", features = ["chrono", "uuid", "dataloader"] }
async-graphql-axum = "7.0"

# Database & Serialization
sqlx = { version = "0.7", features = ["runtime-tokio-native-tls", "postgres", "chrono", "uuid", "json"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
uuid = { version = "1.8", features = ["v4", "serde"] }
chrono = { version = "0.4", features = ["serde"] }

# Telemetry & Config
dotenvy = "0.15"
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter"] }

```

---

## 4. Implementation Steps

### Step 2.1: Configuration & Environment (`src/config.rs`)

* Create `apps/server/.env.example` defining `DATABASE_URL=postgres://postgres:postgres@localhost:5432/trellis` and `PORT=8080`.
* Implement `Config::from_env()` in `src/config.rs` using `dotenvy` with sensible local defaults.

### Step 2.2: Database Pool & Domain Models (`src/db.rs`, `src/models/`)

* In `src/db.rs`, implement `init_db_pool(database_url: &str) -> Result<sqlx::PgPool, sqlx::Error>` configuring `PgPoolOptions` with `max_connections = 20`.
* In `src/models/document.rs`:
* Implement `ProcessingStatus` enum (`Queued`, `Processing`, `Completed`, `Failed`) with `#[derive(sqlx::Type, async_graphql::Enum, Serialize, Deserialize, Clone, Copy, PartialEq, Eq)]` and `#[sqlx(type_name = "processing_status", rename_all = "SCREAMING_SNAKE_CASE")]`.
* Implement `Document` struct deriving `sqlx::FromRow, Clone, Serialize, Deserialize`.


* In `src/models/entity.rs`:
* Implement `EntityCategory` enum (`System`, `Service`, `DataModel`, `Infrastructure`, `SecurityPolicy`, `ApiEndpoint`, `Concept`) with `#[sqlx(type_name = "entity_category", rename_all = "SCREAMING_SNAKE_CASE")]`.
* Implement `Entity` struct deriving `sqlx::FromRow, Clone, Serialize, Deserialize`.


* In `src/models/relationship.rs`:
* Implement `EntityRelationship` struct deriving `sqlx::FromRow, Clone, Serialize, Deserialize`.



### Step 2.3: Asynchronous Queue Dispatcher (`src/queue.rs`)

* Define `QueueJob` struct (`job_id`, `document_id`, `title`, `raw_content`, `enqueued_at`).
* Implement `QueueDispatcher` using a `tokio::sync::mpsc::Sender<QueueJob>` channel to buffer jobs in-memory without blocking incoming GraphQL mutation requests.

### Step 2.4: Batch DataLoaders & GraphQL Object Types (`src/graphql/`)

* In `src/graphql/dataloaders.rs`:
* Implement `EntityLoader` implementing `async_graphql::dataloader::Loader<Uuid>`: fetches entities in batch via `SELECT * FROM entities WHERE document_id = ANY($1)`.
* Implement `RelationshipLoader` implementing `async_graphql::dataloader::Loader<Uuid>`: fetches relationships in batch via `SELECT * FROM entity_relationships WHERE document_id = ANY($1)`.
* Implement `SingleEntityLoader` implementing `async_graphql::dataloader::Loader<Uuid>`: fetches entities by primary ID via `SELECT * FROM entities WHERE id = ANY($1)` to resolve `sourceEntity` and `targetEntity` cleanly.


* In `src/graphql/types.rs`:
* Implement `DocumentGql`, `EntityGql`, `EntityRelationshipGql`, `SystemMetricsGql`, `IngestPayloadGql`, and `IngestDocumentInput`.



### Step 2.5: GraphQL Queries & Mutations (`src/graphql/query.rs`, `src/graphql/mutation.rs`)

* **Queries:**
* `getDocuments(limit: Int = 20, offset: Int = 0)`: Resolves paginated documents ordered by `created_at DESC`.
* `getDocument(id: ID!)`: Resolves a single document along with its child entity and relationship graph.
* `getMetrics`: Computes total, processed, queued, and failed counts using SQL aggregation.


* **Mutations:**
* `ingestDocument(input: IngestDocumentInput!)`: Inserts document into PostgreSQL with `QUEUED` status, dispatches job payload, and returns `IngestPayloadGql`.
* `reprocessDocument(id: ID!)`: Resets document status to `QUEUED`, clears summary/errors, and re-dispatches job.
* `deleteDocument(id: ID!)`: Cascades deletion for document, entities, and relationships.



### Step 2.6: Axum Router, CORS & Embedded GraphiQL (`src/main.rs`)

* Instantiate PostgreSQL pool, DataLoaders, and `QueueDispatcher`.
* Build `async_graphql::Schema` with context data injected.
* Bind Axum routes:
* `GET /graphql` $\rightarrow$ Embedded GraphiQL IDE.
* `POST /graphql` $\rightarrow$ `GraphQLHandler` receiving GraphQL queries.
* `GET /health` $\rightarrow$ Returns `{"status": "healthy", "service": "trellis-server"}`.


* Configure Tower `CorsLayer` allowing requests from Angular client (`http://localhost:4200`).

---

## 5. Verification & Smoke Test Checklist

Execute these terminal commands to verify Phase 1:

```bash
# 1. Compile and type-check the Rust workspace
cargo check --manifest-path apps/server/Cargo.toml

# 2. Run the server locally
cargo run --manifest-path apps/server/Cargo.toml
# Verified when terminal outputs: "Server running on http://localhost:8080 (GraphiQL IDE at /graphql)"

# 3. Test GraphiQL Playground at http://localhost:8080/graphql

```

**Test Mutation in GraphiQL:**

```graphql
mutation TestIngest {
  ingestDocument(input: {
    title: "How Sleep Impacts Memory Consolidation",
    rawContent: "During deep slow-wave sleep, the hippocampus replays neural firing patterns to transfer memories to the neocortex for long-term storage."
  }) {
    document {
      id
      title
      status
      createdAt
    }
    queueJobId
  }
}

```

---

## 6. Git Commit Checkpoints

1. `chore(server): scaffold cargo workspace and dependencies`
2. `feat(server): add sqlx database pool and domain models`
3. `feat(server): implement asynchronous queue dispatcher`
4. `feat(server): implement dataloaders for entity and relationship batching`
5. `feat(server): implement async-graphql schema queries and mutations`
6. `feat(server): wire axum router cors and embedded graphiql playground`

```

---

Save this to `.trellis-specs/02_STEP_RUST_BACKEND.md`. Let me know when you're ready to proceed to **`03_STEP_AI_WORKER.md`**.

```