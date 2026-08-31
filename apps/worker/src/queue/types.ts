export interface QueuedDocumentRow {
  id: string;
  title: string;
  raw_content: string;
}

export interface ProcessingResult {
  documentId: string;
  success: boolean;
  conceptCount: number;
  relationshipCount: number;
  error?: string;
}
