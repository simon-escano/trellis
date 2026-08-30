import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-trellis-950 text-slate-100 flex flex-col">
      <header class="border-b border-trellis-800 px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-trellis-accent/20 border border-trellis-accent/40 flex items-center justify-center text-trellis-accent font-bold text-lg shadow-[0_0_15px_rgba(0,229,153,0.3)]">
            🌿
          </div>
          <div>
            <h1 class="font-bold text-lg tracking-wide text-white">TRELLIS</h1>
            <p class="text-xs text-slate-400 font-mono">Architecture Knowledge Graph</p>
          </div>
        </div>
      </header>
      <main class="flex-1 p-6">
        <p class="text-slate-300">Trellis Frontend Scaffolded.</p>
      </main>
    </div>
  `,
})
export class AppComponent {
  title = "trellis-web";
}
