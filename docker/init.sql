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
