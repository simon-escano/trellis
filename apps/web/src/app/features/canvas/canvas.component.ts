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

function getCategorySvgIcon(cat: EntityCategory): string {
  switch (cat) {
    case 'CONCEPT':
      return `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#00F5A0" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a4 4 0 0 0-4 4c0 1.5.8 2.8 2 3.5V11a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V9.5c1.2-.7 2-2 2-3.5a4 4 0 0 0-4-4z"/><path d="M9 18h6m-4 3h2"/></svg>`;
    case 'SYSTEM':
      return `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M15 2v2m-6-2v2m6 16v2m-6-2v2M2 15h2M2 9h2m16 6h2m-2-6h2"/></svg>`;
    case 'SERVICE':
      return `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;
    case 'DATA_MODEL':
      return `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>`;
    case 'INFRASTRUCTURE':
      return `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#FB7185" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>`;
    case 'SECURITY_POLICY':
      return `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#C084FC" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;
    case 'API_ENDPOINT':
    default:
      return `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#C084FC" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`;
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
  return `Core ${entity.category.toLowerCase().replace(/_/g, ' ')} node synthesizing key domain relationships.`;
}

function createNodeSvg(
  name: string,
  category: EntityCategory,
  description: string,
  isSelected = false
): string {
  const iconSvg = getCategorySvgIcon(category);
  const color = getCategoryColor(category);
  const strokeColor = isSelected ? '#FFFFFF' : color.border;
  const strokeWidth = isSelected ? '2.5px' : '1px';
  const glow = isSelected
    ? `0 0 24px ${color.accent}`
    : '0 10px 30px rgba(0,0,0,0.6)';

  const safeName = escapeXml(name);
  const safeDesc = escapeXml(description);
  const safeCat = escapeXml(category.replace(/_/g, ' '));

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="280" height="135" viewBox="0 0 280 135">
    <foreignObject width="280" height="135">
      <div xmlns="http://www.w3.org/1999/xhtml" style="
        width: 280px;
        height: 135px;
        box-sizing: border-box;
        padding: 12px 14px;
        border-radius: 16px;
        background: linear-gradient(180deg, #131A28 0%, #090D15 100%);
        border: ${strokeWidth} solid ${strokeColor};
        box-shadow: ${glow}, inset 0 1px 0 rgba(255,255,255,0.18);
        font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        user-select: none;
        overflow: hidden;
      ">
        <!-- Responsive Auto-Sized Category Badge with Crisp Vector Icon -->
        <div style="display: flex; align-items: center; justify-content: flex-start; margin-bottom: 6px;">
          <span style="
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 2px 8px;
            border-radius: 9999px;
            background: ${color.bg};
            border: 1px solid ${color.border};
            color: ${color.text};
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 0.5px;
            font-family: 'JetBrains Mono', monospace;
            text-transform: uppercase;
          ">
            ${iconSvg}
            ${safeCat}
          </span>
        </div>

        <!-- Bold Concept Title -->
        <div style="
          color: #FFFFFF;
          font-size: 13.5px;
          font-weight: 700;
          letter-spacing: -0.2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1.2;
          margin-bottom: 5px;
        ">
          ${safeName}
        </div>

        <!-- Substantive Multiline Description -->
        <div style="
          color: rgba(255, 255, 255, 0.72);
          font-size: 11px;
          line-height: 1.35;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
          font-weight: 400;
        ">
          ${safeDesc}
        </div>
      </div>
    </foreignObject>
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
