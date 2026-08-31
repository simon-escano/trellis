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

function getCategoryIcon(cat: EntityCategory): string {
  switch (cat) {
    case 'CONCEPT':
      return '🧠';
    case 'SYSTEM':
      return '⚡';
    case 'SERVICE':
      return '⚙️';
    case 'DATA_MODEL':
      return '🗄️';
    case 'INFRASTRUCTURE':
      return '🏗️';
    case 'SECURITY_POLICY':
      return '🛡️';
    case 'API_ENDPOINT':
      return '🌐';
    default:
      return '💡';
  }
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
        bg: 'rgba(0, 245, 160, 0.12)',
        border: 'rgba(0, 245, 160, 0.4)',
        text: '#00F5A0',
        accent: '#00F5A0',
      };
    case 'SERVICE':
    case 'SYSTEM':
      return {
        bg: 'rgba(56, 189, 248, 0.12)',
        border: 'rgba(56, 189, 248, 0.4)',
        text: '#38BDF8',
        accent: '#38BDF8',
      };
    case 'DATA_MODEL':
      return {
        bg: 'rgba(251, 191, 36, 0.12)',
        border: 'rgba(251, 191, 36, 0.4)',
        text: '#FBBF24',
        accent: '#FBBF24',
      };
    case 'INFRASTRUCTURE':
      return {
        bg: 'rgba(251, 113, 133, 0.12)',
        border: 'rgba(251, 113, 133, 0.4)',
        text: '#FB7185',
        accent: '#FB7185',
      };
    case 'SECURITY_POLICY':
    case 'API_ENDPOINT':
    default:
      return {
        bg: 'rgba(192, 132, 252, 0.12)',
        border: 'rgba(192, 132, 252, 0.4)',
        text: '#C084FC',
        accent: '#C084FC',
      };
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
  return `Core ${entity.category.toLowerCase().replace('_', ' ')} node`;
}

function createNodeSvg(
  name: string,
  category: EntityCategory,
  description: string,
  isSelected = false
): string {
  const icon = getCategoryIcon(category);
  const color = getCategoryColor(category);
  const strokeColor = isSelected ? '#FFFFFF' : color.border;
  const strokeWidth = isSelected ? 2.5 : 1.2;
  const glow = isSelected
    ? `filter="drop-shadow(0 0 16px ${color.accent})"`
    : `filter="drop-shadow(0 8px 20px rgba(0,0,0,0.6))"`;

  const safeName = escapeXml(name);
  const safeDesc = escapeXml(description || 'Core concept');
  const safeCat = escapeXml(category.replace('_', ' '));

  const firstLine = truncate(safeDesc, 32);
  const secondLine =
    safeDesc.length > 32 ? truncate(safeDesc.substring(32), 34) : '';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="250" height="116" viewBox="0 0 250 116">
    <defs>
      <linearGradient id="grad-${safeName}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#121826" stop-opacity="0.96" />
        <stop offset="100%" stop-color="#090D15" stop-opacity="0.96" />
      </linearGradient>
      <linearGradient id="specular" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="rgba(255,255,255,0.25)" />
        <stop offset="50%" stop-color="rgba(255,255,255,0.05)" />
        <stop offset="100%" stop-color="rgba(255,255,255,0.2)" />
      </linearGradient>
    </defs>
    
    <!-- Card Container -->
    <rect x="3" y="3" width="244" height="110" rx="16" ry="16" fill="url(#grad-${safeName})" stroke="${strokeColor}" stroke-width="${strokeWidth}" ${glow} />
    
    <!-- Top Specular Highlight Line -->
    <path d="M 20 4 L 230 4" stroke="url(#specular)" stroke-width="1.2" stroke-linecap="round" />

    <!-- Category Pill with Icon -->
    <rect x="14" y="14" width="84" height="20" rx="10" ry="10" fill="${color.bg}" stroke="${color.border}" stroke-width="0.8" />
    <text x="21" y="28" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11">${icon}</text>
    <text x="37" y="28" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="8.5" font-weight="700" fill="${color.text}" letter-spacing="0.4">${safeCat}</text>

    <!-- Title -->
    <text x="14" y="55" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" fill="#FFFFFF">
      ${truncate(safeName, 26)}
    </text>

    <!-- Description Lines -->
    <text x="14" y="76" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10.5" fill="rgba(255,255,255,0.65)">
      ${firstLine}
    </text>
    <text x="14" y="93" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10.5" fill="rgba(255,255,255,0.4)">
      ${secondLine}
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
        size: 55,
        borderWidth: 0,
        shadow: false,
      },
      edges: {
        width: 1.5,
        color: {
          color: 'rgba(255, 255, 255, 0.2)',
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
          color: '#94A3B8',
          size: 10,
          face: 'JetBrains Mono, monospace',
          strokeWidth: 3,
          strokeColor: '#07090E',
          align: 'middle',
        },
      },
      physics: {
        enabled: true,
        solver: 'forceAtlas2Based',
        forceAtlas2Based: {
          gravitationalConstant: -70,
          centralGravity: 0.008,
          springLength: 170,
          springConstant: 0.05,
          damping: 0.6,
          avoidOverlap: 0.8,
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
        size: isSelected ? 62 : 55,
      };
    });

    const rawEdges: Edge[] = relationships.map((rel) => ({
      id: rel.id,
      from: rel.sourceEntity?.id || (rel as any).source_entity_id,
      to: rel.targetEntity?.id || (rel as any).target_entity_id,
      label: rel.relationType,
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
