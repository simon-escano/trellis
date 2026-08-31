import { Injectable } from '@angular/core';
import { ApolloClient, InMemoryCache, HttpLink, gql } from '@apollo/client/core';
import { setContext } from '@apollo/client/link/context';
import { Document, SystemMetrics } from '../models/document.model';
import { User, AuthPayload } from '../models/user.model';
import { environment } from '../../../environments/environment';

export const ME_QUERY = gql`
  query Me {
    me {
      id
      email
      createdAt
      isGuest
    }
  }
`;

export const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      token
      user {
        id
        email
        createdAt
        isGuest
      }
    }
  }
`;

export const LOGIN_MUTATION = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      user {
        id
        email
        createdAt
        isGuest
      }
    }
  }
`;

export const GUEST_SESSION_MUTATION = gql`
  mutation GuestSession {
    guestSession {
      token
      user {
        id
        email
        createdAt
        isGuest
      }
    }
  }
`;

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
    const httpLink = new HttpLink({
      uri: resolveGraphQLUri(),
    });

    const authLink = setContext((_, { headers }) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('trellis_token') : null;
      return {
        headers: {
          ...headers,
          authorization: token ? `Bearer ${token}` : '',
        },
      };
    });

    this.client = new ApolloClient({
      link: authLink.concat(httpLink),
      cache: new InMemoryCache(),
      defaultOptions: {
        watchQuery: { fetchPolicy: 'no-cache' },
        query: { fetchPolicy: 'no-cache' },
      },
    });
  }

  async getMe(): Promise<User | null> {
    try {
      const res = await this.client.query<{ me: User | null }>({
        query: ME_QUERY,
        fetchPolicy: 'network-only',
      });
      return res.data?.me ?? null;
    } catch {
      return null;
    }
  }

  async register(input: { email: string; password: string }): Promise<AuthPayload> {
    const res = await this.client.mutate<{ register: AuthPayload }>({
      mutation: REGISTER_MUTATION,
      variables: { input },
    });
    if (!res.data?.register) {
      throw new Error('Registration failed');
    }
    return res.data.register;
  }

  async login(input: { email: string; password: string }): Promise<AuthPayload> {
    const res = await this.client.mutate<{ login: AuthPayload }>({
      mutation: LOGIN_MUTATION,
      variables: { input },
    });
    if (!res.data?.login) {
      throw new Error('Login failed');
    }
    return res.data.login;
  }

  async createGuestSession(): Promise<AuthPayload> {
    const res = await this.client.mutate<{ guestSession: AuthPayload }>({
      mutation: GUEST_SESSION_MUTATION,
    });
    if (!res.data?.guestSession) {
      throw new Error('Guest session creation failed');
    }
    return res.data.guestSession;
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
