import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  effect,
  inject,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Modal } from '@shared/components/modal/modal';
import { Table, TableColumn, SortState } from '@shared/components/table/table';
import { TransactionService } from '@core/services/transaction';
import { CategoryService } from '@core/services/category';
import type { Transaction, CreateTransactionRequest } from '@core/models/transaction.model';
import type { Category } from '@core/models/category.model';
import type { TransactionType } from '@core/models/category.model';

interface TransactionRow extends Transaction {
  projected?: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  Cibo: 'var(--c-food)',
  Trasporti: 'var(--c-transport)',
  Intrattenimento: 'var(--c-fun)',
  Casa: 'var(--c-home)',
  Shopping: 'var(--c-shopping)',
  Salute: 'var(--c-health)',
};
const CATEGORY_SOFT: Record<string, string> = {
  Cibo: 'var(--c-food-soft)',
  Trasporti: 'var(--c-transport-soft)',
  Intrattenimento: 'var(--c-fun-soft)',
  Casa: 'var(--c-home-soft)',
  Shopping: 'var(--c-shopping-soft)',
  Salute: 'var(--c-health-soft)',
};

function categoryColor(name: string | undefined): string {
  if (!name) return 'var(--c-other)';
  return CATEGORY_COLORS[name] ?? 'var(--c-other)';
}
function categorySoft(name: string | undefined): string {
  if (!name) return 'var(--c-other-soft)';
  return CATEGORY_SOFT[name] ?? 'var(--c-other-soft)';
}

const TYPE_LABELS: Record<TransactionType, string> = {
  INCOME: 'Entrata',
  EXPENSE: 'Spesa',
  CREDIT: 'Credito',
  DEBIT: 'Debito',
  OPENING_BALANCE: 'Saldo iniziale',
};

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule, Modal, Table],
  templateUrl: './transactions.html',
  styleUrl: './transactions.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Transactions {
  private readonly transactionService = inject(TransactionService);
  private readonly categoryService = inject(CategoryService);

  readonly typeLabels = TYPE_LABELS;
  readonly typeOptions: TransactionType[] = ['INCOME', 'EXPENSE', 'CREDIT', 'DEBIT'];

  // ── opening balance modal ─────────────────────────────────────────────────
  readonly openingModalOpen = signal(false);
  readonly openingAmount = signal('');
  readonly openingSubmitting = signal(false);
  readonly openingError = signal<string | null>(null);

  readonly transactions = signal<Transaction[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  // ── month navigation ──────────────────────────────────────────────────────
  private readonly _now = new Date();
  readonly selectedYear = signal(this._now.getFullYear());
  readonly selectedMonth = signal(this._now.getMonth()); // 0-based

  // ── filter state ──────────────────────────────────────────────────────────
  readonly search = signal('');
  readonly filterCategoryIds = signal<string[]>([]);
  readonly filterTypes = signal<TransactionType[]>([]);
  readonly filterOnlyRecurring = signal(false);
  readonly sort = signal<SortState>({ key: 'date', dir: 'desc' });

  // ── modal/form state ──────────────────────────────────────────────────────
  readonly modalOpen = signal(false);
  readonly editingTransaction = signal<Transaction | null>(null);
  readonly deleteConfirm = signal(false);

  readonly formAmount = signal('');
  readonly formType = signal<TransactionType>('EXPENSE');
  readonly formCategoryId = signal('');
  readonly formSubCategoryId = signal('');
  readonly formDescription = signal('');
  readonly formDate = signal('');
  readonly formIsRecurring = signal(false);
  readonly formRecurringLabel = signal('');
  readonly formShowCategoryPicker = signal(false);
  readonly formSubmitting = signal(false);
  readonly formError = signal<string | null>(null);

  // ── dropdown open state ───────────────────────────────────────────────────
  readonly filterCategoryDropdownOpen = signal(false);
  readonly filterTypeDropdownOpen = signal(false);

  readonly tableColumns: TableColumn<Transaction>[] = [
    { key: 'category', label: 'Categoria', sortable: true },
    { key: 'description', label: 'Descrizione' },
    { key: 'type', label: 'Tipo' },
    { key: 'date', label: 'Data', sortable: true },
    { key: 'amount', label: 'Importo', sortable: true, align: 'right' },
    { key: 'actions', label: '', width: '50px' },
  ];

  // ── form computed ─────────────────────────────────────────────────────────

  /** Solo le categorie il cui type corrisponde al tipo di transazione selezionato. */
  readonly filteredFormCategories = computed(() =>
    this.categories().filter(c => c.type === this.formType())
  );

  readonly selectedCategory = computed(() => {
    const id = this.formCategoryId();
    return this.categories().find(c => c.id === id) ?? null;
  });

  /**
   * Sottocategorie della categoria selezionata filtrate per tipo transazione.
   * Il backend permette subcategorie con type diverso dalla categoria padre,
   * quindi filtriamo per type === formType().
   */
  readonly availableSubCategories = computed(() => {
    const cat = this.selectedCategory();
    if (!cat) return [];
    return cat.subCategories.filter(s => s.type === this.formType());
  });

  // ── month computed ────────────────────────────────────────────────────────

  readonly selectedMonthLabel = computed(() => {
    const d = new Date(this.selectedYear(), this.selectedMonth(), 1);
    return d.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
  });

  readonly isCurrentMonth = computed(() => {
    const n = new Date();
    return this.selectedYear() === n.getFullYear() && this.selectedMonth() === n.getMonth();
  });

  // ── filter computed ───────────────────────────────────────────────────────

  readonly activeFilterCount = computed(() =>
    this.filterCategoryIds().length +
    this.filterTypes().length +
    (this.filterOnlyRecurring() ? 1 : 0)
  );

  readonly filtered = computed((): TransactionRow[] => {
    const year = this.selectedYear();
    const month = this.selectedMonth();
    const search = this.search().toLowerCase();
    const catIds = this.filterCategoryIds();
    const types = this.filterTypes();
    const onlyRec = this.filterOnlyRecurring();
    const s = this.sort();

    // Transazioni reali del mese selezionato
    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    // Template ricorrenti già materializzate dal cron in questo mese: vanno nascoste
    const generatedTemplateIds = new Set(
      this.transactions()
        .filter(t => {
          if (!t.recurringTemplateId) return false;
          const d = new Date(t.date);
          return d.getFullYear() === year && d.getMonth() === month;
        })
        .map(t => t.recurringTemplateId as string)
    );

    const realRows: TransactionRow[] = this.transactions().filter(t => {
      const d = new Date(t.date);
      if (d.getFullYear() !== year || d.getMonth() !== month) return false;
      if (t.type === 'OPENING_BALANCE') return false; // mostrato separatamente
      // Nasconde la template se il cron ha già creato la copia reale per questo mese
      if (t.isRecurring && generatedTemplateIds.has(t.id)) return false;
      if (catIds.length && (!t.category || !catIds.includes(t.category.id))) return false;
      if (types.length && !types.includes(t.type)) return false;
      if (onlyRec && !t.isRecurring) return false;
      if (search) {
        const inDesc = t.description?.toLowerCase().includes(search) ?? false;
        const inCat = t.category?.name.toLowerCase().includes(search) ?? false;
        const inSub = t.subCategory?.name.toLowerCase().includes(search) ?? false;
        if (!inDesc && !inCat && !inSub) return false;
      }
      return true;
    }).map(t => {
      const d = new Date(t.date);
      const isFuture = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() > todayMidnight;
      return isFuture ? { ...t, projected: true } : t;
    });

    // Proiezioni solo per mesi strettamente futuri rispetto ad oggi
    const isStrictlyFuture =
      year > now.getFullYear() ||
      (year === now.getFullYear() && month > now.getMonth());

    const realRecurringLabels = new Set(
      realRows.filter(r => r.isRecurring).map(r => r.recurringLabel ?? r.id)
    );

    const projectedRows: TransactionRow[] = [];
    const selectedMonthStart = new Date(year, month, 1).getTime();

    for (const t of this.transactions()) {
      if (!isStrictlyFuture) break; // nel mese corrente o passato, nessuna proiezione
      if (!t.isRecurring) continue;
      const originDate = new Date(t.date);
      const originMonthStart = new Date(originDate.getFullYear(), originDate.getMonth(), 1).getTime();
      if (originMonthStart >= selectedMonthStart) continue; // solo mesi precedenti

      const key = t.recurringLabel ?? t.id;
      if (realRecurringLabels.has(key)) continue; // già presente come reale

      if (catIds.length && (!t.category || !catIds.includes(t.category.id))) continue;
      if (types.length && !types.includes(t.type)) continue;
      if (onlyRec && !t.isRecurring) continue;
      if (search) {
        const inDesc = t.description?.toLowerCase().includes(search) ?? false;
        const inCat = t.category?.name.toLowerCase().includes(search) ?? false;
        const inSub = t.subCategory?.name.toLowerCase().includes(search) ?? false;
        if (!inDesc && !inCat && !inSub) continue;
      }

      // Proietta la data sul giorno originale nel mese selezionato
      const projectedDay = Math.min(
        originDate.getDate(),
        new Date(year, month + 1, 0).getDate()
      );
      const projectedDate = new Date(year, month, projectedDay).toISOString();

      projectedRows.push({ ...t, id: `${t.id}_proj_${year}_${month}`, date: projectedDate, projected: true });
      realRecurringLabels.add(key); // evita duplicati se stesso template compare più volte
    }

    let rows: TransactionRow[] = [...realRows, ...projectedRows];

    rows = [...rows].sort((a, b) => {
      let r = 0;
      if (s.key === 'date') r = new Date(a.date).getTime() - new Date(b.date).getTime();
      else if (s.key === 'amount') r = parseFloat(a.amount) - parseFloat(b.amount);
      else if (s.key === 'category')
        r = (a.category?.name ?? '').localeCompare(b.category?.name ?? '');
      return s.dir === 'asc' ? r : -r;
    });

    return rows;
  });

  readonly totalAmount = computed(() =>
    this.filtered()
      .filter(t => t.type === 'EXPENSE' || t.type === 'DEBIT')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0)
  );

  readonly projectedAmount = computed(() =>
    this.filtered()
      .filter(t => t.projected && (t.type === 'EXPENSE' || t.type === 'DEBIT'))
      .reduce((sum, t) => sum + parseFloat(t.amount), 0)
  );

  // Il record OPENING_BALANCE salvato nel DB (esiste solo per il mese "seme")
  readonly storedOpeningBalance = computed((): Transaction | null => {
    return this.transactions().find(t => t.type === 'OPENING_BALANCE') ?? null;
  });

  // Calcola il saldo netto di un mese (entrate - spese, esclusi OPENING_BALANCE e proiezioni)
  private monthNet(year: number, month: number): number {
    return this.transactions()
      .filter(t => {
        if (t.type === 'OPENING_BALANCE') return false;
        const d = new Date(t.date);
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .reduce((sum, t) => {
        const v = parseFloat(t.amount);
        if (t.type === 'INCOME' || t.type === 'CREDIT') return sum + v;
        if (t.type === 'EXPENSE' || t.type === 'DEBIT') return sum - v;
        return sum;
      }, 0);
  }

  // Saldo iniziale del mese selezionato (cascata dal mese seme)
  readonly openingBalanceAmount = computed((): number | null => {
    const ob = this.storedOpeningBalance();
    if (!ob) return null;

    const obDate = new Date(ob.date);
    const obYear = obDate.getFullYear();
    const obMonth = obDate.getMonth();
    const selYear = this.selectedYear();
    const selMonth = this.selectedMonth();

    // Mesi precedenti al mese seme: nessun dato
    const obIdx = obYear * 12 + obMonth;
    const selIdx = selYear * 12 + selMonth;
    if (selIdx < obIdx) return null;

    // Calcola a cascata da obIdx a selIdx
    let balance = parseFloat(ob.amount);
    for (let idx = obIdx; idx < selIdx; idx++) {
      const y = Math.floor(idx / 12);
      const m = idx % 12;
      balance += this.monthNet(y, m);
    }
    return balance;
  });

  // Il mese selezionato è esattamente il mese seme (modificabile)
  readonly isOpeningBalanceEditable = computed((): boolean => {
    const ob = this.storedOpeningBalance();
    if (!ob) return true; // nessun seme ancora — permetti di crearlo
    const obDate = new Date(ob.date);
    return obDate.getFullYear() === this.selectedYear() && obDate.getMonth() === this.selectedMonth();
  });

  readonly actualAmount = computed(() =>
    this.filtered()
      .filter(t => !t.projected && (t.type === 'EXPENSE' || t.type === 'DEBIT'))
      .reduce((sum, t) => sum + parseFloat(t.amount), 0)
  );

  readonly actualCount = computed(() =>
    this.filtered().filter(t => !t.projected).length
  );

  readonly projectedCount = computed(() =>
    this.filtered().filter(t => t.projected).length
  );

  // ── pagination ────────────────────────────────────────────────────────────
  readonly PAGE_SIZE = 10;
  readonly currentPage = signal(1);

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filtered().length / this.PAGE_SIZE))
  );

  readonly pagedRows = computed(() => {
    const page = this.currentPage();
    const start = (page - 1) * this.PAGE_SIZE;
    return this.filtered().slice(start, start + this.PAGE_SIZE);
  });

  readonly pageNumbers = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: (number | '...')[] = [];
    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push('...');
      for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
      if (current < total - 2) pages.push('...');
      pages.push(total);
    }
    return pages;
  });

  constructor() {
    this.loadData();
    // Reset pagina quando cambiano filtri o mese
    effect(() => {
      this.filtered();
      this.currentPage.set(1);
    });
  }

  goToPage(page: number | '...') {
    if (page === '...') return;
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
  }

  prevPage() {
    if (this.currentPage() > 1) this.currentPage.update(p => p - 1);
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) this.currentPage.update(p => p + 1);
  }

  private loadData() {
    this.loading.set(true);
    this.transactionService.getAll().subscribe({
      next: (data) => {
        this.transactions.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Errore nel caricamento delle transazioni.');
        this.loading.set(false);
      },
    });
    this.categoryService.getAll().subscribe({
      next: (data) => this.categories.set(data),
    });
  }

  // ── format helpers ────────────────────────────────────────────────────────

  formatAmount(amount: string, type: TransactionType): string {
    const n = parseFloat(amount);
    const formatted = Math.abs(n).toLocaleString('it-IT', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const sign = type === 'INCOME' || type === 'CREDIT' ? '+' : '−';
    return `${sign}€${formatted}`;
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
  }

  formatTotal(n: number): string {
    return '€' + n.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  amountClass(type: TransactionType): string {
    return type === 'INCOME' || type === 'CREDIT' ? 'amount-pos' : 'amount-neg';
  }

  typeLabel(type: TransactionType): string {
    return TYPE_LABELS[type];
  }

  typePillStyle(type: TransactionType): Record<string, string> {
    if (type === 'INCOME' || type === 'CREDIT') {
      return { background: 'var(--pos-soft)', color: 'var(--pos)' };
    }
    return { background: 'var(--neg-soft)', color: 'var(--neg)' };
  }

  categoryColor(name: string | undefined) { return categoryColor(name); }
  categorySoft(name: string | undefined) { return categorySoft(name); }

  // ── month navigation ──────────────────────────────────────────────────────

  prevMonth() {
    if (this.selectedMonth() === 0) {
      this.selectedMonth.set(11);
      this.selectedYear.update(y => y - 1);
    } else {
      this.selectedMonth.update(m => m - 1);
    }
  }

  nextMonth() {
    if (this.selectedMonth() === 11) {
      this.selectedMonth.set(0);
      this.selectedYear.update(y => y + 1);
    } else {
      this.selectedMonth.update(m => m + 1);
    }
  }

  goToCurrentMonth() {
    const n = new Date();
    this.selectedYear.set(n.getFullYear());
    this.selectedMonth.set(n.getMonth());
  }

  // ── filter actions ────────────────────────────────────────────────────────

  isCategorySelected(id: string): boolean {
    return this.filterCategoryIds().includes(id);
  }

  toggleFilterCategory(id: string) {
    const current = this.filterCategoryIds();
    this.filterCategoryIds.set(
      current.includes(id) ? current.filter(x => x !== id) : [...current, id]
    );
  }

  isTypeSelected(type: TransactionType): boolean {
    return this.filterTypes().includes(type);
  }

  toggleFilterType(type: TransactionType) {
    const current = this.filterTypes();
    this.filterTypes.set(
      current.includes(type) ? current.filter(x => x !== type) : [...current, type]
    );
  }

  clearFilters() {
    this.filterCategoryIds.set([]);
    this.filterTypes.set([]);
    this.filterOnlyRecurring.set(false);
    this.search.set('');
  }

  onSortChanged(s: SortState) {
    this.sort.set(s);
  }

  // ── modal open/close ──────────────────────────────────────────────────────

  openAdd() {
    this.editingTransaction.set(null);
    this.deleteConfirm.set(false);
    this.formAmount.set('');
    this.formType.set('EXPENSE');
    this.formCategoryId.set('');
    this.formSubCategoryId.set('');
    this.formDescription.set('');
    this.formDate.set(new Date().toISOString().slice(0, 10));
    this.formIsRecurring.set(false);
    this.formRecurringLabel.set('');
    this.formShowCategoryPicker.set(false);
    this.formError.set(null);
    this.modalOpen.set(true);
  }

  openEdit(t: TransactionRow) {
    // Blocca solo le proiezioni sintetiche (ID fittizio), non le transazioni reali future
    if (t.projected && t.id.includes('_proj_')) return;
    this.editingTransaction.set(t);
    this.deleteConfirm.set(false);
    const rawAmount = parseFloat(t.amount).toFixed(2).replace('.', ',');
    this.formAmount.set(rawAmount);
    this.formType.set(t.type);
    this.formCategoryId.set(t.category?.id ?? '');
    this.formSubCategoryId.set(t.subCategory?.id ?? '');
    this.formDescription.set(t.description ?? '');
    this.formDate.set(new Date(t.date).toISOString().slice(0, 10));
    this.formIsRecurring.set(t.isRecurring);
    this.formRecurringLabel.set(t.recurringLabel ?? '');
    this.formShowCategoryPicker.set(false);
    this.formError.set(null);
    this.modalOpen.set(true);
  }

  closeModal() {
    this.modalOpen.set(false);
    this.deleteConfirm.set(false);
  }

  // ── form actions ──────────────────────────────────────────────────────────

  /**
   * Cambia il tipo e invalida categoria/sottocategoria se non compatibili
   * col nuovo tipo (Category.type !== newType).
   */
  setFormType(type: TransactionType) {
    this.formType.set(type);
    const currentCat = this.categories().find(c => c.id === this.formCategoryId());
    if (currentCat && currentCat.type !== type) {
      this.formCategoryId.set('');
      this.formSubCategoryId.set('');
    } else if (this.formCategoryId()) {
      // categoria compatibile, ma la sottocategoria potrebbe non esserlo
      const currentSub = currentCat?.subCategories.find(s => s.id === this.formSubCategoryId());
      if (currentSub && currentSub.type !== type) {
        this.formSubCategoryId.set('');
      }
    }
  }

  selectCategory(id: string) {
    this.formCategoryId.set(id);
    this.formSubCategoryId.set('');
    this.formShowCategoryPicker.set(false);
  }

  selectSubCategory(id: string) {
    this.formSubCategoryId.set(id === this.formSubCategoryId() ? '' : id);
  }

  saveTransaction() {
    const rawAmount = this.formAmount().replace(',', '.');
    const amount = parseFloat(rawAmount);
    if (!rawAmount || isNaN(amount) || amount <= 0) {
      this.formError.set('Inserisci un importo valido.');
      return;
    }
    if (!this.formDate()) {
      this.formError.set('Inserisci una data.');
      return;
    }

    const dto: CreateTransactionRequest = {
      amount: amount.toFixed(2),
      date: new Date(this.formDate()).toISOString(),
      type: this.formType(),
      description: this.formDescription() || undefined,
      isRecurring: this.formIsRecurring(),
      recurringLabel: this.formRecurringLabel() || undefined,
      categoryId: this.formCategoryId() || undefined,
      subCategoryId: this.formSubCategoryId() || undefined,
    };

    this.formSubmitting.set(true);
    this.formError.set(null);

    const editing = this.editingTransaction();
    const obs = editing
      ? this.transactionService.update(editing.id, dto)
      : this.transactionService.create(dto);

    obs.subscribe({
      next: (saved) => {
        if (editing) {
          this.transactions.update(list =>
            list.map(t => (t.id === saved.id ? saved : t))
          );
        } else {
          this.transactions.update(list => [saved, ...list]);
        }
        this.formSubmitting.set(false);
        this.closeModal();
      },
      error: () => {
        this.formError.set('Errore durante il salvataggio. Riprova.');
        this.formSubmitting.set(false);
      },
    });
  }

  confirmDelete() { this.deleteConfirm.set(true); }
  cancelDelete()  { this.deleteConfirm.set(false); }

  deleteTransaction() {
    const t = this.editingTransaction();
    if (!t) return;
    this.formSubmitting.set(true);
    this.transactionService.delete(t.id).subscribe({
      next: () => {
        this.transactions.update(list => list.filter(x => x.id !== t.id));
        this.formSubmitting.set(false);
        this.closeModal();
      },
      error: () => {
        this.formError.set("Errore durante l'eliminazione. Riprova.");
        this.formSubmitting.set(false);
      },
    });
  }

  isSubSelected(id: string): boolean {
    return this.formSubCategoryId() === id;
  }

  // ── opening balance modal ─────────────────────────────────────────────────

  openOpeningModal() {
    if (!this.isOpeningBalanceEditable()) return;
    const ob = this.storedOpeningBalance();
    const current = ob ? parseFloat(ob.amount).toFixed(2).replace('.', ',') : '0,00';
    this.openingAmount.set(current);
    this.openingError.set(null);
    this.openingModalOpen.set(true);
  }

  closeOpeningModal() {
    this.openingModalOpen.set(false);
  }

  saveOpeningBalance() {
    const raw = this.openingAmount().replace(',', '.');
    const amount = parseFloat(raw);
    if (isNaN(amount) || amount < 0) {
      this.openingError.set('Inserisci un importo valido (≥ 0).');
      return;
    }
    this.openingSubmitting.set(true);
    this.openingError.set(null);
    // Il seme è sempre riferito al mese del record esistente (o al mese selezionato se primo inserimento)
    const ob = this.storedOpeningBalance();
    const obDate = ob ? new Date(ob.date) : null;
    const year = obDate ? obDate.getFullYear() : this.selectedYear();
    const month = obDate ? obDate.getMonth() : this.selectedMonth();
    this.transactionService
      .upsertOpeningBalance(year, month, amount.toFixed(2))
      .subscribe({
        next: (saved) => {
          this.transactions.update(list => {
            const idx = list.findIndex(t => t.type === 'OPENING_BALANCE');
            if (idx >= 0) {
              const updated = [...list];
              updated[idx] = saved;
              return updated;
            }
            return [saved, ...list];
          });
          this.openingSubmitting.set(false);
          this.closeOpeningModal();
        },
        error: () => {
          this.openingError.set('Errore durante il salvataggio. Riprova.');
          this.openingSubmitting.set(false);
        },
      });
  }

  // ── dropdown close-on-outside-click ──────────────────────────────────────

  closeAllDropdowns() {
    this.filterCategoryDropdownOpen.set(false);
    this.filterTypeDropdownOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (!target.closest('.dropdown-wrap')) {
      this.closeAllDropdowns();
    }
  }
}
