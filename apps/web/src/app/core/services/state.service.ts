import { Injectable, computed, inject, signal } from "@angular/core";
import { Document, SystemMetrics } from "../models/document.model";
import { GraphQLService } from "./graphql.service";
import { firstValueFrom } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class StateService {
  private gqlService = inject(GraphQLService);

  // Core signals
  public documents = signal<Document[]>([]);
  public selectedDocumentId = signal<string | null>(null);
  public metrics = signal<SystemMetrics>({
    totalDocuments: 0,
    processedCount: 0,
    queuedCount: 0,
    failedCount: 0,
  });
  public isLoading = signal<boolean>(false);
  public isIngesting = signal<boolean>(false);
  public isIngestModalOpen = signal<boolean>(false);
  public searchQuery = signal<string>("");
  public statusFilter = signal<string>("ALL");

  // Computed signals
  public activeDocument = computed(() => {
    const id = this.selectedDocumentId();
    if (!id) return this.filteredDocuments()[0] || null;
    return this.documents().find((d) => d.id === id) || null;
  });

  public filteredDocuments = computed(() => {
    const docs = this.documents();
    const query = this.searchQuery().toLowerCase().trim();
    const status = this.statusFilter();

    return docs.filter((doc) => {
      const matchesQuery =
        !query ||
        doc.title.toLowerCase().includes(query) ||
        (doc.summary && doc.summary.toLowerCase().includes(query));
      const matchesStatus = status === "ALL" || doc.status === status;
      return matchesQuery && matchesStatus;
    });
  });

  constructor() {
    this.refreshAll();
    this.startPolling();
  }

  public async refreshAll(): Promise<void> {
    await Promise.all([this.loadDocuments(), this.loadMetrics()]);
  }

  public async loadDocuments(): Promise<void> {
    try {
      this.isLoading.set(true);
      const docs = await firstValueFrom(this.gqlService.getDocuments());
      this.documents.set(docs);

      // Auto-select first document if nothing is selected
      if (!this.selectedDocumentId() && docs.length > 0) {
        this.selectedDocumentId.set(docs[0].id);
      }
    } catch (err: any) {
      console.error("[STATE] Error loading documents:", err);
    } finally {
      this.isLoading.set(false);
    }
  }

  public async loadMetrics(): Promise<void> {
    try {
      const m = await firstValueFrom(this.gqlService.getMetrics());
      this.metrics.set(m);
    } catch (err: any) {
      console.error("[STATE] Error loading metrics:", err);
    }
  }

  public selectDocument(id: string): void {
    this.selectedDocumentId.set(id);
  }

  public setModalOpen(open: boolean): void {
    this.isIngestModalOpen.set(open);
  }

  public async ingestDocument(
    title: string,
    rawContent: string
  ): Promise<string> {
    this.isIngesting.set(true);
    try {
      const res = await firstValueFrom(
        this.gqlService.ingestDocument({ title, rawContent })
      );
      this.isIngestModalOpen.set(false);
      await this.refreshAll();
      const newId = res.document.id;
      this.selectedDocumentId.set(newId);
      return newId;
    } finally {
      this.isIngesting.set(false);
    }
  }

  public async reprocessDocument(id: string): Promise<void> {
    try {
      await firstValueFrom(this.gqlService.reprocessDocument(id));
      await this.refreshAll();
    } catch (err: any) {
      console.error("[STATE] Error reprocessing document:", err);
    }
  }

  public async deleteDocument(id: string): Promise<void> {
    try {
      await firstValueFrom(this.gqlService.deleteDocument(id));
      const remaining = this.documents().filter((d) => d.id !== id);
      this.documents.set(remaining);
      if (this.selectedDocumentId() === id) {
        this.selectedDocumentId.set(remaining[0]?.id || null);
      }
      await this.loadMetrics();
    } catch (err: any) {
      console.error("[STATE] Error deleting document:", err);
    }
  }

  private startPolling(): void {
    setInterval(async () => {
      const hasPending = this.documents().some(
        (d) => d.status === "QUEUED" || d.status === "PROCESSING"
      );
      if (hasPending || this.documents().length === 0) {
        await this.refreshAll();
      } else {
        await this.loadMetrics();
      }
    }, 3000);
  }
}
