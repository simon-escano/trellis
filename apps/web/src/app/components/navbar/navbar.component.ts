import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { StateService } from "../../core/services/state.service";

@Component({
  selector: "app-navbar",
  standalone: true,
  imports: [CommonModule],
  template: `
    <header
      class="h-16 border-b border-trellis-800 bg-trellis-950/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40"
    >
      <!-- Left: Brand Logo & Title -->
      <div class="flex items-center gap-3">
        <div
          class="w-9 h-9 rounded-xl bg-gradient-to-br from-trellis-accent/20 to-trellis-cyan/20 border border-trellis-accent/40 flex items-center justify-center text-trellis-accent font-black text-xl shadow-[0_0_20px_rgba(0,229,153,0.25)]"
        >
          🌿
        </div>
        <div>
          <div class="flex items-center gap-2">
            <span
              class="font-extrabold text-base tracking-wider text-white font-sans"
              >TRELLIS</span
            >
            <span
              class="w-1.5 h-1.5 rounded-full bg-trellis-accent shadow-[0_0_8px_#00E599] animate-pulse"
            ></span>
            <span
              class="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-trellis-800 text-slate-300 border border-trellis-700"
              >v0.1.0</span
            >
          </div>
          <p class="text-[11px] text-slate-400 font-mono tracking-tight">
            Enterprise Knowledge Graph & Architecture Engine
          </p>
        </div>
      </div>

      <!-- Center: System Metrics Real-Time Badges -->
      <div
        class="hidden md:flex items-center gap-2 bg-trellis-900/90 border border-trellis-800 px-3.5 py-1.5 rounded-full shadow-inner font-mono text-xs"
      >
        <div class="flex items-center gap-1.5 px-2">
          <span class="text-slate-400">Total:</span>
          <span class="font-semibold text-slate-100">{{
            state.metrics().totalDocuments
          }}</span>
        </div>
        <div class="h-3 w-[1px] bg-trellis-800"></div>
        <div class="flex items-center gap-1.5 px-2">
          <span
            class="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34D399]"
          ></span>
          <span class="text-slate-400">Processed:</span>
          <span class="font-semibold text-emerald-400">{{
            state.metrics().processedCount
          }}</span>
        </div>
        <div class="h-3 w-[1px] bg-trellis-800"></div>
        <div class="flex items-center gap-1.5 px-2">
          <span
            class="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_#FBBF24]"
            [class.animate-ping]="state.metrics().queuedCount > 0"
          ></span>
          <span class="text-slate-400">Queued:</span>
          <span class="font-semibold text-amber-400">{{
            state.metrics().queuedCount
          }}</span>
        </div>
        <div class="h-3 w-[1px] bg-trellis-800"></div>
        <div class="flex items-center gap-1.5 px-2">
          <span
            class="w-2 h-2 rounded-full bg-rose-400 shadow-[0_0_6px_#FB7185]"
          ></span>
          <span class="text-slate-400">Failed:</span>
          <span class="font-semibold text-rose-400">{{
            state.metrics().failedCount
          }}</span>
        </div>
      </div>

      <!-- Right: Action Controls -->
      <div class="flex items-center gap-3">
        <button
          (click)="state.refreshAll()"
          [disabled]="state.isLoading()"
          title="Refresh All Records"
          class="p-2 rounded-lg bg-trellis-900 hover:bg-trellis-800 border border-trellis-800 text-slate-300 hover:text-white transition-all disabled:opacity-50"
        >
          <svg
            class="w-4 h-4"
            [class.animate-spin]="state.isLoading()"
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

        <button
          (click)="state.setModalOpen(true)"
          class="flex items-center gap-2 bg-gradient-to-r from-trellis-accent to-emerald-400 text-trellis-950 font-bold px-4 py-2 rounded-lg text-sm shadow-[0_0_20px_rgba(0,229,153,0.3)] hover:shadow-[0_0_25px_rgba(0,229,153,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <svg
            class="w-4 h-4 font-bold"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2.5"
              d="M12 4v16m8-8H4"
            ></path>
          </svg>
          <span>Ingest Spec</span>
        </button>
      </div>
    </header>
  `,
})
export class NavbarComponent {
  public state = inject(StateService);
}
