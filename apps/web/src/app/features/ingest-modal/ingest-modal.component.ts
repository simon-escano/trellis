import {
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideFlaskConical,
  lucideLandmark,
  lucideCpu,
  lucidePlus,
  lucideX,
  lucideSparkles,
} from '@ng-icons/lucide';
import { DocumentStore } from '../../core/state/document.store.js';
import { DEMO_PRESETS, DemoPreset } from '../../core/data/demo-presets.js';

@Component({
  selector: 'app-ingest-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIconComponent],
  providers: [
    provideIcons({
      lucideFlaskConical,
      lucideLandmark,
      lucideCpu,
      lucidePlus,
      lucideX,
      lucideSparkles,
    }),
  ],
  templateUrl: './ingest-modal.component.html',
  styleUrls: ['./ingest-modal.component.css'],
})
export class IngestModalComponent {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();

  readonly store = inject(DocumentStore);
  readonly presets = DEMO_PRESETS;

  title = '';
  rawContent = '';
  selectedPresetId = signal<string | null>(null);

  selectPreset(preset: DemoPreset) {
    this.selectedPresetId.set(preset.id);
    this.title = preset.title;
    this.rawContent = preset.rawContent;
  }

  onClose() {
    this.close.emit();
  }

  async onSubmit() {
    if (
      !this.title.trim() ||
      !this.rawContent.trim() ||
      this.store.isIngesting()
    ) {
      return;
    }

    try {
      await this.store.ingestDocument(
        this.title.trim(),
        this.rawContent.trim()
      );
      this.title = '';
      this.rawContent = '';
      this.selectedPresetId.set(null);
      this.close.emit();
    } catch {
      // Error handled inside store
    }
  }
}
