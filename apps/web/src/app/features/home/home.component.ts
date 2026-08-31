import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideSearch,
  lucidePlus,
  lucideFileText,
  lucideSparkles,
  lucideArrowUp,
  lucideUpload,
  lucideGlobe,
  lucideLayoutGrid,
  lucideClock,
  lucideChevronRight,
  lucideLayers,
} from '@ng-icons/lucide';
import { DocumentStore } from '../../core/state/document.store.js';
import { DEMO_PRESETS, DemoPreset } from '../../core/data/demo-presets.js';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIconComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  viewProviders: [
    provideIcons({
      lucideSearch,
      lucidePlus,
      lucideFileText,
      lucideSparkles,
      lucideArrowUp,
      lucideUpload,
      lucideGlobe,
      lucideLayoutGrid,
      lucideClock,
      lucideChevronRight,
      lucideLayers,
    }),
  ],
})
export class HomeComponent {
  readonly store = inject(DocumentStore);

  readonly searchQuery = signal<string>('');
  readonly topicPrompt = signal<string>('');
  readonly isSubmitting = signal<boolean>(false);
  readonly selectedTab = signal<'my_projects' | 'examples'>('my_projects');

  readonly presets = DEMO_PRESETS;

  readonly filteredDocuments = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const docs = this.store.documents();
    if (!q) return docs;
    return docs.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        (d.summary && d.summary.toLowerCase().includes(q))
    );
  });

  readonly filteredPresets = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.presets;
    return this.presets.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.persona.toLowerCase().includes(q)
    );
  });

  async submitPrompt() {
    const prompt = this.topicPrompt().trim();
    if (!prompt || this.isSubmitting()) return;

    this.isSubmitting.set(true);
    try {
      await this.store.exploreTopic(prompt);
      this.topicPrompt.set('');
    } catch (err) {
      console.error('Failed to explore topic:', err);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.submitPrompt();
    }
  }

  selectPreset(preset: DemoPreset) {
    this.store.exploreTopic(preset.title);
  }

  openDocument(id: string) {
    this.store.openDocument(id);
  }

  triggerPdfUpload(fileInput: HTMLInputElement) {
    fileInput.click();
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const title = file.name.replace(/\.[^/.]+$/, '');
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = (e.target?.result as string) || '';
      try {
        await this.store.ingestDocument(title, content);
        this.store.navigateToCanvas();
      } catch (err) {
        console.error('File upload ingestion failed:', err);
      }
    };
    reader.readAsText(file);
  }
}
