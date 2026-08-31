import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideChevronRight,
  lucideChevronLeft,
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
      lucideChevronRight,
      lucideChevronLeft,
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

  readonly isCollapsed = signal<boolean>(false);
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

  toggleCollapsed() {
    this.isCollapsed.update((v) => !v);
  }

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
        return 'bg-white/10 text-white border-white/20';
      case 'SERVICE':
      case 'SYSTEM':
        return 'bg-slate-500/10 text-slate-300 border-slate-500/25';
      case 'DATA_MODEL':
        return 'bg-slate-400/10 text-slate-200 border-slate-400/25';
      case 'INFRASTRUCTURE':
        return 'bg-slate-500/10 text-slate-400 border-slate-500/25';
      case 'SECURITY_POLICY':
      case 'API_ENDPOINT':
      default:
        return 'bg-slate-300/10 text-slate-300 border-slate-300/25';
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'COMPLETED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25';
      case 'PROCESSING':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/25 animate-pulse';
      case 'QUEUED':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/25';
      case 'FAILED':
      default:
        return 'bg-rose-500/10 text-rose-400 border-rose-500/25';
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
