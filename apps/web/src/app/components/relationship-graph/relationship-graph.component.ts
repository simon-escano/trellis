import { Component, computed, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { StateService } from "../../core/services/state.service";
import { EntityRelationship } from "../../core/models/document.model";

@Component({
  selector: "app-relationship-graph",
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="space-y-4 font-sans">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <h3
            class="text-xs font-medium uppercase tracking-wider text-slate-300"
          >
            Dependencies & Relationships
          </h3>
          <span
            class="text-[11px] px-2 py-0.5 rounded-full bg-trellis-900 border border-trellis-800 text-trellis-accent font-medium"
          >
            {{ relationships().length }}
          </span>
        </div>
      </div>

      <!-- Relationship Flow Cards -->
      <div class="space-y-3 font-sans">
        @for (rel of relationships(); track rel.id) {
        <div
          class="p-3.5 rounded-xl border border-trellis-800 bg-trellis-900/40 hover:bg-trellis-900/80 transition-all space-y-2.5 shadow-sm relative overflow-hidden group"
        >
          <!-- Header Bar: Relation Verb & Confidence -->
          <div class="flex items-center justify-between">
            <span
              class="text-[10px] font-medium px-2 py-0.5 rounded bg-trellis-accent/10 text-trellis-accent border border-trellis-accent/30 uppercase tracking-wide font-sans"
            >
              {{ rel.relationType }}
            </span>

            <span class="text-[10px] text-slate-400 font-sans">
              Confidence:
              <span class="text-slate-200 font-medium"
                >{{ (rel.confidenceScore * 100).toFixed(0) }}%</span
              >
            </span>
          </div>

          <!-- Directional Connection Flow Visual -->
          <div class="flex items-center gap-2 text-xs font-sans">
            <!-- Source Entity -->
            <div
              class="flex-1 p-2 rounded-lg bg-trellis-950 border border-trellis-800 text-slate-100 truncate text-center font-medium text-[11px]"
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
              class="flex-1 p-2 rounded-lg bg-trellis-950 border border-trellis-800 text-slate-100 truncate text-center font-medium text-[11px]"
              [title]="rel.targetEntity.name"
            >
              {{ rel.targetEntity.name }}
            </div>
          </div>
        </div>
        } @empty {
        <div class="text-center py-6 text-slate-500 space-y-1 font-sans">
          <p class="text-xs">No relationships mapped yet.</p>
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
