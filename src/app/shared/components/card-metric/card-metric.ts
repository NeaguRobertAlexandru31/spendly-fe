import { Component, input, ChangeDetectionStrategy } from '@angular/core';

export type MetricTone = 'accent' | 'pos' | 'neg' | 'neutral';

@Component({
  selector: 'app-card-metric',
  standalone: true,
  imports: [],
  templateUrl: './card-metric.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardMetric {
  label      = input<string>('');
  value      = input<string>('');
  subText    = input<string>('');
  subValue   = input<string>('');
  tone       = input<MetricTone>('neutral');
  iconPath   = input<string>('');
  progressValue = input<number | null>(null);
  progressMax   = input<number | null>(null);

  progressPct(): number {
    const v = this.progressValue(), m = this.progressMax();
    if (v === null || m === null || m === 0) return 0;
    return Math.min(100, (v / m) * 100);
  }

  progressOver(): boolean {
    const v = this.progressValue(), m = this.progressMax();
    return v !== null && m !== null && v > m;
  }

  iconColor(): string {
    const map: Record<MetricTone, string> = {
      accent: 'var(--accent)', pos: 'var(--pos)', neg: 'var(--neg)', neutral: 'var(--text-2)',
    };
    return map[this.tone()];
  }
}
