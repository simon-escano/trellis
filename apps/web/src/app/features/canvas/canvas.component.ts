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

  let width = 250;
  if (titleLength > 28 || descLength > 120) {
    width = 285;
  } else if (titleLength < 16 && descLength < 60) {
    width = 225;
  }

  const maxCharsPerLine = Math.floor((width - 28) / 7.2);
  const maxLines = descLength > 100 ? 4 : descLength > 50 ? 3 : 2;
  const descLines = wrapText(description, maxCharsPerLine, maxLines);

  const height = 64 + descLines.length * 17 + 14;
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
  dims: NodeDimensions,
  isSelected = false
): string {
  const color = getCategoryColor(category);
  const strokeColor = isSelected ? '#FFFFFF' : color.border;
  const strokeWidth = isSelected ? 2.5 : 1.2;

  const safeName = escapeXml(name);
  const safeCat = escapeXml(category.replace(/_/g, ' '));

  // Generous 14px outer margin inside SVG viewport so drop shadow never clips
  const pad = 14;
  const svgWidth = dims.width + pad * 2;
  const svgHeight = dims.height + pad * 2;
  const cardX = pad;
  const cardY = pad;

  const iconGeometry = getCategoryIconSvgGeometry(
    category,
    cardX + 20,
    cardY + 16.5,
    color.text
  );

  const descTextElements = dims.descLines
    .map(
      (line, idx) =>
        `<text x="${cardX + 14}" y="${cardY + 78 + idx * 17}" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif" font-size="10.5" fill="${idx === dims.descLines.length - 1 ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.74)'}">${escapeXml(line)}</text>`
    )
    .join('\n');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}" style="background: transparent;">
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
      <filter id="shadow-${safeName.replace(/\W/g, '')}" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="rgba(0,0,0,0.6)" />
      </filter>
      <filter id="glow-${safeName.replace(/\W/g, '')}" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="0" stdDeviation="8" flood-color="${color.accent}" flood-opacity="0.8" />
      </filter>
    </defs>
    
    <!-- Outer Rounded Card Background (rx=18, ry=18) with smooth transparent margins -->
    <rect x="${cardX}" y="${cardY}" width="${dims.width}" height="${dims.height}" rx="18" ry="18" fill="url(#cardGrad-${safeName.replace(/\W/g, '')})" stroke="${strokeColor}" stroke-width="${strokeWidth}" filter="${isSelected ? `url(#glow-${safeName.replace(/\W/g, '')})` : `url(#shadow-${safeName.replace(/\W/g, '')})`}" />
    
    <!-- Top Specular Highlight Line -->
    <path d="M ${cardX + 22} ${cardY + 3.5} L ${cardX + dims.width - 22} ${cardY + 3.5}" stroke="url(#specularGrad)" stroke-width="1.2" stroke-linecap="round" />

    <!-- Responsive Auto-Sized Category Pill -->
    <rect x="${cardX + 14}" y="${cardY + 14}" width="${dims.pillWidth}" height="22" rx="11" ry="11" fill="${color.bg}" stroke="${color.border}" stroke-width="0.8" />
    
    <!-- Vector Category Icon -->
    ${iconGeometry}
    
    <!-- Category Label with generous spacing from icon -->
    <text x="${cardX + 42}" y="${cardY + 29}" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif" font-size="9.5" font-weight="700" fill="${color.text}" letter-spacing="0.5">
      ${safeCat}
    </text>

    <!-- Bold Concept Title -->
    <text x="${cardX + 14}" y="${cardY + 58}" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif" font-size="13.5" font-weight="700" fill="#FFFFFF">
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
  imports: [CommonModule],
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.css'],
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

  // Dense, neutral interactive dot field background state
  private dotsAnimId: number | null = null;
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
    if (this.dotsAnimId) {
      cancelAnimationFrame(this.dotsAnimId);
      this.dotsAnimId = null;
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
    };

    window.addEventListener('resize', resize);
    resize();

    const parent = this.networkContainer.nativeElement;
    parent.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      this.mouseX = e.clientX - rect.left;
      this.mouseY = e.clientY - rect.top;
      this.isMouseOver = true;
    });

    parent.addEventListener('mouseleave', () => {
      this.isMouseOver = false;
      this.mouseX = -1000;
      this.mouseY = -1000;
    });

    // Dense grid: 20px spacing
    const spacing = 20;
    const proximityRadius = 120;

    const renderDots = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cols = Math.ceil(canvas.width / spacing) + 1;
      const rows = Math.ceil(canvas.height / spacing) + 1;

      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          const dotX = c * spacing;
          const dotY = r * spacing;

          let renderX = dotX;
          let renderY = dotY;
          let dotRadius = 0.9;
          let alpha = 0.055;
          let isHovered = false;

          if (this.isMouseOver) {
            const dist = Math.hypot(this.mouseX - dotX, this.mouseY - dotY);
            if (dist < proximityRadius) {
              isHovered = true;
              const factor = 1 - dist / proximityRadius;
              const displace = factor * 4.5;
              const angle = Math.atan2(dotY - this.mouseY, dotX - this.mouseX);

              renderX = dotX + Math.cos(angle) * displace;
              renderY = dotY + Math.sin(angle) * displace;
              dotRadius = 0.9 + factor * 1.5;
              alpha = 0.08 + factor * 0.35;
            }
          }

          ctx.beginPath();
          ctx.arc(renderX, renderY, dotRadius, 0, Math.PI * 2);

          if (isHovered) {
            // Neutral soft frosted white glow
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.shadowColor = 'rgba(255, 255, 255, 0.35)';
            ctx.shadowBlur = 4;
          } else {
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
          }

          ctx.fill();
        }
      }

      this.dotsAnimId = requestAnimationFrame(renderDots);
    };

    this.dotsAnimId = requestAnimationFrame(renderDots);
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
          gravitationalConstant: -160, // Balanced spacing
          centralGravity: 0.006,
          springLength: 230, // Optimal breathing room
          springConstant: 0.04,
          damping: 0.75,
          avoidOverlap: 0.9, // Anti-collision without extreme sprawl
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

        // Generous padding: 12px horizontal, 5px vertical (pill height 22px)
        const pillWidth = Math.max(textWidth + 24, 48);
        const pillHeight = 22;
        const pillRadius = 11; // Fully rounded capsule
        const pillX = midX - pillWidth / 2;
        const pillY = midY - pillHeight / 2;

        // Draw fully rounded pill background & subtle border
        ctx.beginPath();
        drawRoundedRect(ctx, pillX, pillY, pillWidth, pillHeight, pillRadius);
        ctx.fillStyle = 'rgba(13, 20, 32, 0.94)';
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
        ctx.stroke();

        // Draw upright, high-contrast label
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
