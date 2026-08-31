```markdown
# 01_DATA_CONTRACTS.md — Trellis Type Schemas & Data Contracts

## 1. Relational Database Contract (PostgreSQL DDL)

Save this schema into `docker/init.sql` for automated container initialization:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Processing pipeline state tracking
CREATE TYPE processing_status AS ENUM ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED');

-- Concept & entity categorization enum (supports general ideas, study topics, & systems)
CREATE TYPE entity_category AS ENUM (
    'SYSTEM',
    'SERVICE',
    'DATA_MODEL',
    'INFRASTRUCTURE',
    'SECURITY_POLICY',
    'API_ENDPOINT',
    'CONCEPT'
);

-- Core document storage
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    raw_content TEXT NOT NULL,
    summary TEXT,
    status processing_status NOT NULL DEFAULT 'QUEUED',
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Extracted concepts, entities, and topics
CREATE TABLE entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category entity_category NOT NULL DEFAULT 'CONCEPT',
    confidence_score REAL NOT NULL CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Directional concept connections (e.g., "A causes B", "X powers Y", "Service calls API")
CREATE TABLE entity_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    source_entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    target_entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    relation_type VARCHAR(100) NOT NULL,
    confidence_score REAL NOT NULL DEFAULT 1.0 CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance & Lookup Indexes
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX idx_entities_document_id ON entities(document_id);
CREATE INDEX idx_entities_category ON entities(category);
CREATE INDEX idx_entities_metadata_gin ON entities USING gin(metadata);
CREATE INDEX idx_relationships_document_id ON entity_relationships(document_id);
CREATE INDEX idx_relationships_source ON entity_relationships(source_entity_id);
CREATE INDEX idx_relationships_target ON entity_relationships(target_entity_id);

```

---

## 2. GraphQL Schema Definition Language (SDL)

Implemented via `async-graphql` in `apps/server`:

```graphql
enum ProcessingStatus {
  QUEUED
  PROCESSING
  COMPLETED
  FAILED
}

enum EntityCategory {
  SYSTEM
  SERVICE
  DATA_MODEL
  INFRASTRUCTURE
  SECURITY_POLICY
  API_ENDPOINT
  CONCEPT
}

type Entity {
  id: ID!
  documentId: ID!
  name: String!
  category: EntityCategory!
  confidenceScore: Float!
  metadata: String! # Serialized JSON string
  createdAt: String!
}

type EntityRelationship {
  id: ID!
  documentId: ID!
  sourceEntity: Entity!
  targetEntity: Entity!
  relationType: String!
  confidenceScore: Float!
  createdAt: String!
}

type Document {
  id: ID!
  title: String!
  rawContent: String!
  summary: String
  status: ProcessingStatus!
  errorMessage: String
  createdAt: String!
  updatedAt: String!
  entities: [Entity!]!
  relationships: [EntityRelationship!]!
}

input IngestDocumentInput {
  title: String!
  rawContent: String!
}

type IngestPayload {
  document: Document!
  queueJobId: String!
}

type SystemMetrics {
  totalDocuments: Int!
  processedCount: Int!
  queuedCount: Int!
  failedCount: Int!
}

type Query {
  getDocuments(limit: Int = 20, offset: Int = 0): [Document!]!
  getDocument(id: ID!): Document
  getMetrics: SystemMetrics!
}

type Mutation {
  ingestDocument(input: IngestDocumentInput!): IngestPayload!
  reprocessDocument(id: ID!): Document!
  deleteDocument(id: ID!): Boolean!
}

```

---

## 3. Asynchronous Queue Message Contract

Payload transferred between Rust Ingestion API $\rightarrow$ Worker Channel / Queue:

```json
{
  "jobId": "c4b8b6a2-9e32-49bb-b1d5-2e633d289012",
  "documentId": "8f31b64e-2895-46d4-8d9e-5e3692a7e781",
  "title": "How Caffeine Affects Sleep Architecture",
  "rawContent": "Caffeine acts as an adenosine receptor antagonist in the brain...",
  "enqueuedAt": "2026-08-31T04:45:00.000Z"
}

```

---

## 4. TypeScript AI Extraction Contract (Zod)

Implemented in `apps/worker/src/contracts/extraction.ts` to strictly validate structured LLM outputs:

```typescript
import { z } from "zod";

export const EntityCategoryEnum = z.enum([
  "SYSTEM",
  "SERVICE",
  "DATA_MODEL",
  "INFRASTRUCTURE",
  "SECURITY_POLICY",
  "API_ENDPOINT",
  "CONCEPT",
]);

export const ExtractedEntitySchema = z.object({
  name: z.string().min(1).max(255).describe("Concise name of the concept, topic, or technical element"),
  category: EntityCategoryEnum.default("CONCEPT").describe("Category: CONCEPT for general ideas/topics, or technical categories like SERVICE/SYSTEM for architecture"),
  confidenceScore: z.number().min(0).max(1).default(0.95).describe("Relevance score between 0.0 and 1.0"),
  metadata: z.record(z.any()).default({}).describe("Key-value attributes or properties"),
});

export const ExtractedRelationshipSchema = z.object({
  sourceEntityName: z.string().describe("Exact name of the source concept or node"),
  targetEntityName: z.string().describe("Exact name of the target concept or node"),
  relationType: z.string().max(100).describe("Clear, active connection label (e.g., 'BLOCKS', 'POWERS', 'TRIGGERS', 'WRITES_TO')"),
  confidenceScore: z.number().min(0).max(1).default(1.0),
});

export const DocumentAnalysisOutputSchema = z.object({
  summary: z.string().min(10).describe("Engaging, easy-to-read summary breaking down key concepts and takeaways in plain language"),
  entities: z.array(ExtractedEntitySchema).min(1).describe("List of extracted core concepts and nodes"),
  relationships: z.array(ExtractedRelationshipSchema).describe("List of connections and dependencies mapping the visual graph"),
});

export type ExtractedEntity = z.infer<typeof ExtractedEntitySchema>;
export type ExtractedRelationship = z.infer<typeof ExtractedRelationshipSchema>;
export type DocumentAnalysisOutput = z.infer<typeof DocumentAnalysisOutputSchema>;

```

```

---

Save this to `.trellis-specs/01_DATA_CONTRACTS.md`. Let me know when you're ready to proceed to **`02_STEP_RUST_BACKEND.md`**.

```