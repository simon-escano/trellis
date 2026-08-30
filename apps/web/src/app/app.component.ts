import { Component, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { NavbarComponent } from "./components/navbar/navbar.component";
import { IngestModalComponent } from "./components/ingest-modal/ingest-modal.component";
import { DocumentListComponent } from "./components/document-list/document-list.component";
import { DocumentViewerComponent } from "./components/document-viewer/document-viewer.component";
import { EntityInspectorComponent } from "./components/entity-inspector/entity-inspector.component";
import { RelationshipGraphComponent } from "./components/relationship-graph/relationship-graph.component";
import { StateService } from "./core/services/state.service";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    IngestModalComponent,
    DocumentListComponent,
    DocumentViewerComponent,
    EntityInspectorComponent,
    RelationshipGraphComponent,
  ],
  template: `
    <div
      class="min-h-screen bg-trellis-950 text-slate-100 flex flex-col font-sans selection:bg-trellis-accent/30 selection:text-trellis-accent"
    >
      <app-navbar></app-navbar>

      <!-- Main 3-Column Obsidian Workspace Shell -->
      <main class="flex-1 flex overflow-hidden h-[calc(100vh-4rem)] font-sans">
        <!-- Column 1: Left Rail (Document List) -->
        <section id="document-list-container" class="w-80 shrink-0 h-full">
          <app-document-list class="h-full block"></app-document-list>
        </section>

        <!-- Column 2: Center Workspace (Document Viewer & Summary) -->
        <section
          id="document-viewer-container"
          class="flex-1 border-r border-trellis-800 bg-trellis-900/20 h-full overflow-hidden"
        >
          <app-document-viewer class="h-full block"></app-document-viewer>
        </section>

        <!-- Column 3: Right Rail (Knowledge Graph & Entity Inspector) -->
        <section
          id="entity-inspector-container"
          class="w-96 bg-trellis-950 flex flex-col shrink-0 h-full overflow-hidden"
        >
          <!-- Tabs: Entities vs Relationships -->
          <div
            class="px-4 py-3 border-b border-trellis-800 bg-trellis-950 flex items-center justify-between"
          >
            <div class="flex items-center gap-1 bg-trellis-900 p-1 rounded-lg border border-trellis-800 text-xs font-sans">
              <button
                (click)="activeTab.set('ENTITIES')"
                [class.bg-trellis-800]="activeTab() === 'ENTITIES'"
                [class.text-white]="activeTab() === 'ENTITIES'"
                [class.text-slate-400]="activeTab() !== 'ENTITIES'"
                class="px-3 py-1 rounded-md transition-all font-medium font-sans"
              >
                Entities ({{ state.activeDocument()?.entities?.length || 0 }})
              </button>
              <button
                (click)="activeTab.set('GRAPH')"
                [class.bg-trellis-800]="activeTab() === 'GRAPH'"
                [class.text-white]="activeTab() === 'GRAPH'"
                [class.text-slate-400]="activeTab() !== 'GRAPH'"
                class="px-3 py-1 rounded-md transition-all font-medium font-sans"
              >
                Graph ({{ state.activeDocument()?.relationships?.length || 0 }})
              </button>
            </div>
          </div>

          <!-- Right Rail Content -->
          <div class="flex-1 overflow-y-auto p-4 font-sans">
            @if (state.activeDocument()) {
              @if (activeTab() === 'ENTITIES') {
                <app-entity-inspector></app-entity-inspector>
              } @else {
                <app-relationship-graph></app-relationship-graph>
              }
            } @else {
              <div class="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2 font-sans">
                <div class="text-2xl">🌿</div>
                <p class="text-xs font-medium text-slate-400">Knowledge Graph Inspector</p>
                <p class="text-[11px] text-slate-500">Select a specification to explore extracted entities and directional relationship nodes.</p>
              </div>
            }
          </div>
        </section>
      </main>

      <!-- Ingest Modal Component -->
      <app-ingest-modal></app-ingest-modal>
    </div>
  `,
})
export class AppComponent {
  public state = inject(StateService);
  public activeTab = signal<"ENTITIES" | "GRAPH">("ENTITIES");
}
