import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  template: `
    <main class="h-screen w-screen flex flex-col bg-trellis-bg text-trellis-text-primary">
      <header class="h-14 border-b border-trellis-border flex items-center justify-between px-6 glass-panel z-10">
        <div class="flex items-center space-x-3">
          <div class="w-8 h-8 rounded-lg bg-trellis-accent/10 border border-trellis-accent/30 flex items-center justify-center">
            <div class="w-3.5 h-3.5 rounded-sm bg-trellis-accent"></div>
          </div>
          <span class="font-bold tracking-tight text-lg text-trellis-text-primary">Trellis</span>
          <span class="text-xs px-2 py-0.5 rounded-full bg-trellis-accent/10 text-trellis-accent border border-trellis-accent/20">Concept Canvas</span>
        </div>
      </header>
      <div class="flex-1 relative flex items-center justify-center">
        <p class="text-trellis-text-muted">Canvas Scaffolding Initialized</p>
      </div>
    </main>
  `,
})
export class AppComponent {}
