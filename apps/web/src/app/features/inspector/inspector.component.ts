import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentStore } from '../../core/state/document.store.js';
import {
  Entity,
  EntityCategory,
  EntityRelationship,
} from '../../core/models/document.model.js';

@Component({
  selector: 'app-inspector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inspector.component.html',
  styleUrls: ['./inspector.component.css'],
})
export class InspectorComponent {
  readonly store = inject(DocumentStore);

  readonly isCollapsed = signal<boolean>(false);
  readonly activeTab = signal<'summary' | 'concept' | 'raw'>('summary');

  readonly selectedEntity = this.store.selectedEntity;
  readonly activeDocument = this.store.activeDocument;

  // Connected edges for selected concept
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
        return 'bg-trellis-accent/15 text-trellis-accent border-trellis-accent/30';
      case 'SERVICE':
      case 'SYSTEM':
        return 'bg-trellis-cyan/15 text-trellis-cyan border-trellis-cyan/30';
      case 'DATA_MODEL':
        return 'bg-trellis-amber/15 text-trellis-amber border-trellis-amber/30';
      case 'INFRASTRUCTURE':
        return 'bg-trellis-rose/15 text-trellis-rose border-trellis-rose/30';
      case 'SECURITY_POLICY':
      case 'API_ENDPOINT':
      default:
        return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'COMPLETED':
        return 'bg-trellis-accent/10 text-trellis-accent border-trellis-accent/30';
      case 'PROCESSING':
        return 'bg-trellis-cyan/10 text-trellis-cyan border-trellis-cyan/30 animate-pulse';
      case 'QUEUED':
        return 'bg-trellis-amber/10 text-trellis-amber border-trellis-amber/30';
      case 'FAILED':
      default:
        return 'bg-trellis-rose/10 text-trellis-rose border-trellis-rose/30';
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
    if (doc && confirm(`Are you sure you want to delete "${doc.title}"?`)) {
      this.store.deleteDocument(doc.id);
    }
  }
}
