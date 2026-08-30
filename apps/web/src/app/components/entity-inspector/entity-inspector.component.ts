import { Component, computed, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { StateService } from "../../core/services/state.service";
import { Entity, EntityCategory } from "../../core/models/document.model";

@Component({
  selector: "app-entity-inspector",
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="space-y-4 font-sans">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <h3
            class="text-xs font-medium uppercase tracking-wider text-slate-300"
          >
            Entities
          </h3>
          <span
            class="text-[11px] px-2 py-0.5 rounded-full bg-trellis-900 border border-trellis-800 text-trellis-cyan font-medium"
          >
            {{ allEntities().length }}
          </span>
        </div>
      </div>

      <!-- Category Filter Pills -->
      <div class="flex flex-wrap gap-1.5 text-[10px]">
        <button
          (click)="selectedCategory.set('ALL')"
          [class.bg-trellis-800]="selectedCategory() === 'ALL'"
          [class.text-white]="selectedCategory() === 'ALL'"
          [class.border-trellis-700]="selectedCategory() === 'ALL'"
          [class.text-slate-400]="selectedCategory() !== 'ALL'"
          class="px-2 py-1 rounded-md border border-trellis-800/80 hover:border-trellis-700 transition-all font-medium font-sans"
        >
          ALL ({{ allEntities().length }})
        </button>

        @for (cat of categories; track cat) { @if (getCategoryCount(cat) > 0) {
        <button
          (click)="selectedCategory.set(cat)"
          [class.bg-trellis-800]="selectedCategory() === cat"
          [class.text-white]="selectedCategory() === cat"
          [class.border-trellis-700]="selectedCategory() === cat"
          [class.text-slate-400]="selectedCategory() !== cat"
          class="px-2 py-1 rounded-md border border-trellis-800/80 hover:border-trellis-700 transition-all flex items-center gap-1 font-medium font-sans"
        >
          <span>{{ cat }}</span>
          <span class="opacity-70">({{ getCategoryCount(cat) }})</span>
        </button>
        } }
      </div>

      <!-- Entity Cards List -->
      <div class="space-y-2.5">
        @for (entity of filteredEntities(); track entity.id) {
        <div
          class="p-3.5 rounded-xl border border-trellis-800 bg-trellis-900/60 hover:bg-trellis-900 transition-all space-y-2 shadow-sm font-sans"
        >
          <div class="flex items-start justify-between gap-2">
            <div>
              <h4 class="font-medium text-xs text-white leading-tight">
                {{ entity.name }}
              </h4>
            </div>

            <!-- Category Badge -->
            <span
              [ngClass]="getCategoryBadgeClass(entity.category)"
              class="text-[9px] font-medium px-2 py-0.5 rounded border uppercase shrink-0"
            >
              {{ entity.category }}
            </span>
          </div>

          <!-- Confidence Score Bar -->
          <div class="flex items-center gap-2 text-[10px] text-slate-400 font-sans">
            <span>Confidence:</span>
            <div class="flex-1 h-1.5 rounded-full bg-trellis-950 overflow-hidden border border-trellis-800">
              <div
                class="h-full bg-gradient-to-r from-trellis-cyan to-trellis-accent rounded-full transition-all duration-500"
                [style.width.%]="entity.confidenceScore * 100"
              ></div>
            </div>
            <span class="text-slate-300 font-medium"
              >{{ (entity.confidenceScore * 100).toFixed(0) }}%</span
            >
          </div>

          <!-- Parsed Metadata Chips -->
          @if (getMetadataEntries(entity.metadata).length > 0) {
          <div class="flex flex-wrap gap-1.5 pt-1">
            @for (entry of getMetadataEntries(entity.metadata); track entry.key) {
            <span
              class="text-[10px] px-1.5 py-0.5 rounded bg-trellis-950/80 border border-trellis-800/80 text-slate-300 font-sans"
            >
              <span class="text-slate-500">{{ entry.key }}:</span>
              {{ entry.val }}
            </span>
            }
          </div>
          }
        </div>
        } @empty {
        <p class="text-xs text-slate-500 text-center py-6 font-sans">
          No entities matching "{{ selectedCategory() }}"
        </p>
        }
      </div>
    </section>
  `,
})
export class EntityInspectorComponent {
  public state = inject(StateService);
  public selectedCategory = signal<string>("ALL");

  public categories: EntityCategory[] = [
    "SERVICE",
    "SYSTEM",
    "DATA_MODEL",
    "INFRASTRUCTURE",
    "SECURITY_POLICY",
    "API_ENDPOINT",
    "CONCEPT",
  ];

  public allEntities = computed(() => {
    return this.state.activeDocument()?.entities || [];
  });

  public filteredEntities = computed(() => {
    const list = this.allEntities();
    const cat = this.selectedCategory();
    if (cat === "ALL") return list;
    return list.filter((e) => e.category === cat);
  });

  public getCategoryCount(cat: EntityCategory): number {
    return this.allEntities().filter((e) => e.category === cat).length;
  }

  public getCategoryBadgeClass(category: EntityCategory): string {
    switch (category) {
      case "SYSTEM":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      case "SERVICE":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/30";
      case "DATA_MODEL":
        return "bg-purple-500/10 text-purple-400 border-purple-500/30";
      case "INFRASTRUCTURE":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      case "SECURITY_POLICY":
        return "bg-rose-500/10 text-rose-400 border-rose-500/30";
      case "API_ENDPOINT":
        return "bg-blue-500/10 text-blue-400 border-blue-500/30";
      case "CONCEPT":
      default:
        return "bg-slate-500/10 text-slate-300 border-slate-500/30";
    }
  }

  public getMetadataEntries(
    metadata: string | Record<string, any>
  ): { key: string; val: string }[] {
    try {
      const obj =
        typeof metadata === "string" ? JSON.parse(metadata) : metadata;
      if (!obj || typeof obj !== "object") return [];
      return Object.entries(obj).map(([key, val]) => ({
        key,
        val: typeof val === "object" ? JSON.stringify(val) : String(val),
      }));
    } catch {
      return [];
    }
  }
}
