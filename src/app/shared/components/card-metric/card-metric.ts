import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';

export type MetricTone = 'accent' | 'pos' | 'neg' | 'neutral';

@Component({
  selector: 'app-card-metric',
  standalone: true,
  imports: [],
  templateUrl: './card-metric.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardMetric {
  label         = input<string>('');
  value         = input<string>('');
  subText       = input<string>('');
  subValue      = input<string>('');
  tone          = input<MetricTone>('neutral');
  iconPath      = input<string>('');
  progressValue = input<number | null>(null);
  progressMax   = input<number | null>(null);

  // badge trend: numero percentuale (es. 8 → "+8%", -5 → "-5%"), null = nascosto
  trendPct      = input<number | null>(null);
  // testo accanto al badge (es. "vs mese scorso")
  trendLabel    = input<string>('');

  progressPct = computed(() => {
    const v = this.progressValue(), m = this.progressMax();
    if (v === null || m === null || m === 0) return 0;
    return Math.min(100, (v / m) * 100);
  });

  progressOver = computed(() => {
    const v = this.progressValue(), m = this.progressMax();
    return v !== null && m !== null && v > m;
  });

  trendUp = computed(() => (this.trendPct() ?? 0) > 0);

  // per la card "spese" rosso = su, verde = giù; per entrate è l'opposto
  // usiamo trendPositive per decidere il colore: se positivo è "buono"
  trendPositive = input<boolean>(false);

  trendBg = computed(() => {
    const up  = this.trendUp();
    const pos = this.trendPositive();
    const good = pos ? up : !up;
    return good ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)';
  });

  trendColor = computed(() => {
    const up  = this.trendUp();
    const pos = this.trendPositive();
    const good = pos ? up : !up;
    return good ? 'var(--pos, #22c55e)' : 'var(--neg, #ef4444)';
  });

  trendText = computed(() => {
    const p = this.trendPct();
    if (p === null) return '';
    const sign = p > 0 ? '+' : '';
    return `${sign}${p}%`;
  });

  iconBg = computed(() => {
    const map: Record<MetricTone, string> = {
      accent: 'rgba(99,102,241,0.10)',
      pos:    'rgba(34,197,94,0.10)',
      neg:    'rgba(239,68,68,0.10)',
      neutral: 'var(--surface-2)',
    };
    return map[this.tone()];
  });

  iconColor = computed(() => {
    const map: Record<MetricTone, string> = {
      accent: 'var(--accent)',
      pos:    'var(--pos, #22c55e)',
      neg:    'var(--neg, #ef4444)',
      neutral: 'var(--text-2)',
    };
    return map[this.tone()];
  });
}
