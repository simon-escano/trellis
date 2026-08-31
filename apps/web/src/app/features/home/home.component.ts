import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
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
  lucideSun,
  lucideMoon,
  lucideMenu,
  lucideX,
  lucideUser,
  lucideLogIn,
  lucideLogOut,
  lucideShieldCheck,
} from '@ng-icons/lucide';
import { DocumentStore } from '../../core/state/document.store.js';
import { AuthStore } from '../../core/state/auth.store.js';
import { ThemeService } from '../../core/services/theme.service.js';
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
      lucideSun,
      lucideMoon,
      lucideMenu,
      lucideX,
      lucideUser,
      lucideLogIn,
      lucideLogOut,
      lucideShieldCheck,
    }),
  ],
})
export class HomeComponent implements OnInit, OnDestroy {
  @ViewChild('dotsCanvas', { static: true })
  dotsCanvasRef!: ElementRef<HTMLCanvasElement>;

  readonly store = inject(DocumentStore);
  readonly authStore = inject(AuthStore);
  readonly themeService = inject(ThemeService);

  readonly searchQuery = signal<string>('');
  readonly topicPrompt = signal<string>('');
  readonly isSubmitting = signal<boolean>(false);
  readonly selectedTab = signal<'my_topics' | 'examples'>('my_topics');
  readonly isMobileSidebarOpen = signal<boolean>(false);
  readonly isUserMenuOpen = signal<boolean>(false);

  toggleUserMenu() {
    this.isUserMenuOpen.update((v) => !v);
  }

  closeUserMenu() {
    this.isUserMenuOpen.set(false);
  }

  openAuthModal() {
    this.closeUserMenu();
    this.authStore.openAuthModal();
  }

  logout() {
    this.closeUserMenu();
    this.authStore.logout();
    this.store.loadInitialData();
  }

  // Maximum character limit evaluated based on LLM performance (~1,000 tokens)
  readonly maxChars = 4000;
  readonly promptLength = computed(() => this.topicPrompt().length);
  readonly charProgress = computed(() => Math.min(100, (this.promptLength() / this.maxChars) * 100));
  readonly isNearLimit = computed(() => this.promptLength() >= this.maxChars * 0.8);
  readonly isOverLimit = computed(() => this.promptLength() > this.maxChars);
  readonly remainingChars = computed(() => this.maxChars - this.promptLength());

  readonly strokeDashoffset = computed(() => {
    const circumference = 56.5487; // 2 * pi * 9
    const progress = Math.min(100, Math.max(0, this.charProgress()));
    return circumference - (circumference * progress) / 100;
  });

  readonly spinnerColor = computed(() => {
    const len = this.promptLength();
    if (len > this.maxChars) return '#EF4444';
    if (len >= this.maxChars * 0.95) return '#F43F5E';
    if (len >= this.maxChars * 0.8) return '#F59E0B';
    return '#10B981';
  });

  readonly presets = DEMO_PRESETS;

  // Dot field hover tracking (exact same as CanvasComponent)
  private mouseX = -1000;
  private mouseY = -1000;
  private isMouseOver = false;
  private resizeListener?: () => void;
  private mouseMoveListener?: (e: MouseEvent) => void;
  private mouseLeaveListener?: () => void;

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

  constructor() {
    effect(() => {
      // Re-render dots immediately upon theme change
      this.themeService.theme();
      this.drawDots();
    });
  }

  ngOnInit() {
    this.initDotsBackground();
  }

  ngOnDestroy() {
    if (this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
    }
    if (this.mouseMoveListener) {
      window.removeEventListener('mousemove', this.mouseMoveListener);
    }
    if (this.mouseLeaveListener) {
      window.removeEventListener('mouseleave', this.mouseLeaveListener);
    }
  }

  private drawDots() {
    const canvas = this.dotsCanvasRef?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const isDark = this.themeService.isDark();
    const dotBaseColor = isDark ? '255, 255, 255' : '15, 23, 42';
    const spacing = 22;
    const proximity = 110;

    const cols = Math.ceil(canvas.width / spacing) + 1;
    const rows = Math.ceil(canvas.height / spacing) + 1;

    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const dotX = c * spacing;
        const dotY = r * spacing;

        let radius = 1.0;
        let alpha = isDark ? 0.08 : 0.07;

        if (this.isMouseOver) {
          const dist = Math.hypot(this.mouseX - dotX, this.mouseY - dotY);
          if (dist < proximity) {
            const factor = 1 - dist / proximity;
            alpha = (isDark ? 0.08 : 0.07) + factor * 0.6;
            radius = 1.0 + factor * 1.3;
          }
        }

        ctx.beginPath();
        ctx.arc(dotX, dotY, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${dotBaseColor}, ${alpha})`;
        ctx.fill();
      }
    }
  }

  private initDotsBackground() {
    const canvas = this.dotsCanvasRef.nativeElement;
    if (!canvas) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      this.drawDots();
    };

    this.resizeListener = resize;
    window.addEventListener('resize', resize);

    this.mouseMoveListener = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      this.mouseX = e.clientX - rect.left;
      this.mouseY = e.clientY - rect.top;
      this.isMouseOver = true;
      requestAnimationFrame(() => this.drawDots());
    };

    this.mouseLeaveListener = () => {
      this.isMouseOver = false;
      this.mouseX = -1000;
      this.mouseY = -1000;
      requestAnimationFrame(() => this.drawDots());
    };

    window.addEventListener('mousemove', this.mouseMoveListener);
    window.addEventListener('mouseleave', this.mouseLeaveListener);

    resize();
  }

  toggleMobileSidebar() {
    this.isMobileSidebarOpen.update((v) => !v);
  }

  closeMobileSidebar() {
    this.isMobileSidebarOpen.set(false);
  }

  async submitPrompt() {
    const prompt = this.topicPrompt().trim();
    if (!prompt || this.isSubmitting() || this.isOverLimit()) return;

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
      if (!this.isOverLimit()) {
        this.submitPrompt();
      }
    }
  }

  selectPreset(preset: DemoPreset) {
    this.closeMobileSidebar();
    this.store.exploreTopic(preset.title);
  }

  openDocument(id: string) {
    this.closeMobileSidebar();
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
    input.value = '';

    this.isSubmitting.set(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      let content = (e.target?.result as string) || '';
      // If raw file content has unprintable binary header or is short, format it cleanly
      if (!content.trim() || content.startsWith('%PDF')) {
        content = `# ${title}\nDocument uploaded: ${file.name}\nSize: ${(file.size / 1024).toFixed(1)} KB\n\nContent extraction for ${title} synthesizing primary concepts and domain relationships.`;
      }
      try {
        const doc = await this.store.ingestDocument(title, content);
        this.store.openDocument(doc.id);
      } catch (err) {
        console.error('File upload ingestion failed:', err);
      } finally {
        this.isSubmitting.set(false);
      }
    };
    reader.onerror = () => {
      this.isSubmitting.set(false);
    };
    reader.readAsText(file);
  }
}
