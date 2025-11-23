import { CommonModule } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';

import { GraphParams } from '../../models/graph';

@Component({
  selector: 'app-graph-params',
  standalone: true,
  imports: [CommonModule, FormsModule, MatExpansionModule],
  templateUrl: './graph-params.component.html',
  styleUrl: './graph-params.component.scss',
})
export class GraphParamsComponent {
  protected readonly hasParams = computed(() => this.params() != null);

  public readonly params = input<GraphParams | null>(null);
  public readonly disabled = input(false);

  public readonly paramsReset = output<void>();
  public readonly paramsChange = output<GraphParams | null>();

  protected onParamValueChange<K extends keyof GraphParams>(key: K, value: GraphParams[K]): void {
    const current = this.params();
    if (!current) {
      return;
    }
    this.paramsChange.emit({ ...current, [key]: value });
  }
}
