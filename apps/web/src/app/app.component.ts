import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeComponent } from './features/home/home.component.js';
import { CanvasComponent } from './features/canvas/canvas.component.js';
import { IngestModalComponent } from './features/ingest-modal/ingest-modal.component.js';
import { DocumentStore } from './core/state/document.store.js';
import { ThemeService } from './core/services/theme.service.js';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    HomeComponent,
    CanvasComponent,
    IngestModalComponent,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  readonly store = inject(DocumentStore);
  readonly themeService = inject(ThemeService);
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
