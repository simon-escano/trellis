import {
  Component,
  ElementRef,
  ViewChild,
  effect,
  inject,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { StateService } from "../../core/services/state.service";
import { animateCardEntry } from "../../core/animation/motion.utils";

@Component({
  selector: "app-document-viewer",
  standalone: true,
  imports: [CommonModule],
  template: `
    <article
      #container
      class="h-full overflow-y-auto p-6 md:p-8 space-y-6"
    >
      @if (state.activeDocument(); as doc) {
      <!-- Header Banner -->
      <div class="space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2 font-mono text-xs text-slate-400">
            <span
              class="px-2 py-0.5 rounded bg-trellis-900 border border-trellis-800 text-trellis-cyan font-semibold uppercase tracking-wider text-[10px]"
              >Specification</span
            >
            <span>•</span>
            <span class="truncate max-w-[200px]">{{ doc.id }}</span>
          </div>

          <!-- Status & Reprocess Controls -->
          <div class="flex items-center gap-2">
            @switch (doc.status) { @case ('COMPLETED') {
            <span
              class="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5"
            >
              <span
                class="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34D399]"
              ></span>
              COMPLETED
            </span>
            } @case ('PROCESSING') {
            <span
              class="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center gap-1.5"
            >
              <svg
                class="w-3 h-3 animate-spin"
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
              PROCESSING
            </span>
            } @case ('QUEUED') {
            <span
              class="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1.5"
            >
              <span
                class="w-2 h-2 rounded-full bg-amber-400 animate-ping"
              ></span>
              QUEUED
            </span>
            } @case ('FAILED') {
            <span
              class="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center gap-1.5"
            >
              <span class="w-2 h-2 rounded-full bg-rose-400"></span>
              FAILED
            </span>
            } }

            <button
              (click)="state.reprocessDocument(doc.id)"
              title="Re-run AI Extraction"
              class="px-3 py-1 rounded-lg bg-trellis-900 hover:bg-trellis-800 border border-trellis-800 text-slate-300 hover:text-white text-xs font-mono transition-all flex items-center gap-1.5"
            >
              <svg
                class="w-3.5 h-3.5"
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
              <span>Reprocess</span>
            </button>
          </div>
        </div>

        <h1 class="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-snug">
          {{ doc.title }}
        </h1>

        <div class="flex items-center gap-4 text-xs font-mono text-slate-500">
          <span>Ingested: {{ doc.createdAt | date : "medium" }}</span>
          <span>•</span>
          <span>Updated: {{ doc.updatedAt | date : "medium" }}</span>
        </div>
      </div>

      <!-- Failure Error Banner if any -->
      @if (doc.errorMessage) {
      <div
        class="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 space-y-1"
      >
        <div class="flex items-center gap-2 font-mono text-xs font-bold uppercase">
          <span>⚠️</span> Extraction Pipeline Error
        </div>
        <p class="text-xs font-mono text-rose-300 leading-relaxed">
          {{ doc.errorMessage }}
        </p>
      </div>
      }

      <!-- Executive Architecture Summary Card -->
      <section
        class="p-6 rounded-2xl bg-gradient-to-b from-trellis-900/90 to-trellis-900/50 border border-trellis-800 shadow-2xl space-y-3 relative overflow-hidden"
      >
        <div
          class="absolute -right-12 -top-12 w-32 h-32 bg-trellis-accent/10 rounded-full blur-3xl pointer-events-none"
        ></div>

        <div class="flex items-center gap-2 text-trellis-accent font-mono text-xs font-bold uppercase tracking-wider">
          <span class="text-sm">✦</span>
          <span>Executive Architecture Summary</span>
        </div>

        <p class="text-slate-200 text-sm md:text-base leading-relaxed">
          {{
            doc.summary ||
              "Document is currently queued or undergoing AI extraction. Executive summary will appear once processing completes."
          }}
        </p>
      </section>

      <!-- Source Text Collapsible Drawer -->
      <section
        class="rounded-2xl border border-trellis-800 bg-trellis-950/80 overflow-hidden"
      >
        <div
          (click)="isRawCollapsed = !isRawCollapsed"
          class="px-5 py-3.5 border-b border-trellis-800/80 bg-trellis-900/40 flex items-center justify-between cursor-pointer hover:bg-trellis-900/70 transition-colors"
        >
          <div class="flex items-center gap-2">
            <span class="text-xs font-mono text-slate-300 font-bold uppercase tracking-wider"
              >Source Specification Text</span
            >
            <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-trellis-800 text-slate-400"
              >{{ doc.rawContent.length }} chars</span
            >
          </div>

          <div class="flex items-center gap-2 text-slate-400 hover:text-white text-xs font-mono">
            <button
              (click)="copyRawText($event, doc.rawContent)"
              class="px-2 py-0.5 rounded hover:bg-trellis-800 text-[11px] transition-colors"
            >
              {{ isCopied ? "✓ Copied" : "Copy" }}
            </button>
            <svg
              class="w-4 h-4 transform transition-transform duration-200"
              [class.rotate-180]="!isRawCollapsed"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              ></path>
            </svg>
          </div>
        </div>

        @if (!isRawCollapsed) {
        <div class="p-5 overflow-x-auto bg-black/20">
          <pre
            class="font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed select-text"
            >{{ doc.rawContent }}</pre
          >
        </div>
        }
      </section>
      } @else {
      <!-- Empty State -->
      <div
        class="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 text-slate-500"
      >
        <div
          class="w-16 h-16 rounded-2xl bg-trellis-900 border border-trellis-800 flex items-center justify-center text-3xl shadow-lg"
        >
          📄
        </div>
        <div class="space-y-1">
          <h2 class="font-bold text-base text-slate-300">
            No Specification Selected
          </h2>
          <p class="text-xs font-mono text-slate-500 max-w-sm">
            Select a document from the left rail or click "+ Ingest Spec" to process a new technical architecture RFC.
          </p>
        </div>
      </div>
      }
    </article>
  `,
})
export class DocumentViewerComponent {
  @ViewChild("container") containerRef!: ElementRef<HTMLElement>;
  public state = inject(StateService);

  public isRawCollapsed = false;
  public isCopied = false;

  constructor() {
    effect(() => {
      const doc = this.state.activeDocument();
      if (doc && this.containerRef) {
        animateCardEntry(this.containerRef.nativeElement);
      }
    });
  }

  public copyRawText(event: MouseEvent, content: string): void {
    event.stopPropagation();
    navigator.clipboard.writeText(content);
    this.isCopied = true;
    setTimeout(() => {
      this.isCopied = false;
    }, 2000);
  }
}
