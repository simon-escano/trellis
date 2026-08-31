import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentStore } from '../../core/state/document.store.js';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent {
  @Output() openIngestModal = new EventEmitter<void>();

  readonly store = inject(DocumentStore);

  onSelectDoc(event: Event) {
    const select = event.target as HTMLSelectElement;
    if (select.value) {
      this.store.selectDocument(select.value);
    }
  }

  getStatusDotClass(status: string): string {
    switch (status) {
      case 'COMPLETED':
        return 'bg-trellis-accent shadow-sm shadow-trellis-accent/50';
      case 'PROCESSING':
        return 'bg-trellis-cyan animate-pulse';
      case 'QUEUED':
        return 'bg-trellis-amber';
      case 'FAILED':
      default:
        return 'bg-trellis-rose';
    }
  }
}
