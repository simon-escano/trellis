import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { StateService } from "../../core/services/state.service";

const DEMO_RFC_TITLE = "RFC 404: Distributed Event Broker Architecture";
const DEMO_RFC_CONTENT =
  "The Trellis Event Broker service interfaces directly with the Ingestion Gateway via gRPC and buffers incoming telemetry into an AWS SQS queue. The Telemetry Ingestion Worker consumes messages from SQS, executes payload validation against strict schemas, and writes compressed traces to the PostgreSQL Primary Cluster. To reduce query latency, the Authentication Service caches active JSON Web Tokens within Redis Memory Store, while an AWS S3 Bucket provides durable object storage for raw diagnostic dumps.";

@Component({
  selector: "app-ingest-modal",
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (state.isIngestModalOpen()) {
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in font-sans"
      (click)="onBackdropClick($event)"
    >
      <div
        class="w-full max-w-2xl bg-trellis-900 border border-trellis-800 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh]"
        (click)="$event.stopPropagation()"
      >
        <!-- Modal Header -->
        <div
          class="px-6 py-4 border-b border-trellis-800 flex items-center justify-between bg-trellis-950/60 font-sans"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-8 h-8 rounded-lg bg-trellis-accent/15 border border-trellis-accent/30 flex items-center justify-center text-trellis-accent font-medium"
            >
              📄
            </div>
            <div>
              <h2 class="font-medium text-base text-white">
                Ingest Architecture Spec
              </h2>
              <p class="text-xs text-slate-400 font-sans">
                Submit raw technical text for knowledge graph extraction
              </p>
            </div>
          </div>

          <button
            (click)="state.setModalOpen(false)"
            class="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-trellis-800 transition-colors"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>

        <!-- Modal Body -->
        <form (ngSubmit)="onSubmit()" class="p-6 space-y-4 flex-1 overflow-y-auto font-sans">
          <!-- Quick Load Demo Spec Button -->
          <div
            class="flex items-center justify-between p-3 rounded-xl bg-trellis-950/80 border border-trellis-800 font-sans"
          >
            <div class="flex items-center gap-2 text-xs text-slate-300">
              <span class="text-trellis-accent font-medium">💡 Tip:</span>
              <span>Test the pipeline with our reference RFC 404 sample.</span>
            </div>
            <button
              type="button"
              (click)="loadDemoSpec()"
              class="px-3 py-1.5 rounded-lg bg-trellis-800 hover:bg-trellis-700 text-xs font-sans text-trellis-cyan hover:text-cyan-300 border border-trellis-700 transition-all flex items-center gap-1.5 font-medium"
            >
              <span>⚡ Load RFC 404 Spec</span>
            </button>
          </div>

          <!-- Document Title Input -->
          <div class="space-y-1.5">
            <label class="block text-xs text-slate-300 uppercase tracking-wider font-medium font-sans"
              >Specification Title</label
            >
            <input
              type="text"
              name="title"
              [(ngModel)]="title"
              placeholder="e.g., RFC 404: Distributed Event Broker Architecture"
              required
              class="w-full px-4 py-2.5 rounded-xl bg-trellis-950 border border-trellis-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-trellis-accent focus:ring-1 focus:ring-trellis-accent transition-all font-sans"
            />
          </div>

          <!-- Raw Content Textarea -->
          <div class="space-y-1.5">
            <label class="block text-xs text-slate-300 uppercase tracking-wider font-medium font-sans"
              >Raw Architecture Content</label
            >
            <textarea
              name="rawContent"
              [(ngModel)]="rawContent"
              rows="7"
              placeholder="Paste RFC description, service interaction contracts, or architecture documentation..."
              required
              class="w-full px-4 py-3 rounded-xl bg-trellis-950 border border-trellis-800 text-slate-200 placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-trellis-accent focus:ring-1 focus:ring-trellis-accent transition-all leading-relaxed"
            ></textarea>
          </div>

          @if (errorMessage) {
          <div
            class="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono"
          >
            {{ errorMessage }}
          </div>
          }

          <!-- Modal Actions Footer -->
          <div class="pt-2 flex items-center justify-end gap-3 border-t border-trellis-800 font-sans">
            <button
              type="button"
              (click)="state.setModalOpen(false)"
              class="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-trellis-800 transition-colors font-sans"
            >
              Cancel
            </button>
            <button
              type="submit"
              [disabled]="state.isIngesting() || !title.trim() || !rawContent.trim()"
              class="flex items-center gap-2 bg-gradient-to-r from-trellis-accent to-emerald-400 text-trellis-950 font-medium px-6 py-2 rounded-xl text-sm shadow-[0_0_20px_rgba(0,229,153,0.3)] hover:shadow-[0_0_25px_rgba(0,229,153,0.5)] disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99] transition-all font-sans"
            >
              @if (state.isIngesting()) {
              <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Enqueuing...</span>
              } @else {
              <span>Enrich Knowledge Graph ➔</span>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
    }
  `,
})
export class IngestModalComponent {
  public state = inject(StateService);

  public title = "";
  public rawContent = "";
  public errorMessage = "";

  public loadDemoSpec(): void {
    this.title = DEMO_RFC_TITLE;
    this.rawContent = DEMO_RFC_CONTENT;
    this.errorMessage = "";
  }

  public onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.state.setModalOpen(false);
    }
  }

  public async onSubmit(): Promise<void> {
    if (!this.title.trim() || !this.rawContent.trim()) {
      this.errorMessage = "Please enter both a title and specification text.";
      return;
    }

    this.errorMessage = "";
    try {
      await this.state.ingestDocument(this.title.trim(), this.rawContent.trim());
      this.title = "";
      this.rawContent = "";
    } catch (err: any) {
      this.errorMessage = err.message || "Failed to submit document for ingestion.";
    }
  }
}
