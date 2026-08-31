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
  @Output() zoomIn = new EventEmitter<void>();
  @Output() zoomOut = new EventEmitter<void>();
  @Output() fitCanvas = new EventEmitter<void>();
  @Output() togglePhysics = new EventEmitter<void>();

  readonly store = inject(DocumentStore);

  getStatusDotClass(status: string): string {
    switch (status) {
      case 'COMPLETED':
        return 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]';
      case 'PROCESSING':
        return 'bg-sky-400 animate-pulse shadow-[0_0_8px_rgba(56,189,248,0.8)]';
      case 'QUEUED':
        return 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]';
      case 'FAILED':
      default:
        return 'bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.8)]';
    }
  }
}
