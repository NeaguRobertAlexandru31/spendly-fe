import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  OnInit,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { MetricsService } from '@core/services/metrics';
import { CardMetric } from '@shared/components/card-metric/card-metric';
import { CategoryBadge } from '@shared/components/category-badge/category-badge';
import type { DashboardMetrics, CategorySpent, DailyPoint, RecentTransaction } from '@core/models/metrics.model';

const ICON_WALLET   = "M3 7a2 2 0 0 1 2-2h12v4M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6a1 1 0 0 0-1-1H6a3 3 0 0 1-3-3z";
const ICON_CALENDAR = "M3 9h18M8 3v4M16 3v4";
const ICON_REPEAT   = "M17 2l3 3-3 3M3 11V9a4 4 0 0 1 4-4h13M7 22l-3-3 3-3M21 13v2a4 4 0 0 1-4 4H4";

const CAT_COLORS: Record<string, string> = {
  'Cibo': 'var(--c-food)', 'Cibo & Spesa': 'var(--c-food)',
  'Trasporti': 'var(--c-transport)',
  'Intrattenimento': 'var(--c-fun)',
  'Casa': 'var(--c-home)', 'Casa & Bollette': 'var(--c-home)',
  'Shopping': 'var(--c-shopping)',
  'Salute': 'var(--c-health)',
};

function eur(n: number): string {
  return '€' + Math.abs(n).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function eur0(n: number): string {
  return '€' + Math.round(n).toLocaleString('it-IT');
}
function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
}
function catColor(name: string | null): string {
  return CAT_COLORS[name ?? ''] ?? 'var(--c-other)';
}

interface ChartPaths {
  line: string; area: string;
  todayX: number; todayY: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CardMetric, CategoryBadge, RouterLink],
  templateUrl: './dashboard.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard implements OnInit {
  private readonly metricsService = inject(MetricsService);

  metrics  = signal<DashboardMetrics | null>(null);
  loading  = signal(true);

  readonly ICON_WALLET   = ICON_WALLET;
  readonly ICON_CALENDAR = ICON_CALENDAR;
  readonly ICON_REPEAT   = ICON_REPEAT;

  totalSpent     = computed(() => eur(this.metrics()?.totalSpent ?? 0));
  dailyAvg       = computed(() => eur(this.metrics()?.dailyAvg ?? 0));
  projected      = computed(() => eur0(this.metrics()?.projected ?? 0));
  recurringTotal = computed(() => eur(this.metrics()?.recurringTotal ?? 0));
  recurringCount = computed(() => this.metrics()?.recurringCount ?? 0);
  monthName      = computed(() => this.metrics()?.monthName ?? '');
  topCategories  = computed(() => (this.metrics()?.spentByCategory ?? []).slice(0, 6));
  recentTxs      = computed(() => this.metrics()?.recentTransactions ?? []);

  chartPaths = computed((): ChartPaths => this.buildChart(this.metrics()?.dailyData ?? []));

  ngOnInit() {
    this.metricsService.getDashboard().subscribe({
      next: d => { this.metrics.set(d); this.loading.set(false); },
      error: ()  => this.loading.set(false),
    });
  }

  private buildChart(data: DailyPoint[]): ChartPaths {
    const W = 720, H = 200, pl = 8, pr = 8, pt = 16, pb = 24;
    if (!data.length) return { line: '', area: '', todayX: 0, todayY: 0 };
    const maxV = Math.max(...data.map(d => d.cumulative), 1) * 1.05;
    const X = (i: number) => pl + (i / (data.length - 1)) * (W - pl - pr);
    const Y = (v: number) => pt + (1 - v / maxV) * (H - pt - pb);
    const line = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${X(i).toFixed(1)},${Y(d.cumulative).toFixed(1)}`).join(' ');
    const area = `${line} L${X(data.length-1).toFixed(1)},${(H-pb).toFixed(1)} L${X(0).toFixed(1)},${(H-pb).toFixed(1)} Z`;
    const ti = Math.min(data.length - 1, new Date().getDate() - 1);
    return { line, area, todayX: parseFloat(X(ti).toFixed(1)), todayY: parseFloat(Y(data[ti]?.cumulative ?? 0).toFixed(1)) };
  }

  catBarSegs(cats: CategorySpent[]): { color: string; flex: number }[] {
    return cats.map(c => ({ color: catColor(c.categoryName), flex: c.total }));
  }

  catColor(name: string | null)  { return catColor(name); }
  catPct(cat: CategorySpent)     { const t = this.metrics()?.totalSpent ?? 1; return t > 0 ? Math.round((cat.total / t) * 100) : 0; }
  eur(n: number)                 { return eur(n); }
  fmtDate(iso: string)           { return fmtDate(iso); }

  typeLabel(type: string): string {
    return ({ INCOME: 'Entrata', EXPENSE: 'Spesa', CREDIT: 'Credito', DEBIT: 'Debito' } as Record<string,string>)[type] ?? type;
  }
  txSign(tx: RecentTransaction)  { return tx.type === 'INCOME' || tx.type === 'CREDIT' ? '+' : '-'; }
  txColor(tx: RecentTransaction) { return tx.type === 'INCOME' || tx.type === 'CREDIT' ? 'var(--pos)' : 'var(--text)'; }
}
