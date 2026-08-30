# 01_DATA_CONTRACTS.md — Trellis Type Schemas & Data Contracts

## 1. Relational Database Contract (PostgreSQL DDL)

Save this schema into `docker/init.sql` for container initialization:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Status enum for document pipeline state tracking
CREATE TYPE processing_status AS ENUM ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED');

-- Entity categorization enum
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

-- Extracted named entities
CREATE TABLE entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category entity_category NOT NULL,
    confidence_score REAL NOT NULL CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Directional knowledge graph relationships between entities
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
  metadata: String! # JSON-encoded string
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

type Query {
  getDocuments(limit: Int = 20, offset: Int = 0): [Document!]!
  getDocument(id: ID!): Document
  getMetrics: SystemMetrics!
}

type SystemMetrics {
  totalDocuments: Int!
  processedCount: Int!
  queuedCount: Int!
  failedCount: Int!
}

type Mutation {
  ingestDocument(input: IngestDocumentInput!): IngestPayload!
  reprocessDocument(id: ID!): Document!
  deleteDocument(id: ID!): Boolean!
}

```

---

## 3. Asynchronous Queue Message Contract

Payload passed from Rust Gateway to AWS SQS / Worker queue:

```json
{
  "jobId": "uuid-v4",
  "documentId": "uuid-v4",
  "title": "RFC-780: Distributed Telemetry Protocol",
  "rawContent": "Raw technical markdown or spec document content...",
  "enqueuedAt": "2026-08-31T04:45:00.000Z"
}

```

---

## 4. TypeScript AI Output Schema (Zod)

Implemented in `apps/worker/src/contracts/extraction.ts` to strictly validate LLM outputs before PostgreSQL insertion:

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
  name: z.string().min(1).max(255).describe("Concise name of the entity"),
  category: EntityCategoryEnum.describe("Architectural or technical category"),
  confidenceScore: z.number().min(0).max(1).describe("Confidence score between 0.0 and 1.0"),
  metadata: z.record(z.any()).default({}).describe("Key-value attributes or properties"),
});

export const ExtractedRelationshipSchema = z.object({
  sourceEntityName: z.string().describe("Exact matching name of the source entity"),
  targetEntityName: z.string().describe("Exact matching name of the target entity"),
  relationType: z.string().max(100).describe("Active verb relationship e.g., 'STORES_IN', 'CALLS', 'AUTHENTICATES'"),
  confidenceScore: z.number().min(0).max(1).default(1.0),
});

export const DocumentAnalysisOutputSchema = z.object({
  summary: z.string().min(10).describe("Concise executive summary covering key architecture points and trade-offs"),
  entities: z.array(ExtractedEntitySchema).min(1).describe("List of extracted named entities"),
  relationships: z.array(ExtractedRelationshipSchema).describe("Directional relationships mapping the knowledge graph"),
});

export type ExtractedEntity = z.infer<typeof ExtractedEntitySchema>;
export type ExtractedRelationship = z.infer<typeof ExtractedRelationshipSchema>;
export type DocumentAnalysisOutput = z.infer<typeof DocumentAnalysisOutputSchema>;