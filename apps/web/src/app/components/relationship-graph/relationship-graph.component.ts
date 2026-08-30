import { Component, computed, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { StateService } from "../../core/services/state.service";
import { EntityRelationship } from "../../core/models/document.model";

@Component({
  selector: "app-relationship-graph",
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="space-y-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <h3
            class="text-xs font-mono font-bold uppercase tracking-wider text-slate-300"
          >
            Dependencies & Relationships
          </h3>
          <span
            class="text-[11px] font-mono px-2 py-0.5 rounded-full bg-trellis-900 border border-trellis-800 text-trellis-accent font-bold"
          >
            {{ relationships().length }}
          </span>
        </div>
      </div>

      <!-- Relationship Flow Cards -->
      <div class="space-y-3">
        @for (rel of relationships(); track rel.id) {
        <div
          class="p-3.5 rounded-xl border border-trellis-800 bg-trellis-900/40 hover:bg-trellis-900/80 transition-all space-y-2.5 shadow-sm relative overflow-hidden group"
        >
          <!-- Header Bar: Relation Verb & Confidence -->
          <div class="flex items-center justify-between">
            <span
              class="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-trellis-accent/10 text-trellis-accent border border-trellis-accent/30 uppercase tracking-wide"
            >
              {{ rel.relationType }}
            </span>

            <span class="text-[10px] font-mono text-slate-400">
              Confidence:
              <strong class="text-slate-200"
                >{{ (rel.confidenceScore * 100).toFixed(0) }}%</strong
              >
            </span>
          </div>

          <!-- Directional Connection Flow Visual -->
          <div class="flex items-center gap-2 font-mono text-xs">
            <!-- Source Entity -->
            <div
              class="flex-1 p-2 rounded-lg bg-trellis-950 border border-trellis-800 text-slate-100 truncate text-center font-semibold text-[11px]"
              [title]="rel.sourceEntity.name"
            >
              {{ rel.sourceEntity.name }}
            </div>

            <!-- Directional Flow Arrow -->
            <div class="flex items-center text-trellis-cyan shrink-0">
              <span class="w-2.5 h-[2px] bg-trellis-cyan/60"></span>
              <svg
                class="w-3.5 h-3.5 -ml-0.5 text-trellis-cyan"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2.5"
                  d="M9 5l7 7-7 7"
                ></path>
              </svg>
            </div>

            <!-- Target Entity -->
            <div
              class="flex-1 p-2 rounded-lg bg-trellis-950 border border-trellis-800 text-slate-100 truncate text-center font-semibold text-[11px]"
              [title]="rel.targetEntity.name"
            >
              {{ rel.targetEntity.name }}
            </div>
          </div>
        </div>
        } @empty {
        <div class="text-center py-6 text-slate-500 space-y-1">
          <p class="text-xs font-mono">No relationships mapped yet.</p>
          <p class="text-[11px] text-slate-500">
            AI extractor discovers directional links automatically.
          </p>
        </div>
        }
      </div>
    </section>
  `,
})
export class RelationshipGraphComponent {
  public state = inject(StateService);

  public relationships = computed(() => {
    return this.state.activeDocument()?.relationships || [];
  });
}
