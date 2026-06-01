import { Component, input, ChangeDetectionStrategy } from '@angular/core';

const COLORS: Record<string, string> = {
  'Cibo': 'var(--c-food)', 'Cibo & Spesa': 'var(--c-food)',
  'Trasporti': 'var(--c-transport)',
  'Intrattenimento': 'var(--c-fun)',
  'Casa': 'var(--c-home)', 'Casa & Bollette': 'var(--c-home)',
  'Shopping': 'var(--c-shopping)',
  'Salute': 'var(--c-health)',
};
const SOFTS: Record<string, string> = {
  'Cibo': 'var(--c-food-soft)', 'Cibo & Spesa': 'var(--c-food-soft)',
  'Trasporti': 'var(--c-transport-soft)',
  'Intrattenimento': 'var(--c-fun-soft)',
  'Casa': 'var(--c-home-soft)', 'Casa & Bollette': 'var(--c-home-soft)',
  'Shopping': 'var(--c-shopping-soft)',
  'Salute': 'var(--c-health-soft)',
};

@Component({
  selector: 'app-category-badge',
  standalone: true,
  imports: [],
  templateUrl: './category-badge.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryBadge {
  name = input<string | null>(null);
  size = input<'sm' | 'md'>('md');

  color(): string { return COLORS[this.name() ?? ''] ?? 'var(--c-other)'; }
  soft(): string  { return SOFTS[this.name() ?? ''] ?? 'var(--c-other-soft)'; }
}
