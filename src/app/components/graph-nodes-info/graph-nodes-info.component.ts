import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';

import { Graph } from '../../models/graph';

@Component({
  selector: 'app-graph-nodes-info',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './graph-nodes-info.component.html',
  styleUrl: './graph-nodes-info.component.scss',
})
export class GraphNodesInfoComponent {
  protected readonly nodes = computed(() => this.graph()?.nodes ?? []);
  protected readonly distanceMatrix = computed(() => this.graph()?.getDistances() ?? []);

  public readonly graph = input<Graph | null>(null);

  protected getDisplayDistance(fromIndex: number, toIndex: number): string {
    if (fromIndex === toIndex) {
      return '—';
    }
    const distance = this.distanceMatrix()[fromIndex]?.[toIndex];
    if (distance == null || distance === Infinity) {
      return '∞';
    }
    return Math.round(distance).toString();
  }
}
