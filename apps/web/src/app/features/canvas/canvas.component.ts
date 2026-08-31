import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  effect,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Network, Node, Edge } from 'vis-network';
import { DataSet } from 'vis-data';
import { DocumentStore } from '../../core/state/document.store.js';
import { Entity, EntityCategory } from '../../core/models/document.model.js';

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
  private nodesDataSet = new DataSet<Node>([]);
  private edgesDataSet = new DataSet<Edge>([]);

  isPhysicsEnabled = true;

  constructor() {
    // Reactive synchronization with active document
    effect(() => {
      const doc = this.store.activeDocument();
      if (doc) {
        this.renderGraph(doc.entities || [], doc.relationships || []);
      } else {
        this.clearGraph();
      }
    });

    // Reactive node selection highlight
    effect(() => {
      const selected = this.store.selectedEntity();
      if (this.network && selected) {
        this.network.selectNodes([selected.id]);
      }
    });
  }

  ngOnInit() {
    this.initNetwork();
  }

  ngOnDestroy() {
    if (this.network) {
      this.network.destroy();
      this.network = null;
    }
  }

  private initNetwork() {
    const data: any = {
      nodes: this.nodesDataSet,
      edges: this.edgesDataSet,
    };

    const options: any = {
      autoResize: true,
      height: '100%',
      width: '100%',
      interaction: {
        hover: true,
        tooltipDelay: 200,
        navigationButtons: false,
        keyboard: true,
        zoomView: true,
        dragView: true,
        selectConnectedEdges: true,
      },
      physics: {
        enabled: this.isPhysicsEnabled,
        solver: 'forceAtlas2Based',
        forceAtlas2Based: {
          gravitationalConstant: -50,
          centralGravity: 0.01,
          springLength: 130,
          springConstant: 0.08,
          damping: 0.4,
          avoidOverlap: 0.6,
        },
        stabilization: {
          enabled: true,
          iterations: 150,
          updateInterval: 25,
        },
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
        const doc = this.store.activeDocument();
        const entity = doc?.entities.find((e) => e.id === nodeId);
        if (entity) {
          this.store.selectEntity(entity);
        }
      }
    });

    this.network.on('deselectNode', () => {
      this.store.selectEntity(null);
    });
  }

  private getNodeColors(category: EntityCategory) {
    switch (category) {
      case 'CONCEPT':
        return {
          bg: '#00E59920',
          border: '#00E599',
          glow: 'rgba(0, 229, 153, 0.35)',
        };
      case 'SERVICE':
      case 'SYSTEM':
        return {
          bg: '#38BDF820',
          border: '#38BDF8',
          glow: 'rgba(56, 189, 248, 0.35)',
        };
      case 'DATA_MODEL':
        return {
          bg: '#F59E0B20',
          border: '#F59E0B',
          glow: 'rgba(245, 158, 11, 0.35)',
        };
      case 'INFRASTRUCTURE':
        return {
          bg: '#F43F5E20',
          border: '#F43F5E',
          glow: 'rgba(244, 63, 94, 0.35)',
        };
      case 'SECURITY_POLICY':
      case 'API_ENDPOINT':
      default:
        return {
          bg: '#A855F720',
          border: '#A855F7',
          glow: 'rgba(168, 85, 247, 0.35)',
        };
    }
  }

  private renderGraph(entities: Entity[], relationships: any[]) {
    const visNodes: Node[] = entities.map((entity) => {
      const colors = this.getNodeColors(entity.category);
      return {
        id: entity.id,
        label: entity.name,
        shape: 'box',
        color: {
          background: colors.bg,
          border: colors.border,
          highlight: {
            background: colors.bg,
            border: '#F8FAFC',
          },
          hover: {
            background: colors.bg,
            border: colors.border,
          },
        },
        font: {
          color: '#F8FAFC',
          face: 'DM Sans',
          size: 14,
          bold: { color: '#FFFFFF' },
        },
        borderWidth: 1.5,
        borderWidthSelected: 2.5,
        shadow: {
          enabled: true,
          color: colors.glow,
          size: 10,
          x: 0,
          y: 0,
        },
        margin: {
          top: 12,
          bottom: 12,
          left: 14,
          right: 14,
        },
      };
    });

    const visEdges: Edge[] = relationships.map((rel) => ({
      id: rel.id,
      from: rel.sourceEntity?.id || rel.source_entity_id,
      to: rel.targetEntity?.id || rel.target_entity_id,
      label: rel.relationType,
      arrows: 'to',
      font: {
        color: '#94A3B8',
        face: 'JetBrains Mono',
        size: 11,
        strokeWidth: 2,
        strokeColor: '#070A0F',
        align: 'middle',
      },
      color: {
        color: '#334155',
        highlight: '#38BDF8',
        hover: '#94A3B8',
      },
      smooth: {
        enabled: true,
        type: 'cubicBezier',
        roundness: 0.4,
      },
      width: 1.5,
      selectionWidth: 2.5,
    }));

    this.nodesDataSet.clear();
    this.edgesDataSet.clear();

    this.nodesDataSet.add(visNodes);
    this.edgesDataSet.add(visEdges);

    if (this.network) {
      this.network.fit({
        animation: { duration: 600, easingFunction: 'easeInOutQuad' },
      });
    }
  }

  private clearGraph() {
    this.nodesDataSet.clear();
    this.edgesDataSet.clear();
  }

  zoomIn() {
    if (!this.network) return;
    const scale = this.network.getScale();
    this.network.moveTo({
      scale: scale * 1.3,
      animation: { duration: 250, easingFunction: 'easeInOutQuad' },
    });
  }

  zoomOut() {
    if (!this.network) return;
    const scale = this.network.getScale();
    this.network.moveTo({
      scale: scale * 0.7,
      animation: { duration: 250, easingFunction: 'easeInOutQuad' },
    });
  }

  fitView() {
    if (!this.network) return;
    this.network.fit({
      animation: { duration: 400, easingFunction: 'easeInOutQuad' },
    });
  }

  togglePhysics() {
    this.isPhysicsEnabled = !this.isPhysicsEnabled;
    if (this.network) {
      this.network.setOptions({ physics: { enabled: this.isPhysicsEnabled } });
    }
  }
}
