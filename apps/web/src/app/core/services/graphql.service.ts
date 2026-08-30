import { Injectable, inject } from "@angular/core";
import { Apollo, gql } from "apollo-angular";
import { Observable, map } from "rxjs";
import {
  Document,
  IngestDocumentInput,
  IngestPayload,
  SystemMetrics,
} from "../models/document.model";

export const GET_DOCUMENTS = gql`
  query GetDocuments($status: ProcessingStatus, $limit: Int, $offset: Int) {
    getDocuments(status: $status, limit: $limit, offset: $offset) {
      id
      title
      rawContent
      summary
      status
      errorMessage
      createdAt
      updatedAt
      entities {
        id
        documentId
        name
        category
        confidenceScore
        metadata
        createdAt
      }
      relationships {
        id
        documentId
        sourceEntityId
        targetEntityId
        relationType
        confidenceScore
        createdAt
        sourceEntity {
          id
          name
          category
        }
        targetEntity {
          id
          name
          category
        }
      }
    }
  }
`;

export const GET_DOCUMENT = gql`
  query GetDocument($id: String!) {
    getDocument(id: $id) {
      id
      title
      rawContent
      summary
      status
      errorMessage
      createdAt
      updatedAt
      entities {
        id
        documentId
        name
        category
        confidenceScore
        metadata
        createdAt
      }
      relationships {
        id
        documentId
        sourceEntityId
        targetEntityId
        relationType
        confidenceScore
        createdAt
        sourceEntity {
          id
          name
          category
        }
        targetEntity {
          id
          name
          category
        }
      }
    }
  }
`;

export const GET_METRICS = gql`
  query GetMetrics {
    getMetrics {
      totalDocuments
      processedCount
      queuedCount
      failedCount
    }
  }
`;

export const INGEST_DOCUMENT = gql`
  mutation IngestDocument($input: IngestDocumentInput!) {
    ingestDocument(input: $input) {
      documentId
      jobId
      status
    }
  }
`;

export const REPROCESS_DOCUMENT = gql`
  mutation ReprocessDocument($id: String!) {
    reprocessDocument(id: $id) {
      documentId
      jobId
      status
    }
  }
`;

export const DELETE_DOCUMENT = gql`
  mutation DeleteDocument($id: String!) {
    deleteDocument(id: $id)
  }
`;

@Injectable({
  providedIn: "root",
})
export class GraphQLService {
  private apollo = inject(Apollo);

  getDocuments(limit = 100, offset = 0): Observable<Document[]> {
    return this.apollo
      .watchQuery<{ getDocuments: Document[] }>({
        query: GET_DOCUMENTS,
        variables: { limit, offset },
        fetchPolicy: "network-only",
      })
      .valueChanges.pipe(map((res) => res.data.getDocuments));
  }

  getDocument(id: string): Observable<Document | null> {
    return this.apollo
      .query<{ getDocument: Document | null }>({
        query: GET_DOCUMENT,
        variables: { id },
        fetchPolicy: "network-only",
      })
      .pipe(map((res) => res.data.getDocument));
  }

  getMetrics(): Observable<SystemMetrics> {
    return this.apollo
      .query<{ getMetrics: SystemMetrics }>({
        query: GET_METRICS,
        fetchPolicy: "network-only",
      })
      .pipe(map((res) => res.data.getMetrics));
  }

  ingestDocument(input: IngestDocumentInput): Observable<IngestPayload> {
    return this.apollo
      .mutate<{ ingestDocument: IngestPayload }>({
        mutation: INGEST_DOCUMENT,
        variables: { input },
      })
      .pipe(map((res) => res.data!.ingestDocument));
  }

  reprocessDocument(id: string): Observable<IngestPayload> {
    return this.apollo
      .mutate<{ reprocessDocument: IngestPayload }>({
        mutation: REPROCESS_DOCUMENT,
        variables: { id },
      })
      .pipe(map((res) => res.data!.reprocessDocument));
  }

  deleteDocument(id: string): Observable<boolean> {
    return this.apollo
      .mutate<{ deleteDocument: boolean }>({
        mutation: DELETE_DOCUMENT,
        variables: { id },
      })
      .pipe(map((res) => res.data!.deleteDocument));
  }
}
