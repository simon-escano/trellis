import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from './features/sidebar/sidebar.component.js';
import { CanvasComponent } from './features/canvas/canvas.component.js';
import { InspectorComponent } from './features/inspector/inspector.component.js';
import { IngestModalComponent } from './features/ingest-modal/ingest-modal.component.js';
import { DocumentStore } from './core/state/document.store.js';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    SidebarComponent,
    CanvasComponent,
    InspectorComponent,
    IngestModalComponent,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  readonly store = inject(DocumentStore);
  readonly isIngestModalOpen = signal<boolean>(false);

  ngOnInit() {
    this.store.loadInitialData();
  }

  openIngestModal() {
    this.isIngestModalOpen.set(true);
  }

  closeIngestModal() {
    this.isIngestModalOpen.set(false);
  }
}
