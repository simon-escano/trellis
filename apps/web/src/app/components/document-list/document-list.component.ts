import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { StateService } from "../../core/services/state.service";
import { Document } from "../../core/models/document.model";

@Component({
  selector: "app-document-list",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <aside
      class="h-full flex flex-col bg-trellis-950 border-r border-trellis-800 select-none"
    >
      <!-- Header & Search Toolbar -->
      <div class="p-4 border-b border-trellis-800 space-y-3 bg-trellis-950">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <h2
              class="text-xs font-mono font-bold uppercase tracking-wider text-slate-300"
            >
              Specifications
            </h2>
            <span
              class="text-[11px] font-mono px-2 py-0.5 rounded-full bg-trellis-900 border border-trellis-800 text-slate-300"
            >
              {{ state.filteredDocuments().length }}
            </span>
          </div>
        </div>

        <!-- Search Input -->
        <div class="relative">
          <input
            type="text"
            [ngModel]="state.searchQuery()"
            (ngModelChange)="state.searchQuery.set($event)"
            placeholder="Search specs or summaries..."
            class="w-full pl-8 pr-3 py-1.5 rounded-lg bg-trellis-900/90 border border-trellis-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-trellis-accent transition-all font-sans"
          />
          <svg
            class="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            ></path>
          </svg>
        </div>

        <!-- Status Filter Tags -->
        <div class="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] font-mono">
          @for (tab of ['ALL', 'COMPLETED', 'PROCESSING', 'QUEUED', 'FAILED']; track tab) {
          <button
            (click)="state.statusFilter.set(tab)"
            [class.bg-trellis-800]="state.statusFilter() === tab"
            [class.text-white]="state.statusFilter() === tab"
            [class.border-trellis-700]="state.statusFilter() === tab"
            [class.text-slate-400]="state.statusFilter() !== tab"
            class="px-2 py-0.5 rounded border border-transparent hover:border-trellis-800 hover:text-slate-200 transition-all uppercase"
          >
            {{ tab }}
          </button>
          }
        </div>
      </div>

      <!-- Document Scrollable List -->
      <div class="flex-1 overflow-y-auto p-3 space-y-2">
        @for (doc of state.filteredDocuments(); track doc.id) {
        <div
          (click)="state.selectDocument(doc.id)"
          [class.bg-trellis-900]="state.selectedDocumentId() === doc.id"
          [class.border-trellis-accent]="state.selectedDocumentId() === doc.id"
          [class.shadow-[0_0_15px_rgba(0,229,153,0.1)]]="
            state.selectedDocumentId() === doc.id
          "
          [class.border-trellis-800]="state.selectedDocumentId() !== doc.id"
          class="group p-3 rounded-xl border bg-trellis-950/70 hover:bg-trellis-900/90 cursor-pointer transition-all relative overflow-hidden"
        >
          <!-- Active Selection Indicator Bar -->
          @if (state.selectedDocumentId() === doc.id) {
          <div
            class="absolute left-0 top-0 bottom-0 w-1 bg-trellis-accent"
          ></div>
          }

          <!-- Title & Status Badge -->
          <div class="flex items-start justify-between gap-2 mb-1.5">
            <h3
              class="font-semibold text-xs text-slate-100 truncate flex-1 group-hover:text-white transition-colors"
            >
              {{ doc.title }}
            </h3>

            <!-- Dynamic Status Badge -->
            @switch (doc.status) { @case ('COMPLETED') {
            <span
              class="flex items-center gap-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shrink-0"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              {{ doc.entities.length || 0 }} Entities
            </span>
            } @case ('PROCESSING') {
            <span
              class="flex items-center gap-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shrink-0"
            >
              <svg
                class="w-2.5 h-2.5 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Extracting...
            </span>
            } @case ('QUEUED') {
            <span
              class="flex items-center gap-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 shrink-0"
            >
              <span
                class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"
              ></span>
              Queued
            </span>
            } @case ('FAILED') {
            <span
              class="flex items-center gap-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30 shrink-0"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
              Failed
            </span>
            } }
          </div>

          <!-- Snippet -->
          <p class="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
            {{ doc.summary || doc.rawContent }}
          </p>

          <!-- Footer Actions & Metadata -->
          <div
            class="mt-2.5 pt-2 border-t border-trellis-800/60 flex items-center justify-between text-[10px] font-mono text-slate-500"
          >
            <span>{{ formatDate(doc.createdAt) }}</span>

            <div
              class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <!-- Reprocess Button -->
              <button
                (click)="onReprocess($event, doc.id)"
                title="Reprocess Document"
                class="p-1 rounded hover:bg-trellis-800 text-slate-400 hover:text-trellis-cyan transition-colors"
              >
                <svg
                  class="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  ></path>
                </svg>
              </button>

              <!-- Delete Button -->
              <button
                (click)="onDelete($event, doc.id)"
                title="Delete Document"
                class="p-1 rounded hover:bg-trellis-800 text-slate-400 hover:text-rose-400 transition-colors"
              >
                <svg
                  class="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  ></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
        } @empty {
        <div class="text-center py-16 px-4 text-slate-500 space-y-2">
          <div
            class="w-10 h-10 mx-auto rounded-xl bg-trellis-900 border border-trellis-800 flex items-center justify-center text-lg text-slate-400"
          >
            📋
          </div>
          <p class="text-xs font-mono font-semibold text-slate-400">
            No specifications found
          </p>
          <p class="text-[11px] text-slate-500">
            Click "+ Ingest Spec" to submit architecture specifications.
          </p>
        </div>
        }
      </div>
    </aside>
  `,
})
export class DocumentListComponent {
  public state = inject(StateService);

  public formatDate(dateStr: string): string {
    try {
      const d = new Date(dateStr);
      return (
        d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) +
        " " +
        d.toLocaleDateString([], { month: "short", day: "numeric" })
      );
    } catch {
      return dateStr;
    }
  }

  public onReprocess(event: MouseEvent, id: string): void {
    event.stopPropagation();
    this.state.reprocessDocument(id);
  }

  public onDelete(event: MouseEvent, id: string): void {
    event.stopPropagation();
    this.state.deleteDocument(id);
  }
}
