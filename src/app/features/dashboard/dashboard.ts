import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  OnInit,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MetricsService } from '@core/services/metrics/metrics';
import { CategoryService } from '@core/services/category/category';
import { CardMetric } from '@shared/components/card-metric/card-metric';
import { CategoryBadge } from '@shared/components/category-badge/category-badge';
import type {
  DashboardMetrics,
  CategorySpent,
  DailyPoint,
  RecentTransaction,
  DashboardQueryParams,
  PeriodComparison,
} from '@core/models/metrics.model';
import type { Category } from '@core/models/category.model';

// wallet / credit-card
const ICON_WALLET   = "M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7zM3 11h18";
// trending-up
const ICON_TRENDING = "M22 7l-9.5 9.5-4-4L2 19M16 7h6v6";
// calendar
const ICON_CALENDAR = "M8 2v4M16 2v4M3 10h18M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z";
// repeat
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

function currentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function prevYearMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function nextYearMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CardMetric, CategoryBadge, RouterLink, FormsModule],
  templateUrl: './dashboard.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard implements OnInit {
  private readonly metricsService  = inject(MetricsService);
  private readonly categoryService = inject(CategoryService);

  metrics     = signal<DashboardMetrics | null>(null);
  loading     = signal(true);
  categories  = signal<Category[]>([]);

  // filtri
  selectedMonth      = signal(currentYearMonth());
  selectedCategoryId = signal<string>('');
  selectedType       = signal<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  selectedCompare    = signal<'' | 'previous' | 'year'>('');

  readonly ICON_WALLET   = ICON_WALLET;
  readonly ICON_TRENDING = ICON_TRENDING;
  readonly ICON_CALENDAR = ICON_CALENDAR;
  readonly ICON_REPEAT   = ICON_REPEAT;

  isCurrentMonth = computed(() => this.selectedMonth() === currentYearMonth());

  totalSpent     = computed(() => eur(this.metrics()?.totalSpent ?? 0));
  totalIncome    = computed(() => eur(this.metrics()?.totalIncome ?? 0));
  netBalance     = computed(() => this.metrics()?.netBalance ?? 0);
  dailyAvg       = computed(() => eur(this.metrics()?.dailyAvg ?? 0));
  projected      = computed(() => eur0(this.metrics()?.projected ?? 0));
  recurringTotal = computed(() => eur(this.metrics()?.recurringTotal ?? 0));
  recurringCount = computed(() => this.metrics()?.recurringCount ?? 0);
  monthName      = computed(() => this.metrics()?.monthName ?? '');
  topCategories  = computed(() => (this.metrics()?.spentByCategory ?? []).slice(0, 6));
  recentTxs      = computed(() => this.metrics()?.recentTransactions ?? []);
  comparison     = computed(() => this.metrics()?.comparison ?? null);

  netBalanceLabel = computed(() => {
    const n = this.netBalance();
    return (n >= 0 ? '+' : '') + eur(n);
  });
  netBalanceColor = computed(() => this.netBalance() >= 0 ? 'var(--pos)' : 'var(--neg, #ef4444)');

  spentTrendPct   = computed(() => this.comparison()?.deltaSpentPct  ?? null);
  incomeTrendPct  = computed(() => this.comparison()?.deltaIncomePct ?? null);
  compareLabel    = computed(() => this.comparison() ? `vs ${this.comparison()!.label}` : '');

  chartPaths = computed((): ChartPaths => this.buildChart(this.metrics()?.dailyData ?? []));

  ngOnInit() {
    this.categoryService.getAll().subscribe(cats => this.categories.set(cats));
    this.load();
  }

  private load() {
    this.loading.set(true);
    const params: DashboardQueryParams = { month: this.selectedMonth() };
    if (this.selectedCategoryId()) params.categoryId = this.selectedCategoryId();
    if (this.selectedType() !== 'ALL') params.type = this.selectedType();
    if (this.selectedCompare()) params.compareWith = this.selectedCompare() as 'previous' | 'year';

    this.metricsService.getDashboard(params).subscribe({
      next: d  => { this.metrics.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  prevMonth() {
    this.selectedMonth.set(prevYearMonth(this.selectedMonth()));
    this.load();
  }

  nextMonth() {
    if (this.isCurrentMonth()) return;
    this.selectedMonth.set(nextYearMonth(this.selectedMonth()));
    this.load();
  }

  applyFilter() { this.load(); }

  resetFilters() {
    this.selectedMonth.set(currentYearMonth());
    this.selectedCategoryId.set('');
    this.selectedType.set('ALL');
    this.selectedCompare.set('');
    this.load();
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

  deltaClass(pct: number | null): string {
    if (pct === null) return 'text-[var(--text-3)]';
    return pct <= 0 ? 'text-[var(--pos)]' : 'text-[var(--neg,#ef4444)]';
  }

  deltaArrow(pct: number | null): string {
    if (pct === null) return '–';
    return pct <= 0 ? '↓' : '↑';
  }

  fmtDelta(cmp: PeriodComparison): string {
    const sign = cmp.deltaSpent <= 0 ? '' : '+';
    const pct  = cmp.deltaSpentPct !== null ? ` (${sign}${cmp.deltaSpentPct}%)` : '';
    return `${sign}${eur(cmp.deltaSpent)}${pct}`;
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
