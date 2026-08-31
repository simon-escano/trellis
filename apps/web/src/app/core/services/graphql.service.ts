import { Injectable } from '@angular/core';
import { ApolloClient, InMemoryCache, HttpLink, gql } from '@apollo/client/core';
import { Document, SystemMetrics } from '../models/document.model';
import { environment } from '../../../environments/environment';

export const GET_DOCUMENTS_QUERY = gql`
  query GetDocuments($limit: Int, $offset: Int) {
    getDocuments(limit: $limit, offset: $offset) {
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
        sourceEntity {
          id
          documentId
          name
          category
          confidenceScore
          metadata
          createdAt
        }
        targetEntity {
          id
          documentId
          name
          category
          confidenceScore
          metadata
          createdAt
        }
        relationType
        confidenceScore
        createdAt
      }
    }
  }
`;

export const GET_DOCUMENT_QUERY = gql`
  query GetDocument($id: ID!) {
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
        sourceEntity {
          id
          documentId
          name
          category
          confidenceScore
          metadata
          createdAt
        }
        targetEntity {
          id
          documentId
          name
          category
          confidenceScore
          metadata
          createdAt
        }
        relationType
        confidenceScore
        createdAt
      }
    }
  }
`;

export const GET_METRICS_QUERY = gql`
  query GetMetrics {
    getMetrics {
      totalDocuments
      processedCount
      queuedCount
      failedCount
    }
  }
`;

export const INGEST_DOCUMENT_MUTATION = gql`
  mutation IngestDocument($input: IngestDocumentInput!) {
    ingestDocument(input: $input) {
      document {
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
          name
          category
          confidenceScore
          metadata
          createdAt
        }
        relationships {
          id
          relationType
          confidenceScore
        }
      }
      queueJobId
    }
  }
`;

export const REPROCESS_DOCUMENT_MUTATION = gql`
  mutation ReprocessDocument($id: ID!) {
    reprocessDocument(id: $id) {
      id
      title
      rawContent
      summary
      status
      errorMessage
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_DOCUMENT_MUTATION = gql`
  mutation DeleteDocument($id: ID!) {
    deleteDocument(id: $id)
  }
`;

function resolveGraphQLUri(): string {
  if (typeof window !== 'undefined') {
    const win = window as any;
    if (win.__TRELLIS_API_URL__) {
      return win.__TRELLIS_API_URL__;
    }
    const stored = localStorage.getItem('TRELLIS_API_URL');
    if (stored) {
      return stored;
    }
  }

  if (environment.apiUrl && environment.apiUrl.trim().length > 0) {
    return environment.apiUrl;
  }

  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:8080/graphql';
  }

  return '/graphql';
}

@Injectable({
  providedIn: 'root',
})
export class GraphQLService {
  private client: ApolloClient<any>;

  constructor() {
    this.client = new ApolloClient({
      link: new HttpLink({
        uri: resolveGraphQLUri(),
      }),
      cache: new InMemoryCache(),
      defaultOptions: {
        watchQuery: { fetchPolicy: 'no-cache' },
        query: { fetchPolicy: 'no-cache' },
      },
    });
  }

  async getDocuments(limit = 20, offset = 0): Promise<Document[]> {
    const res = await this.client.query<{ getDocuments: Document[] }>({
      query: GET_DOCUMENTS_QUERY,
      variables: { limit, offset },
      fetchPolicy: 'network-only',
    });
    return res.data?.getDocuments ?? [];
  }

  async getDocument(id: string): Promise<Document | null> {
    const res = await this.client.query<{ getDocument: Document | null }>({
      query: GET_DOCUMENT_QUERY,
      variables: { id },
      fetchPolicy: 'network-only',
    });
    return res.data?.getDocument ?? null;
  }

  async getMetrics(): Promise<SystemMetrics> {
    const res = await this.client.query<{ getMetrics: SystemMetrics }>({
      query: GET_METRICS_QUERY,
      fetchPolicy: 'network-only',
    });
    return (
      res.data?.getMetrics ?? {
        totalDocuments: 0,
        processedCount: 0,
        queuedCount: 0,
        failedCount: 0,
      }
    );
  }

  async ingestDocument(
    title: string,
    rawContent: string
  ): Promise<{ document: Document; queueJobId: string }> {
    const res = await this.client.mutate<{
      ingestDocument: { document: Document; queueJobId: string };
    }>({
      mutation: INGEST_DOCUMENT_MUTATION,
      variables: { input: { title, rawContent } },
    });
    return res.data!.ingestDocument;
  }

  async reprocessDocument(id: string): Promise<Document> {
    const res = await this.client.mutate<{ reprocessDocument: Document }>({
      mutation: REPROCESS_DOCUMENT_MUTATION,
      variables: { id },
    });
    return res.data!.reprocessDocument;
  }

  async deleteDocument(id: string): Promise<boolean> {
    const res = await this.client.mutate<{ deleteDocument: boolean }>({
      mutation: DELETE_DOCUMENT_MUTATION,
      variables: { id },
    });
    return res.data?.deleteDocument ?? false;
  }
}
