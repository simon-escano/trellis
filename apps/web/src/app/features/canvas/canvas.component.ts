import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideMenu,
  lucideChevronLeft,
  lucideFileText,
  lucideShare2,
  lucideDownload,
  lucidePlus,
  lucideArrowUp,
  lucideSparkles,
  lucideLayers,
  lucideRotateCw,
  lucideCopy,
  lucideTrash2,
} from '@ng-icons/lucide';
import { DataSet } from 'vis-data';
import { Network, Options, Node, Edge } from 'vis-network';
import { DocumentStore } from '../../core/state/document.store.js';
import {
  Entity,
  EntityCategory,
  EntityRelationship,
} from '../../core/models/document.model.js';
import { InspectorComponent } from '../inspector/inspector.component.js';

function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case "'":
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return c;
    }
  });
}

function truncate(str: string, len: number): string {
  if (!str) return '';
  return str.length > len ? str.substring(0, len - 1) + '…' : str;
}

function formatRelationType(rel: string): string {
  if (!rel) return '';
  return rel
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function wrapText(
  text: string,
  maxCharsPerLine = 34,
  maxLines = 4
): string[] {
  if (!text) return [];
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= maxCharsPerLine) {
      currentLine = (currentLine + ' ' + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
      if (lines.length >= maxLines) break;
    }
  }
  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }

  // Clean trailing dangling conjunctions from final line
  if (lines.length > 0) {
    let last = lines[lines.length - 1];
    last = last.replace(/\s+(and|or|for|to|with|the|in|at|of|by)\s*$/i, '');
    if (!last.endsWith('.')) {
      last = last.replace(/[,;:]+$/, '') + '.';
    }
    lines[lines.length - 1] = last;
  }

  return lines;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  if (typeof (ctx as any).roundRect === 'function') {
    (ctx as any).roundRect(x, y, width, height, radius);
  } else {
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}

interface NodeDimensions {
  width: number;
  height: number;
  size: number;
  descLines: string[];
  pillWidth: number;
}

function computeNodeDimensions(
  name: string,
  category: EntityCategory,
  description: string
): NodeDimensions {
  const safeCat = category.replace(/_/g, ' ');
  const pillWidth = Math.max(86, safeCat.length * 6.8 + 40);

  const titleLength = name.length;
  const descLength = description ? description.length : 0;

  let width = 260;
  if (titleLength > 28 || descLength > 120) {
    width = 295;
  } else if (titleLength < 16 && descLength < 60) {
    width = 235;
  }

  const maxCharsPerLine = Math.floor((width - 28) / 7.2);
  const maxLines = descLength > 100 ? 4 : descLength > 50 ? 3 : 2;
  const descLines = wrapText(description, maxCharsPerLine, maxLines);

  const height = 66 + descLines.length * 17 + 14;
  const size = Math.round(height * 0.46);

  return { width, height, size, descLines, pillWidth };
}

function getCategoryColor(cat: EntityCategory): {
  bg: string;
  border: string;
  text: string;
  accent: string;
} {
  switch (cat) {
    case 'CONCEPT':
      return {
        bg: 'rgba(255, 255, 255, 0.07)',
        border: 'rgba(255, 255, 255, 0.18)',
        text: '#F1F5F9',
        accent: '#00F5A0',
      };
    case 'SERVICE':
    case 'SYSTEM':
      return {
        bg: 'rgba(148, 163, 184, 0.08)',
        border: 'rgba(148, 163, 184, 0.22)',
        text: '#CBD5E1',
        accent: '#00F5A0',
      };
    case 'DATA_MODEL':
      return {
        bg: 'rgba(203, 213, 225, 0.07)',
        border: 'rgba(203, 213, 225, 0.18)',
        text: '#E2E8F0',
        accent: '#00F5A0',
      };
    case 'INFRASTRUCTURE':
      return {
        bg: 'rgba(148, 163, 184, 0.07)',
        border: 'rgba(148, 163, 184, 0.18)',
        text: '#94A3B8',
        accent: '#00F5A0',
      };
    case 'SECURITY_POLICY':
    case 'API_ENDPOINT':
    default:
      return {
        bg: 'rgba(226, 232, 240, 0.06)',
        border: 'rgba(226, 232, 240, 0.16)',
        text: '#CBD5E1',
        accent: '#00F5A0',
      };
  }
}

function getCategoryIconSvgGeometry(
  cat: EntityCategory,
  x: number,
  y: number,
  color: string
): string {
  switch (cat) {
    case 'CONCEPT':
      return `<g transform="translate(${x}, ${y}) scale(0.65)">
        <path d="M12 2a4 4 0 0 0-4 4c0 1.5.8 2.8 2 3.5V11a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V9.5c1.2-.7 2-2 2-3.5a4 4 0 0 0-4-4z" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M9 18h6m-4 3h2" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>
      </g>`;
    case 'SYSTEM':
      return `<g transform="translate(${x}, ${y}) scale(0.65)">
        <rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="${color}" stroke-width="2.5"/>
        <rect x="9" y="9" width="6" height="6" fill="none" stroke="${color}" stroke-width="2"/>
        <path d="M15 2v2m-6-2v2m6 16v2m-6-2v2M2 15h2M2 9h2m16 6h2m-2-6h2" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>
      </g>`;
    case 'SERVICE':
      return `<g transform="translate(${x}, ${y}) scale(0.65)">
        <circle cx="12" cy="12" r="3" fill="none" stroke="${color}" stroke-width="2.5"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" fill="none" stroke="${color}" stroke-width="2"/>
      </g>`;
    case 'DATA_MODEL':
      return `<g transform="translate(${x}, ${y}) scale(0.65)">
        <ellipse cx="12" cy="5" rx="9" ry="3" fill="none" stroke="${color}" stroke-width="2.5"/>
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" fill="none" stroke="${color}" stroke-width="2.5"/>
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" fill="none" stroke="${color}" stroke-width="2.5"/>
      </g>`;
    case 'INFRASTRUCTURE':
      return `<g transform="translate(${x}, ${y}) scale(0.65)">
        <rect x="2" y="2" width="20" height="8" rx="2" fill="none" stroke="${color}" stroke-width="2.5"/>
        <rect x="2" y="14" width="20" height="8" rx="2" fill="none" stroke="${color}" stroke-width="2.5"/>
        <line x1="6" y1="6" x2="6.01" y2="6" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
        <line x1="6" y1="18" x2="6.01" y2="18" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
      </g>`;
    case 'SECURITY_POLICY':
      return `<g transform="translate(${x}, ${y}) scale(0.65)">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round"/>
      </g>`;
    case 'API_ENDPOINT':
    default:
      return `<g transform="translate(${x}, ${y}) scale(0.65)">
        <circle cx="12" cy="12" r="10" fill="none" stroke="${color}" stroke-width="2.5"/>
        <line x1="2" y1="12" x2="22" y2="12" stroke="${color}" stroke-width="2.5"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" fill="none" stroke="${color}" stroke-width="2.5"/>
      </g>`;
  }
}

function extractEntityDescription(entity: Entity): string {
  if (entity.metadata) {
    if (typeof entity.metadata === 'object') {
      const meta = entity.metadata as Record<string, any>;
      if (meta['description']) return String(meta['description']);
      if (meta['summary']) return String(meta['summary']);
      if (meta['role']) return String(meta['role']);
      if (meta['purpose']) return String(meta['purpose']);
      const entries = Object.entries(meta);
      if (entries.length > 0) {
        return `${entries[0][0]}: ${entries[0][1]}`;
      }
    } else if (typeof entity.metadata === 'string') {
      try {
        const parsed = JSON.parse(entity.metadata);
        if (parsed.description) return String(parsed.description);
        if (parsed.summary) return String(parsed.summary);
      } catch {
        return entity.metadata;
      }
    }
  }
  return `Core ${entity.category.toLowerCase().replace(/_/g, ' ')} node synthesizing key domain relationships.`;
}

function createNodeSvg(
  name: string,
  category: EntityCategory,
  description: string,
  dims: NodeDimensions,
  isSelected = false
): string {
  const color = getCategoryColor(category);
  const strokeColor = isSelected ? '#00F5A0' : 'rgba(255, 255, 255, 0.12)';
  const strokeWidth = isSelected ? 2.5 : 1.2;

  const safeName = escapeXml(name);
  const safeCat = escapeXml(category.replace(/_/g, ' '));

  const iconGeometry = getCategoryIconSvgGeometry(
    category,
    20,
    16.5,
    color.text
  );

  const descTextElements = dims.descLines
    .map(
      (line, idx) =>
        `<text x="14" y="${78 + idx * 17}" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif" font-size="10.5" fill="${idx === dims.descLines.length - 1 ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.78)'}">${escapeXml(line)}</text>`
    )
    .join('\n');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${dims.width}" height="${dims.height}" viewBox="0 0 ${dims.width} ${dims.height}">
    <defs>
      <linearGradient id="cardGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#141C2E" />
        <stop offset="100%" stop-color="#080C14" />
      </linearGradient>
      <linearGradient id="specGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="rgba(255,255,255,0.25)" />
        <stop offset="50%" stop-color="rgba(255,255,255,0.05)" />
        <stop offset="100%" stop-color="rgba(255,255,255,0.2)" />
      </linearGradient>
    </defs>
    
    <!-- Clean, Robust Rounded Card Background -->
    <rect x="2" y="2" width="${dims.width - 4}" height="${dims.height - 4}" rx="18" ry="18" fill="url(#cardGrad)" stroke="${strokeColor}" stroke-width="${strokeWidth}" />
    
    <!-- Top Specular Highlight Line -->
    <path d="M 22 3.5 L ${dims.width - 22} 3.5" stroke="url(#specGrad)" stroke-width="1.2" stroke-linecap="round" />

    <!-- Responsive Auto-Sized Category Pill -->
    <rect x="14" y="14" width="${dims.pillWidth}" height="22" rx="11" ry="11" fill="${color.bg}" stroke="${color.border}" stroke-width="0.8" />
    
    <!-- Vector Category Icon -->
    ${iconGeometry}
    
    <!-- Category Label with generous spacing from icon -->
    <text x="42" y="29" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif" font-size="9.5" font-weight="700" fill="${color.text}" letter-spacing="0.5">
      ${safeCat}
    </text>

    <!-- Bold Concept Title -->
    <text x="14" y="58" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif" font-size="13.5" font-weight="700" fill="#FFFFFF">
      ${truncate(safeName, Math.floor(dims.width / 9))}
    </text>

    <!-- Substantive Multiline Description Lines -->
    ${descTextElements}
  </svg>`;

  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

@Component({
  selector: 'app-canvas',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIconComponent, InspectorComponent],
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.css'],
  viewProviders: [
    provideIcons({
      lucideMenu,
      lucideChevronLeft,
      lucideFileText,
      lucideShare2,
      lucideDownload,
      lucidePlus,
      lucideArrowUp,
      lucideSparkles,
      lucideLayers,
      lucideRotateCw,
      lucideCopy,
      lucideTrash2,
    }),
  ],
})
export class CanvasComponent implements OnInit, OnDestroy {
  @ViewChild('networkContainer', { static: true })
  networkContainer!: ElementRef<HTMLDivElement>;

  @ViewChild('dotsCanvas', { static: true })
  dotsCanvasRef!: ElementRef<HTMLCanvasElement>;

  readonly store = inject(DocumentStore);

  private network: Network | null = null;
  private nodesDataSet = new DataSet<Node>();
  private edgesDataSet = new DataSet<Edge>();
  private activeRelationships: Array<{
    id: string;
    sourceId: string;
    targetId: string;
    label: string;
  }> = [];

  readonly topicPrompt = signal<string>('');
  readonly isPromptSubmitting = signal<boolean>(false);
  readonly isMenuOpen = signal<boolean>(false);

  // Dot field hover tracking (lighter dots under cursor)
  private mouseX = -1000;
  private mouseY = -1000;
  private isMouseOver = false;

  readonly isPhysicsEnabled = signal<boolean>(true);
  readonly selectedEntity = this.store.selectedEntity;

  constructor() {
    effect(() => {
      const activeDoc = this.store.activeDocument();
      const selectedEnt = this.store.selectedEntity();
      if (activeDoc) {
        this.renderGraph(
          activeDoc.entities || [],
          activeDoc.relationships || [],
          selectedEnt?.id
        );
      } else {
        this.clearGraph();
      }
    });
  }

  ngOnInit() {
    this.initVisNetwork();
    this.initDotsBackground();
  }

  ngOnDestroy() {
    if (this.network) {
      this.network.destroy();
      this.network = null;
    }
  }

  toggleMenu() {
    this.isMenuOpen.update((v) => !v);
  }

  closeMenu() {
    this.isMenuOpen.set(false);
  }

  goHome() {
    this.closeMenu();
    this.store.navigateToHome();
  }

  shareTopic() {
    this.closeMenu();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
    }
  }

  async duplicateTopic() {
    this.closeMenu();
    await this.store.duplicateActiveDocument();
  }

  async deleteTopic() {
    this.closeMenu();
    const doc = this.store.activeDocument();
    if (doc && confirm(`Delete "${doc.title}"?`)) {
      await this.store.deleteDocument(doc.id);
    }
  }

  regenerateMap() {
    const doc = this.store.activeDocument();
    if (doc) {
      this.store.reprocessDocument(doc.id);
    }
  }

  private initDotsBackground() {
    const canvas = this.dotsCanvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      drawDots();
    };

    window.addEventListener('resize', resize);

    const parent = this.networkContainer.nativeElement;

    const spacing = 22;
    const proximity = 110;

    const drawDots = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cols = Math.ceil(canvas.width / spacing) + 1;
      const rows = Math.ceil(canvas.height / spacing) + 1;

      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          const dotX = c * spacing;
          const dotY = r * spacing;

          let radius = 1.0;
          let alpha = 0.08;

          if (this.isMouseOver) {
            const dist = Math.hypot(this.mouseX - dotX, this.mouseY - dotY);
            if (dist < proximity) {
              const factor = 1 - dist / proximity;
              alpha = 0.08 + factor * 0.65;
              radius = 1.0 + factor * 1.3;
            }
          }

          ctx.beginPath();
          ctx.arc(dotX, dotY, radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.fill();
        }
      }
    };

    parent.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      this.mouseX = e.clientX - rect.left;
      this.mouseY = e.clientY - rect.top;
      this.isMouseOver = true;
      requestAnimationFrame(drawDots);
    });

    parent.addEventListener('mouseleave', () => {
      this.isMouseOver = false;
      this.mouseX = -1000;
      this.mouseY = -1000;
      requestAnimationFrame(drawDots);
    });

    resize();
  }

  async submitCanvasPrompt() {
    const prompt = this.topicPrompt().trim();
    if (!prompt || this.isPromptSubmitting()) return;

    this.isPromptSubmitting.set(true);
    try {
      await this.store.exploreTopic(prompt);
      this.topicPrompt.set('');
    } catch (err) {
      console.error('Failed to submit prompt:', err);
    } finally {
      this.isPromptSubmitting.set(false);
    }
  }

  onPromptKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.submitCanvasPrompt();
    }
  }

  private initVisNetwork() {
    const data = {
      nodes: this.nodesDataSet,
      edges: this.edgesDataSet,
    };

    const options: Options = {
      nodes: {
        shape: 'image',
        borderWidth: 0,
        borderWidthSelected: 0,
        shapeProperties: {
          useBorderWithImage: false,
          useImageSize: false,
          interpolation: true,
        },
        color: {
          background: 'rgba(0,0,0,0)',
          border: 'rgba(0,0,0,0)',
          highlight: {
            background: 'rgba(0,0,0,0)',
            border: 'rgba(0,0,0,0)',
          },
          hover: {
            background: 'rgba(0,0,0,0)',
            border: 'rgba(0,0,0,0)',
          },
        },
        shadow: false,
      },
      edges: {
        width: 1.8,
        color: {
          color: 'rgba(255, 255, 255, 0.22)',
          highlight: '#00F5A0',
          hover: '#38BDF8',
        },
        arrows: {
          to: {
            enabled: true,
            scaleFactor: 0.75,
          },
        },
        smooth: {
          enabled: true,
          type: 'cubicBezier',
          roundness: 0.5,
        },
      },
      physics: {
        enabled: true,
        solver: 'forceAtlas2Based',
        forceAtlas2Based: {
          gravitationalConstant: -160,
          centralGravity: 0.006,
          springLength: 230,
          springConstant: 0.04,
          damping: 0.75,
          avoidOverlap: 0.9,
        },
        stabilization: {
          iterations: 180,
          updateInterval: 25,
        },
      },
      interaction: {
        hover: true,
        tooltipDelay: 200,
        zoomView: true,
        dragView: true,
      },
    };

    this.network = new Network(
      this.networkContainer.nativeElement,
      data,
      options
    );

    // Custom Canvas Render: Fully Rounded Frosted Pills with Generous Padding for Connection Labels
    this.network.on('afterDrawing', (ctx: CanvasRenderingContext2D) => {
      if (!this.network || this.activeRelationships.length === 0) return;

      ctx.save();
      ctx.font =
        '600 11px -apple-system, BlinkMacSystemFont, "SF Pro Text", "DM Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (const rel of this.activeRelationships) {
        const posSource = this.network.getPosition(rel.sourceId);
        const posTarget = this.network.getPosition(rel.targetId);

        if (!posSource || !posTarget) continue;

        const midX = (posSource.x + posTarget.x) / 2;
        const midY = (posSource.y + posTarget.y) / 2;

        const textMetrics = ctx.measureText(rel.label);
        const textWidth = textMetrics.width;

        const pillWidth = Math.max(textWidth + 24, 48);
        const pillHeight = 22;
        const pillRadius = 11;
        const pillX = midX - pillWidth / 2;
        const pillY = midY - pillHeight / 2;

        ctx.beginPath();
        drawRoundedRect(ctx, pillX, pillY, pillWidth, pillHeight, pillRadius);
        ctx.fillStyle = 'rgba(13, 20, 32, 0.94)';
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
        ctx.stroke();

        ctx.fillStyle = '#F1F5F9';
        ctx.fillText(rel.label, midX, midY);
      }

      ctx.restore();
    });

    this.network.on('selectNode', (params) => {
      if (params.nodes && params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        const activeDoc = this.store.activeDocument();
        const found = activeDoc?.entities?.find((e) => e.id === nodeId);
        if (found) {
          this.store.selectEntity(found);
        }
      }
    });

    this.network.on('deselectNode', () => {
      this.store.selectEntity(null);
    });
  }

  private renderGraph(
    entities: Entity[],
    relationships: EntityRelationship[],
    selectedEntityId?: string
  ) {
    const rawNodes: Node[] = entities.map((ent) => {
      const isSelected = ent.id === selectedEntityId;
      const desc = extractEntityDescription(ent);
      const dims = computeNodeDimensions(ent.name, ent.category, desc);
      const imageUri = createNodeSvg(
        ent.name,
        ent.category,
        desc,
        dims,
        isSelected
      );

      return {
        id: ent.id,
        image: imageUri,
        shape: 'image',
        size: isSelected ? Math.round(dims.size * 1.08) : dims.size,
      };
    });

    this.activeRelationships = relationships.map((rel) => ({
      id: rel.id,
      sourceId: rel.sourceEntity?.id || (rel as any).source_entity_id,
      targetId: rel.targetEntity?.id || (rel as any).target_entity_id,
      label: formatRelationType(rel.relationType),
    }));

    const rawEdges: Edge[] = relationships.map((rel) => ({
      id: rel.id,
      from: rel.sourceEntity?.id || (rel as any).source_entity_id,
      to: rel.targetEntity?.id || (rel as any).target_entity_id,
    }));

    this.nodesDataSet.clear();
    this.edgesDataSet.clear();

    this.nodesDataSet.add(rawNodes);
    this.edgesDataSet.add(rawEdges);

    if (this.network && entities.length > 0) {
      setTimeout(() => {
        this.network?.fit({
          animation: {
            duration: 800,
            easingFunction: 'easeInOutQuad',
          },
        });
      }, 100);
    }
  }

  private clearGraph() {
    this.activeRelationships = [];
    this.nodesDataSet.clear();
    this.edgesDataSet.clear();
  }

  zoomIn() {
    if (!this.network) return;
    const scale = this.network.getScale();
    this.network.moveTo({ scale: scale * 1.25, animation: true });
  }

  zoomOut() {
    if (!this.network) return;
    const scale = this.network.getScale();
    this.network.moveTo({ scale: scale * 0.8, animation: true });
  }

  fit() {
    if (!this.network) return;
    this.network.fit({
      animation: { duration: 600, easingFunction: 'easeInOutQuad' },
    });
  }

  togglePhysics() {
    this.isPhysicsEnabled.update((v) => !v);
    if (this.network) {
      this.network.setOptions({
        physics: { enabled: this.isPhysicsEnabled() },
      });
    }
  }
}
