import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
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

type FilterPeriod = '7' | '30' | '90' | 'all';

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

const PERIOD_OPTS: { value: FilterPeriod; label: string }[] = [
  { value: '7', label: '7 giorni' },
  { value: '30', label: '30 giorni' },
  { value: '90', label: '90 giorni' },
  { value: 'all', label: 'Sempre' },
];

const TYPE_LABELS: Record<TransactionType, string> = {
  INCOME: 'Entrata',
  EXPENSE: 'Spesa',
  CREDIT: 'Credito',
  DEBIT: 'Debito',
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

  readonly periodOpts = PERIOD_OPTS;
  readonly typeLabels = TYPE_LABELS;
  readonly typeOptions: TransactionType[] = ['INCOME', 'EXPENSE', 'CREDIT', 'DEBIT'];

  readonly transactions = signal<Transaction[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  // ── filter state ──────────────────────────────────────────────────────────
  readonly search = signal('');
  readonly filterCategoryIds = signal<string[]>([]);
  readonly filterTypes = signal<TransactionType[]>([]);
  readonly filterPeriod = signal<FilterPeriod>('30');
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
  readonly filterPeriodDropdownOpen = signal(false);

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

  // ── filter computed ───────────────────────────────────────────────────────

  readonly activeFilterCount = computed(() =>
    this.filterCategoryIds().length +
    this.filterTypes().length +
    (this.filterPeriod() !== '30' ? 1 : 0) +
    (this.filterOnlyRecurring() ? 1 : 0)
  );

  readonly filtered = computed(() => {
    const now = Date.now();
    const period = this.filterPeriod();
    const search = this.search().toLowerCase();
    const catIds = this.filterCategoryIds();
    const types = this.filterTypes();
    const onlyRec = this.filterOnlyRecurring();
    const s = this.sort();

    let rows = this.transactions().filter(t => {
      if (catIds.length && (!t.category || !catIds.includes(t.category.id))) return false;
      if (types.length && !types.includes(t.type)) return false;
      if (onlyRec && !t.isRecurring) return false;
      if (period !== 'all') {
        const days = (now - new Date(t.date).getTime()) / 86400000;
        if (days > +period) return false;
      }
      if (search) {
        const inDesc = t.description?.toLowerCase().includes(search) ?? false;
        const inCat = t.category?.name.toLowerCase().includes(search) ?? false;
        const inSub = t.subCategory?.name.toLowerCase().includes(search) ?? false;
        if (!inDesc && !inCat && !inSub) return false;
      }
      return true;
    });

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

  readonly currentPeriodLabel = computed(
    () => PERIOD_OPTS.find(p => p.value === this.filterPeriod())?.label ?? '30 giorni'
  );

  constructor() {
    this.loadData();
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

  setPeriod(p: FilterPeriod) {
    this.filterPeriod.set(p);
    this.filterPeriodDropdownOpen.set(false);
  }

  clearFilters() {
    this.filterCategoryIds.set([]);
    this.filterTypes.set([]);
    this.filterPeriod.set('30');
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

  openEdit(t: Transaction) {
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

  // ── dropdown close-on-outside-click ──────────────────────────────────────

  closeAllDropdowns() {
    this.filterCategoryDropdownOpen.set(false);
    this.filterTypeDropdownOpen.set(false);
    this.filterPeriodDropdownOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (!target.closest('.dropdown-wrap')) {
      this.closeAllDropdowns();
    }
  }
}
