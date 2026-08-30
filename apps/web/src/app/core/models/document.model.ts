export type ProcessingStatus =
  | "QUEUED"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED";

export type EntityCategory =
  | "SYSTEM"
  | "SERVICE"
  | "DATA_MODEL"
  | "INFRASTRUCTURE"
  | "SECURITY_POLICY"
  | "API_ENDPOINT"
  | "CONCEPT";

export interface Entity {
  id: string;
  documentId: string;
  name: string;
  category: EntityCategory;
  confidenceScore: number;
  metadata: string;
  createdAt: string;
}

export interface EntityRelationship {
  id: string;
  documentId: string;
  sourceEntityId: string;
  targetEntityId: string;
  sourceEntity: Entity;
  targetEntity: Entity;
  relationType: string;
  confidenceScore: number;
  createdAt: string;
}

export interface Document {
  id: string;
  title: string;
  rawContent: string;
  summary: string | null;
  status: ProcessingStatus;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  entities: Entity[];
  relationships: EntityRelationship[];
}

export interface SystemMetrics {
  totalDocuments: number;
  processedCount: number;
  queuedCount: number;
  failedCount: number;
}

export interface IngestDocumentInput {
  title: string;
  rawContent: string;
}

export interface IngestPayload {
  document: Document;
  queueJobId: string;
}
