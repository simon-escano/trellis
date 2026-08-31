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

  closeEntitySelection() {
    this.store.selectEntity(null);
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
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25';
      case 'SERVICE':
      case 'SYSTEM':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/25';
      case 'DATA_MODEL':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/25';
      case 'INFRASTRUCTURE':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/25';
      case 'SECURITY_POLICY':
      case 'API_ENDPOINT':
      default:
        return 'bg-purple-500/10 text-purple-400 border-purple-500/25';
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

  reprocessActive() {
    const doc = this.activeDocument();
    if (doc) {
      this.store.reprocessDocument(doc.id);
    }
  }

  deleteActive() {
    const doc = this.activeDocument();
    if (doc && confirm(`Delete "${doc.title}"?`)) {
      this.store.deleteDocument(doc.id);
    }
  }
}
