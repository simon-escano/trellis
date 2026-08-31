import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideFileText,
  lucideSparkles,
  lucideLayers,
  lucideX,
  lucideRotateCw,
  lucideTrash2,
  lucideActivity,
  lucideZap,
  lucideInfo,
} from '@ng-icons/lucide';
import { DocumentStore } from '../../core/state/document.store.js';
import {
  Entity,
  EntityCategory,
  EntityRelationship,
} from '../../core/models/document.model.js';

@Component({
  selector: 'app-inspector',
  standalone: true,
  imports: [CommonModule, NgIconComponent],
  providers: [
    provideIcons({
      lucideFileText,
      lucideSparkles,
      lucideLayers,
      lucideX,
      lucideRotateCw,
      lucideTrash2,
      lucideActivity,
      lucideZap,
      lucideInfo,
    }),
  ],
  templateUrl: './inspector.component.html',
  styleUrls: ['./inspector.component.css'],
})
export class InspectorComponent {
  readonly store = inject(DocumentStore);

  readonly activeTab = signal<'summary' | 'concept' | 'raw'>('summary');

  readonly selectedEntity = this.store.selectedEntity;
  readonly activeDocument = this.store.activeDocument;

  readonly connectedRelationships = computed<EntityRelationship[]>(() => {
    const entity = this.selectedEntity();
    const doc = this.activeDocument();
    if (!entity || !doc || !doc.relationships) return [];

    return doc.relationships.filter(
      (rel) =>
        (rel.sourceEntity?.id || (rel as any).source_entity_id) === entity.id ||
        (rel.targetEntity?.id || (rel as any).target_entity_id) === entity.id
    );
  });

  setTab(tab: 'summary' | 'concept' | 'raw') {
    this.activeTab.set(tab);
  }

  clearSelectedEntity() {
    this.store.selectEntity(null);
  }

  formatConfidence(score?: number | null): string {
    if (score === null || score === undefined) return '95%';
    return `${Math.round(score * 100)}%`;
  }

  getMetadataEntries(metadata: any): [string, any][] {
    if (!metadata) return [];
    if (typeof metadata === 'object') {
      return Object.entries(metadata);
    }
    if (typeof metadata === 'string') {
      try {
        const parsed = JSON.parse(metadata);
        return Object.entries(parsed);
      } catch {
        return [['detail', metadata]];
      }
    }
    return [];
  }

  formatMetadata(metadata: string | Record<string, any>): Record<string, any> {
    if (typeof metadata === 'string') {
      try {
        return JSON.parse(metadata);
      } catch {
        return { value: metadata };
      }
    }
    return metadata || {};
  }

  getCategoryBadgeClass(category: EntityCategory): string {
    switch (category) {
      case 'CONCEPT':
        return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
      case 'SERVICE':
      case 'SYSTEM':
        return 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30';
      case 'DATA_MODEL':
        return 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30';
      case 'INFRASTRUCTURE':
        return 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30';
      case 'SECURITY_POLICY':
      case 'API_ENDPOINT':
      default:
        return 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30';
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'COMPLETED':
        return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30';
      case 'PROCESSING':
        return 'bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/30 animate-pulse';
      case 'QUEUED':
        return 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30';
      case 'FAILED':
      default:
        return 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30';
    }
  }

  reprocessCurrentDocument() {
    const doc = this.activeDocument();
    if (doc) {
      this.store.reprocessDocument(doc.id);
    }
  }

  deleteCurrentDocument() {
    const doc = this.activeDocument();
    if (doc && confirm(`Delete "${doc.title}"?`)) {
      this.store.deleteDocument(doc.id);
    }
  }
}
