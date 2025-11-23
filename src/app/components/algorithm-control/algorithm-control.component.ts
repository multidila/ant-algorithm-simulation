import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';

import { AlgorithmStatus } from '../../enums';

@Component({
  selector: 'app-algorithm-control',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './algorithm-control.component.html',
  styleUrl: './algorithm-control.component.scss',
})
export class AlgorithmControlComponent {
  protected readonly statuses = AlgorithmStatus;

  public readonly status = input.required<AlgorithmStatus>();
  public readonly initialized = input(true);

  public readonly startClicked = output<void>();
  public readonly stopClicked = output<void>();
}
