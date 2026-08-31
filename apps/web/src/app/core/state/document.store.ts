import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Document, Entity, SystemMetrics } from '../models/document.model.js';
import { GraphQLService } from '../services/graphql.service.js';
import { DEMO_PRESETS } from '../data/demo-presets.js';

@Injectable({
  providedIn: 'root',
})
export class DocumentStore {
  private gqlService = inject(GraphQLService);

  // Navigation View State ('home' vs 'canvas')
  readonly currentView = signal<'home' | 'canvas'>('home');

  // State Signals
  readonly documents = signal<Document[]>([]);
  readonly selectedDocumentId = signal<string | null>(null);
  readonly selectedEntity = signal<Entity | null>(null);
  readonly metrics = signal<SystemMetrics | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly isIngesting = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  // Computed Signals
  readonly activeDocument = computed<Document | null>(() => {
    const id = this.selectedDocumentId();
    if (!id) return this.documents()[0] ?? null;
    return this.documents().find((d) => d.id === id) ?? null;
  });

  readonly isPolling = computed<boolean>(() => {
    return this.documents().some(
      (d) => d.status === 'QUEUED' || d.status === 'PROCESSING'
    );
  });

  private pollingTimer: any = null;

  constructor() {
    // Polling effect: poll every 2s when any document is queued or processing
    effect(() => {
      const pollingActive = this.isPolling();
      if (pollingActive && !this.pollingTimer) {
        this.pollingTimer = setInterval(() => {
          this.silentRefresh();
        }, 2000);
      } else if (!pollingActive && this.pollingTimer) {
        clearInterval(this.pollingTimer);
        this.pollingTimer = null;
      }
    });

    // Auto-select first document if none selected
    effect(() => {
      const docs = this.documents();
      const currentId = this.selectedDocumentId();
      if (
        docs.length > 0 &&
        (!currentId || !docs.some((d) => d.id === currentId))
      ) {
        this.selectedDocumentId.set(docs[0].id);
      }
    });
  }

  navigateToHome() {
    this.currentView.set('home');
  }

  navigateToCanvas() {
    this.currentView.set('canvas');
  }

  openDocument(id: string) {
    this.selectedDocumentId.set(id);
    this.selectedEntity.set(null);
    this.currentView.set('canvas');
  }

  async loadInitialData() {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const [docs, metrics] = await Promise.all([
        this.gqlService.getDocuments(50, 0),
        this.gqlService.getMetrics(),
      ]);
      this.documents.set(docs);
      this.metrics.set(metrics);
      if (docs.length > 0 && !this.selectedDocumentId()) {
        this.selectedDocumentId.set(docs[0].id);
      }
    } catch (err: any) {
      console.error('[DocumentStore] Failed to load data:', err);
      this.error.set(err?.message || 'Failed to connect to backend server');
    } finally {
      this.isLoading.set(false);
    }
  }

  async silentRefresh() {
    try {
      const [docs, metrics] = await Promise.all([
        this.gqlService.getDocuments(50, 0),
        this.gqlService.getMetrics(),
      ]);
      this.documents.set(docs);
      this.metrics.set(metrics);
    } catch (err) {
      console.warn('[DocumentStore] Polling refresh error:', err);
    }
  }

  selectDocument(id: string) {
    this.selectedDocumentId.set(id);
    this.selectedEntity.set(null);
  }

  selectEntity(entity: Entity | null) {
    this.selectedEntity.set(entity);
  }

  async exploreTopic(topicPrompt: string): Promise<Document> {
    const trimmed = topicPrompt.trim();
    if (!trimmed) throw new Error('Topic cannot be empty');

    // Check if matching preset exists
    const matchingPreset = DEMO_PRESETS.find(
      (p) =>
        p.title.toLowerCase().includes(trimmed.toLowerCase()) ||
        trimmed.toLowerCase().includes(p.persona.toLowerCase()) ||
        p.description.toLowerCase().includes(trimmed.toLowerCase())
    );

    if (matchingPreset) {
      // Check if already ingested in documents
      const existing = this.documents().find(
        (d) => d.title.toLowerCase() === matchingPreset.title.toLowerCase()
      );
      if (existing) {
        this.openDocument(existing.id);
        return existing;
      }
      const newDoc = await this.ingestDocument(
        matchingPreset.title,
        matchingPreset.rawContent
      );
      this.openDocument(newDoc.id);
      return newDoc;
    }

    // Synthesize structured content for new freeform topic
    const synthesizedContent = `# ${trimmed}
Overview: An exploration of the fundamental concepts, core components, architectural relationships, and operational mechanisms governing ${trimmed}.
Key components include primary driving forces, systemic dependencies, control policies, and feedback interfaces.`;

    const newDoc = await this.ingestDocument(trimmed, synthesizedContent);
    this.openDocument(newDoc.id);
    return newDoc;
  }

  async ingestDocument(title: string, rawContent: string): Promise<Document> {
    this.isIngesting.set(true);
    this.error.set(null);
    try {
      const result = await this.gqlService.ingestDocument(title, rawContent);
      const newDoc = result.document;

      this.documents.update((prev) => [
        newDoc,
        ...prev.filter((d) => d.id !== newDoc.id),
      ]);
      this.selectedDocumentId.set(newDoc.id);
      this.selectedEntity.set(null);

      // Refresh metrics immediately
      this.gqlService.getMetrics().then((m) => this.metrics.set(m));

      return newDoc;
    } catch (err: any) {
      console.error('[DocumentStore] Ingestion failed:', err);
      this.error.set(err?.message || 'Ingestion failed');
      throw err;
    } finally {
      this.isIngesting.set(false);
    }
  }

  async duplicateActiveDocument() {
    const active = this.activeDocument();
    if (!active) return;
    const newTitle = `${active.title} (Copy)`;
    await this.ingestDocument(newTitle, active.rawContent || '');
  }

  async reprocessDocument(id: string) {
    try {
      const updated = await this.gqlService.reprocessDocument(id);
      this.documents.update((prev) =>
        prev.map((d) =>
          d.id === id
            ? {
                ...d,
                status: updated.status,
                summary: null,
                errorMessage: null,
              }
            : d
        )
      );
      this.gqlService.getMetrics().then((m) => this.metrics.set(m));
    } catch (err: any) {
      console.error('[DocumentStore] Reprocessing failed:', err);
      this.error.set(err?.message || 'Reprocessing failed');
    }
  }

  async deleteDocument(id: string) {
    try {
      await this.gqlService.deleteDocument(id);
      this.documents.update((prev) => prev.filter((d) => d.id !== id));
      if (this.selectedDocumentId() === id) {
        const remaining = this.documents();
        this.selectedDocumentId.set(remaining[0]?.id ?? null);
        this.selectedEntity.set(null);
      }
      this.gqlService.getMetrics().then((m) => this.metrics.set(m));
      if (this.documents().length === 0) {
        this.navigateToHome();
      }
    } catch (err: any) {
      console.error('[DocumentStore] Delete failed:', err);
      this.error.set(err?.message || 'Delete failed');
    }
  }
}
