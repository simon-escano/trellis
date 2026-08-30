import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { NavbarComponent } from "./components/navbar/navbar.component";
import { IngestModalComponent } from "./components/ingest-modal/ingest-modal.component";
import { StateService } from "./core/services/state.service";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [CommonModule, NavbarComponent, IngestModalComponent],
  template: `
    <div
      class="min-h-screen bg-trellis-950 text-slate-100 flex flex-col font-sans selection:bg-trellis-accent/30 selection:text-trellis-accent"
    >
      <app-navbar></app-navbar>

      <!-- Main 3-Column Obsidian Workspace Shell -->
      <main class="flex-1 flex overflow-hidden h-[calc(100vh-4rem)]">
        <!-- Column 1: Left Rail (Document List) -->
        <section
          id="document-list-container"
          class="w-80 border-r border-trellis-800 bg-trellis-950 flex flex-col shrink-0"
        >
          <div
            class="p-4 border-b border-trellis-800 flex items-center justify-between"
          >
            <h2
              class="text-xs font-mono font-bold uppercase tracking-wider text-slate-400"
            >
              Specifications
            </h2>
            <span
              class="text-xs font-mono px-2 py-0.5 rounded bg-trellis-900 border border-trellis-800 text-slate-300"
            >
              {{ state.filteredDocuments().length }}
            </span>
          </div>
          <div class="flex-1 overflow-y-auto p-3 space-y-2">
            @for (doc of state.filteredDocuments(); track doc.id) {
            <div
              (click)="state.selectDocument(doc.id)"
              [class.bg-trellis-900]="state.selectedDocumentId() === doc.id"
              [class.border-trellis-accent]="
                state.selectedDocumentId() === doc.id
              "
              [class.border-trellis-800]="state.selectedDocumentId() !== doc.id"
              class="p-3 rounded-lg border bg-trellis-950/60 hover:bg-trellis-900/80 cursor-pointer transition-all"
            >
              <div class="flex items-start justify-between gap-2 mb-1">
                <h3 class="font-semibold text-sm text-slate-100 truncate">
                  {{ doc.title }}
                </h3>
                <span
                  [ngClass]="{
                    'bg-emerald-500/10 text-emerald-400 border-emerald-500/30':
                      doc.status === 'COMPLETED',
                    'bg-amber-500/10 text-amber-400 border-amber-500/30':
                      doc.status === 'QUEUED',
                    'bg-cyan-500/10 text-cyan-400 border-cyan-500/30':
                      doc.status === 'PROCESSING',
                    'bg-rose-500/10 text-rose-400 border-rose-500/30':
                      doc.status === 'FAILED'
                  }"
                  class="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase"
                >
                  {{ doc.status }}
                </span>
              </div>
              <p class="text-xs text-slate-400 line-clamp-2">
                {{ doc.summary || "Processing spec analysis..." }}
              </p>
            </div>
            } @empty {
            <div class="text-center py-12 text-slate-500">
              <p class="text-xs font-mono">No specifications loaded.</p>
            </div>
            }
          </div>
        </section>

        <!-- Column 2: Center Workspace (Document Viewer & Summary) -->
        <section
          id="document-viewer-container"
          class="flex-1 border-r border-trellis-800 bg-trellis-900/30 flex flex-col overflow-y-auto"
        >
          @if (state.activeDocument(); as active) {
          <div class="p-8 max-w-4xl w-full mx-auto space-y-6">
            <div>
              <div class="flex items-center gap-2 mb-2">
                <span class="text-xs font-mono text-trellis-cyan uppercase"
                  >Architecture Specification</span
                >
                <span class="text-slate-600">•</span>
                <span class="text-xs font-mono text-slate-400">{{
                  active.id
                }}</span>
              </div>
              <h1 class="text-2xl font-bold text-white tracking-tight">
                {{ active.title }}
              </h1>
            </div>

            <!-- Executive Summary Card -->
            <div
              class="p-6 rounded-xl bg-trellis-900/80 border border-trellis-800 shadow-xl space-y-3"
            >
              <div
                class="flex items-center gap-2 text-trellis-accent font-mono text-xs font-bold uppercase tracking-wider"
              >
                <span>✦</span> Executive Summary
              </div>
              <p class="text-slate-200 leading-relaxed text-sm">
                {{
                  active.summary ||
                    "Pending AI entity extraction and summarization..."
                }}
              </p>
            </div>

            <!-- Raw Content Section -->
            <div
              class="rounded-xl border border-trellis-800 bg-trellis-950/60 overflow-hidden"
            >
              <div
                class="px-4 py-3 border-b border-trellis-800 bg-trellis-900/50 flex items-center justify-between"
              >
                <span
                  class="text-xs font-mono text-slate-400 font-semibold uppercase"
                  >Source Text</span
                >
              </div>
              <pre
                class="p-4 text-xs font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-72"
                >{{ active.rawContent }}</pre
              >
            </div>
          </div>
          } @else {
          <div
            class="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 space-y-4"
          >
            <div
              class="w-16 h-16 rounded-2xl bg-trellis-900 border border-trellis-800 flex items-center justify-center text-3xl"
            >
              📄
            </div>
            <div class="text-center">
              <p class="font-semibold text-slate-300">
                No Specification Selected
              </p>
              <p class="text-xs font-mono text-slate-500 mt-1">
                Select an architecture spec or ingest a new document.
              </p>
            </div>
          </div>
          }
        </section>

        <!-- Column 3: Right Rail (Knowledge Graph & Entity Inspector) -->
        <section
          id="entity-inspector-container"
          class="w-96 bg-trellis-950 flex flex-col shrink-0 overflow-y-auto"
        >
          <div class="p-4 border-b border-trellis-800">
            <h2
              class="text-xs font-mono font-bold uppercase tracking-wider text-slate-400"
            >
              Knowledge Graph
            </h2>
          </div>
          <div class="p-4 flex-1">
            @if (state.activeDocument(); as active) {
            <div class="space-y-4">
              <div class="text-xs font-mono text-slate-400">
                <span>Entities ({{ active.entities.length || 0 }})</span>
              </div>
              <div class="flex flex-wrap gap-2">
                @for (entity of active.entities; track entity.id) {
                <span
                  class="px-2 py-1 rounded bg-trellis-900 border border-trellis-800 text-xs font-mono text-slate-200"
                >
                  {{ entity.name }}
                </span>
                } @empty {
                <p class="text-xs text-slate-500 font-mono">
                  No entities extracted yet.
                </p>
                }
              </div>
            </div>
            } @else {
            <p class="text-xs text-slate-500 font-mono text-center py-12">
              Select a document to inspect entities.
            </p>
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
}
