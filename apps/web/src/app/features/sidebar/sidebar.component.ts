import {
  Component,
  EventEmitter,
  Output,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocumentStore } from '../../core/state/document.store.js';
import { Document } from '../../core/models/document.model.js';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent {
  @Output() openIngestModal = new EventEmitter<void>();

  readonly store = inject(DocumentStore);
  readonly searchQuery = signal<string>('');
  readonly isCollapsed = signal<boolean>(false);

  readonly filteredDocuments = computed<Document[]>(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const docs = this.store.documents();
    if (!q) return docs;
    return docs.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        (d.summary && d.summary.toLowerCase().includes(q)) ||
        d.rawContent.toLowerCase().includes(q)
    );
  });

  toggleCollapsed() {
    this.isCollapsed.update((v) => !v);
  }

  selectDoc(id: string) {
    this.store.selectDocument(id);
  }

  onDelete(e: MouseEvent, doc: Document) {
    e.stopPropagation();
    if (confirm(`Delete document "${doc.title}"?`)) {
      this.store.deleteDocument(doc.id);
    }
  }

  onReprocess(e: MouseEvent, doc: Document) {
    e.stopPropagation();
    this.store.reprocessDocument(doc.id);
  }

  getStatusBadge(status: string): {
    label: string;
    class: string;
    dotClass: string;
  } {
    switch (status) {
      case 'COMPLETED':
        return {
          label: 'Ready',
          class: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
          dotClass: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]',
        };
      case 'PROCESSING':
        return {
          label: 'Analyzing',
          class: 'text-sky-400 bg-sky-500/10 border-sky-500/20 animate-pulse',
          dotClass: 'bg-sky-400 animate-ping',
        };
      case 'QUEUED':
        return {
          label: 'Queued',
          class: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
          dotClass: 'bg-amber-400',
        };
      case 'FAILED':
      default:
        return {
          label: 'Failed',
          class: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
          dotClass: 'bg-rose-400',
        };
    }
  }
}
