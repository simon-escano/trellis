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
import { DataSet } from 'vis-data';
import { Network, Options, Node, Edge } from 'vis-network';
import { DocumentStore } from '../../core/state/document.store.js';
import {
  Entity,
  EntityCategory,
  EntityRelationship,
} from '../../core/models/document.model.js';

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
  maxLines = 3
): string[] {
  if (!text) return [];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= maxCharsPerLine) {
      currentLine = (currentLine + ' ' + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
      if (lines.length >= maxLines - 1) break;
    }
  }
  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }
  return lines;
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
        bg: 'rgba(0, 245, 160, 0.14)',
        border: 'rgba(0, 245, 160, 0.45)',
        text: '#00F5A0',
        accent: '#00F5A0',
      };
    case 'SERVICE':
    case 'SYSTEM':
      return {
        bg: 'rgba(56, 189, 248, 0.14)',
        border: 'rgba(56, 189, 248, 0.45)',
        text: '#38BDF8',
        accent: '#38BDF8',
      };
    case 'DATA_MODEL':
      return {
        bg: 'rgba(251, 191, 36, 0.14)',
        border: 'rgba(251, 191, 36, 0.45)',
        text: '#FBBF24',
        accent: '#FBBF24',
      };
    case 'INFRASTRUCTURE':
      return {
        bg: 'rgba(251, 113, 133, 0.14)',
        border: 'rgba(251, 113, 133, 0.45)',
        text: '#FB7185',
        accent: '#FB7185',
      };
    case 'SECURITY_POLICY':
    case 'API_ENDPOINT':
    default:
      return {
        bg: 'rgba(192, 132, 252, 0.14)',
        border: 'rgba(192, 132, 252, 0.45)',
        text: '#C084FC',
        accent: '#C084FC',
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
  isSelected = false
): string {
  const color = getCategoryColor(category);
  const strokeColor = isSelected ? '#FFFFFF' : color.border;
  const strokeWidth = isSelected ? 2.5 : 1.2;
  const glow = isSelected
    ? `filter="drop-shadow(0 0 20px ${color.accent})"`
    : `filter="drop-shadow(0 10px 25px rgba(0,0,0,0.65))"`;

  const safeName = escapeXml(name);
  const safeCat = escapeXml(category.replace(/_/g, ' '));
  const descLines = wrapText(description, 36, 3);

  // Calculate dynamic responsive pill width with generous breathing room
  const pillWidth = Math.max(86, safeCat.length * 6.8 + 40);

  const iconGeometry = getCategoryIconSvgGeometry(category, 20, 16.5, color.text);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="270" height="135" viewBox="0 0 270 135">
    <defs>
      <linearGradient id="cardGrad-${safeName.replace(/\W/g, '')}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#141C2C" stop-opacity="0.97" />
        <stop offset="100%" stop-color="#080C14" stop-opacity="0.97" />
      </linearGradient>
      <linearGradient id="specularGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="rgba(255,255,255,0.3)" />
        <stop offset="50%" stop-color="rgba(255,255,255,0.05)" />
        <stop offset="100%" stop-color="rgba(255,255,255,0.25)" />
      </linearGradient>
    </defs>
    
    <!-- Outer Card Background -->
    <rect x="2" y="2" width="266" height="131" rx="16" ry="16" fill="url(#cardGrad-${safeName.replace(/\W/g, '')})" stroke="${strokeColor}" stroke-width="${strokeWidth}" ${glow} />
    
    <!-- Top Specular Highlight Line -->
    <path d="M 22 3.5 L 248 3.5" stroke="url(#specularGrad)" stroke-width="1.2" stroke-linecap="round" />

    <!-- Responsive Auto-Sized Category Pill -->
    <rect x="14" y="14" width="${pillWidth}" height="22" rx="11" ry="11" fill="${color.bg}" stroke="${color.border}" stroke-width="0.8" />
    
    <!-- Vector Category Icon -->
    ${iconGeometry}
    
    <!-- Category Label with generous spacing from icon -->
    <text x="42" y="29" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif" font-size="9.5" font-weight="700" fill="${color.text}" letter-spacing="0.5">
      ${safeCat}
    </text>

    <!-- Bold Concept Title -->
    <text x="14" y="58" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif" font-size="13.5" font-weight="700" fill="#FFFFFF">
      ${truncate(safeName, 26)}
    </text>

    <!-- Substantive Multiline Description Lines -->
    <text x="14" y="78" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif" font-size="10.5" fill="rgba(255,255,255,0.72)">
      ${escapeXml(descLines[0] || '')}
    </text>
    <text x="14" y="95" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif" font-size="10.5" fill="rgba(255,255,255,0.72)">
      ${escapeXml(descLines[1] || '')}
    </text>
    <text x="14" y="112" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif" font-size="10.5" fill="rgba(255,255,255,0.48)">
      ${escapeXml(descLines[2] || '')}
    </text>
  </svg>`;

  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

@Component({
  selector: 'app-canvas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.css'],
})
export class CanvasComponent implements OnInit, OnDestroy {
  @ViewChild('networkContainer', { static: true })
  networkContainer!: ElementRef<HTMLDivElement>;

  readonly store = inject(DocumentStore);

  private network: Network | null = null;
  private nodesDataSet = new DataSet<Node>();
  private edgesDataSet = new DataSet<Edge>();

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
  }

  ngOnDestroy() {
    if (this.network) {
      this.network.destroy();
      this.network = null;
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
        size: 65,
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
        width: 1.5,
        color: {
          color: 'rgba(255, 255, 255, 0.22)',
          highlight: '#00F5A0',
          hover: '#38BDF8',
        },
        arrows: {
          to: {
            enabled: true,
            scaleFactor: 0.7,
          },
        },
        smooth: {
          enabled: true,
          type: 'cubicBezier',
          roundness: 0.5,
        },
        font: {
          color: '#E2E8F0',
          size: 11,
          face: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "DM Sans", sans-serif',
          strokeWidth: 0,
          strokeColor: 'transparent',
          background: 'rgba(15, 23, 42, 0.92)',
          align: 'horizontal',
        },
      },
      physics: {
        enabled: true,
        solver: 'forceAtlas2Based',
        forceAtlas2Based: {
          gravitationalConstant: -80,
          centralGravity: 0.008,
          springLength: 190,
          springConstant: 0.045,
          damping: 0.6,
          avoidOverlap: 0.85,
        },
        stabilization: {
          iterations: 120,
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
      const imageUri = createNodeSvg(ent.name, ent.category, desc, isSelected);

      return {
        id: ent.id,
        image: imageUri,
        shape: 'image',
        size: isSelected ? 72 : 65,
      };
    });

    const rawEdges: Edge[] = relationships.map((rel) => ({
      id: rel.id,
      from: rel.sourceEntity?.id || (rel as any).source_entity_id,
      to: rel.targetEntity?.id || (rel as any).target_entity_id,
      label: formatRelationType(rel.relationType),
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
