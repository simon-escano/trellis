# 02_STEP_RUST_BACKEND.md — Phase 1: Rust GraphQL Gateway

## 1. Objective & Deliverables
Implement a high-performance, memory-safe backend gateway in `apps/server` using **Axum**, **async-graphql**, and **SQLx**. This gateway handles database migrations, exposes the GraphQL API at `/graphql`, provides an embedded GraphiQL Playground for testing, and enqueues document processing jobs for the AI worker.

---

## 2. Directory Structure (`apps/server`)

```text
apps/server/
├── Cargo.toml
├── .env.example
└── src/
    ├── main.rs              # Server bootstrapper, CORS, Axum routing
    ├── config.rs            # Environment configuration loader
    ├── db.rs                # SQLx PostgreSQL connection pool
    ├── queue.rs             # In-memory channel / SQS mock job dispatcher
    ├── models/
    │   ├── mod.rs
    │   ├── document.rs      # Document & ProcessingStatus struct definitions
    │   ├── entity.rs        # Entity & Category struct definitions
    │   └── relationship.rs  # EntityRelationship struct definitions
    └── graphql/
        ├── mod.rs           # Schema builder type aliases
        ├── query.rs         # Query resolvers (getDocuments, getDocument, getMetrics)
        ├── mutation.rs      # Mutation resolvers (ingestDocument, reprocess, delete)
        ├── types.rs         # GraphQL Object wrappers
        └── dataloaders.rs   # Batch DataLoader to prevent N+1 query bottlenecks

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

### Step 2.1: PostgreSQL Pool & Environment Configuration

1. Initialize `.env` with `DATABASE_URL=postgres://postgres:postgres@localhost:5432/trellis` and `PORT=8080`.
2. In `src/db.rs`, construct `init_db_pool()` using `sqlx::postgres::PgPoolOptions` with `max_connections = 20`.

### Step 2.2: Domain Models & SQL Mapping

1. Implement `Document`, `Entity`, `EntityRelationship`, `ProcessingStatus`, and `EntityCategory` structs deriving `sqlx::FromRow`, `serde::Serialize`, `serde::Deserialize`, and `Clone`.
2. Ensure SQL enum types cleanly map to Rust enums with `#[sqlx(type_name = "processing_status", rename_all = "SCREAMING_SNAKE_CASE")]`.

### Step 2.3: DataLoaders for N+1 Optimization

1. Create `EntityLoader` and `RelationshipLoader` in `src/graphql/dataloaders.rs` using `async_graphql::dataloader::Loader`.
2. Group entity and relationship fetches by `document_id` via a single `SELECT * FROM ... WHERE document_id = ANY($1)` batch query.

### Step 2.4: GraphQL Queries & Mutations

1. **Queries (`src/graphql/query.rs`):**
* `getDocuments(limit: Int, offset: Int)`: Returns paginated documents ordered by `created_at DESC`.
* `getDocument(id: ID)`: Resolves single document with nested entities and relationships via DataLoaders.
* `getMetrics`: Aggregates total, queued, processed, and failed counts using a single optimized SQL query.


2. **Mutations (`src/graphql/mutation.rs`):**
* `ingestDocument(input: IngestDocumentInput)`: Inserts document with `QUEUED` status, dispatches job payload to `queue::dispatch_job()`, and returns `IngestPayload`.
* `reprocessDocument(id: ID)`: Resets status to `QUEUED` and re-dispatches job payload.
* `deleteDocument(id: ID)`: Cascades deletion across entities and relationships.



### Step 2.5: Axum Server & GraphiQL Playground

1. Bind routes in `src/main.rs`:
* `GET /graphql` $\rightarrow$ Serves `async_graphql::http::GraphiQLSource` UI.
* `POST /graphql` $\rightarrow$ Executes `GraphQLHandler` receiving GraphQL queries.
* `GET /health` $\rightarrow$ Returns `{"status": "healthy", "service": "trellis-backend"}`.


2. Configure permissive CORS headers for local Angular client (`http://localhost:4200`).

---

## 5. Verification & Smoke Test Checklist

Execute these terminal commands to verify Phase 1:

```bash
# 1. Verify compilation and strict borrow checking
cargo check

# 2. Run server in development mode
cargo run

# 3. Open browser test
# Navigate to: http://localhost:8080/graphql

```

**Test Ingestion Mutation via GraphiQL Playground:**

```graphql
mutation TestIngest {
  ingestDocument(input: {
    title: "RFC 9110: HTTP Semantics Overview",
    rawContent: "HTTP is a stateless application-level protocol for distributed, collaborative, hypertext information systems."
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

Execute these commits locally in sequence during Phase 1:

1. `chore(server): scaffold cargo workspace and dependencies`
2. `feat(server): add sqlx database pool and domain models`
3. `feat(server): implement async-graphql schema, dataloaders, and resolvers`
4. `feat(server): wire axum router, cors, and embedded graphiql playground`