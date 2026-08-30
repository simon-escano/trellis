export interface IngestionJobPayload {
  jobId: string;
  documentId: string;
  title: string;
  rawContent: string;
  enqueuedAt: string;
}

export interface QueuedDocumentRecord {
  id: string;
  title: string;
  raw_content: string;
  status: string;
}
