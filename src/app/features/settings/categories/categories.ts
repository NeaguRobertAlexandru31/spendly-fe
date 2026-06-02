import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Modal } from '@shared/components/modal/modal';
import { CategoryService } from '@core/services/category/category';
import type {
  Category,
  SubCategory,
  TransactionType,
} from '@core/models/category.model';

const TYPE_LABELS: Record<TransactionType, string> = {
  EXPENSE: 'Spesa',
  INCOME: 'Entrata',
  DEBIT:  'Debito',
  CREDIT: 'Credito',
  OPENING_BALANCE: 'Saldo iniziale',
};

const TYPE_ORDER: TransactionType[] = ['EXPENSE', 'INCOME', 'DEBIT', 'CREDIT'];

const TYPE_PILL_STYLE: Record<TransactionType, { bg: string; fg: string }> = {
  EXPENSE:         { bg: 'var(--neg-soft)',    fg: 'var(--neg)' },
  INCOME:          { bg: 'var(--pos-soft)',    fg: 'var(--pos)' },
  DEBIT:           { bg: 'var(--warn-soft)',   fg: 'var(--warn)' },
  CREDIT:          { bg: 'var(--accent-soft)', fg: 'var(--accent-700)' },
  OPENING_BALANCE: { bg: 'var(--surface-2)',   fg: 'var(--text-3)' },
};

const CATEGORY_COLORS: Record<string, string> = {
  Cibo: 'var(--c-food)', Trasporti: 'var(--c-transport)',
  Intrattenimento: 'var(--c-fun)', Casa: 'var(--c-home)',
  Shopping: 'var(--c-shopping)', Salute: 'var(--c-health)',
};
const CATEGORY_SOFT: Record<string, string> = {
  Cibo: 'var(--c-food-soft)', Trasporti: 'var(--c-transport-soft)',
  Intrattenimento: 'var(--c-fun-soft)', Casa: 'var(--c-home-soft)',
  Shopping: 'var(--c-shopping-soft)', Salute: 'var(--c-health-soft)',
};

function catColor(name: string) { return CATEGORY_COLORS[name] ?? 'var(--c-other)'; }
function catSoft(name: string)  { return CATEGORY_SOFT[name]   ?? 'var(--c-other-soft)'; }

// ── sub-row editing state ─────────────────────────────────────────────────────
interface SubEditState {
  subId: string;
  value: string;
  saving: boolean;
}

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, Modal],
  templateUrl: './categories.html',
  styleUrl: './categories.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Categories {
  private readonly svc = inject(CategoryService);

  readonly typeOptions: TransactionType[] = ['EXPENSE', 'INCOME', 'DEBIT', 'CREDIT'];
  readonly typeLabels = TYPE_LABELS;

  readonly categories   = signal<Category[]>([]);
  readonly loading      = signal(true);
  readonly pageError    = signal<string | null>(null);

  // ── category modal ────────────────────────────────────────────────────────
  readonly catModalOpen    = signal(false);
  readonly catModalEditing = signal<Category | null>(null);
  readonly catName         = signal('');
  readonly catType         = signal<TransactionType>('EXPENSE');
  readonly catSaving       = signal(false);
  readonly catError        = signal<string | null>(null);
  readonly catDeleteConfirm = signal(false);

  // ── inline sub editing ───────────────────────────────────────────────────
  /** categoryId → new sub name being typed */
  readonly newSubName  = signal<Record<string, string>>({});
  readonly newSubSaving = signal<Record<string, boolean>>({});
  /** subId currently being renamed */
  readonly subEdit     = signal<SubEditState | null>(null);
  /** subId awaiting delete confirm */
  readonly subDeleteId = signal<string | null>(null);

  // ── categories grouped by type ───────────────────────────────────────────
  readonly grouped = computed(() => {
    const cats = this.categories();
    return TYPE_ORDER
      .map(type => ({
        type,
        label: TYPE_LABELS[type],
        pill: TYPE_PILL_STYLE[type],
        items: cats.filter(c => c.type === type),
      }))
      .filter(g => g.items.length > 0);
  });

  readonly catColor = catColor;
  readonly catSoft  = catSoft;

  typePillBg(type: TransactionType) { return TYPE_PILL_STYLE[type].bg; }
  typePillFg(type: TransactionType) { return TYPE_PILL_STYLE[type].fg; }

  constructor() { this.load(); }

  private load() {
    this.loading.set(true);
    this.svc.getAll().subscribe({
      next:  cats => { this.categories.set(cats); this.loading.set(false); },
      error: ()   => { this.pageError.set('Errore nel caricamento.'); this.loading.set(false); },
    });
  }

  // ── category modal actions ────────────────────────────────────────────────

  openNewCat() {
    this.catModalEditing.set(null);
    this.catName.set('');
    this.catType.set('EXPENSE');
    this.catError.set(null);
    this.catDeleteConfirm.set(false);
    this.catSaving.set(false);
    this.catModalOpen.set(true);
  }

  openEditCat(cat: Category) {
    this.catModalEditing.set(cat);
    this.catName.set(cat.name);
    this.catType.set(cat.type);
    this.catError.set(null);
    this.catDeleteConfirm.set(false);
    this.catSaving.set(false);
    this.catModalOpen.set(true);
  }

  closeCatModal() {
    this.catModalOpen.set(false);
    this.catDeleteConfirm.set(false);
  }

  saveCat() {
    const name = this.catName().trim();
    if (!name) { this.catError.set('Inserisci un nome.'); return; }
    this.catSaving.set(true);
    this.catError.set(null);
    const editing = this.catModalEditing();
    const obs = editing
      ? this.svc.update(editing.id, { name, type: this.catType() })
      : this.svc.create({ name, type: this.catType() });

    obs.subscribe({
      next: saved => {
        if (editing) {
          this.categories.update(list => list.map(c => c.id === saved.id ? saved : c));
        } else {
          this.categories.update(list => [...list, saved]);
        }
        this.catSaving.set(false);
        this.closeCatModal();
      },
      error: () => {
        this.catError.set('Errore durante il salvataggio. Riprova.');
        this.catSaving.set(false);
      },
    });
  }

  confirmDeleteCat()  { this.catDeleteConfirm.set(true); }
  cancelDeleteCat()   { this.catDeleteConfirm.set(false); }

  deleteCat() {
    const cat = this.catModalEditing();
    if (!cat) return;
    this.catSaving.set(true);
    this.svc.delete(cat.id).subscribe({
      next: () => {
        this.categories.update(list => list.filter(c => c.id !== cat.id));
        this.catSaving.set(false);
        this.closeCatModal();
      },
      error: () => {
        this.catError.set('Errore durante l\'eliminazione.');
        this.catSaving.set(false);
      },
    });
  }

  // ── subcategory inline actions ────────────────────────────────────────────

  getNewSubName(categoryId: string): string {
    return this.newSubName()[categoryId] ?? '';
  }

  setNewSubName(categoryId: string, value: string) {
    this.newSubName.update(m => ({ ...m, [categoryId]: value }));
  }

  isNewSubSaving(categoryId: string): boolean {
    return this.newSubSaving()[categoryId] ?? false;
  }

  addSub(cat: Category) {
    const name = (this.newSubName()[cat.id] ?? '').trim();
    if (!name) return;
    this.newSubSaving.update(m => ({ ...m, [cat.id]: true }));
    this.svc.createSubCategory(cat.id, { name, type: cat.type }).subscribe({
      next: sub => {
        this.categories.update(list =>
          list.map(c => c.id === cat.id
            ? { ...c, subCategories: [...c.subCategories, sub] }
            : c
          )
        );
        this.newSubName.update(m => ({ ...m, [cat.id]: '' }));
        this.newSubSaving.update(m => ({ ...m, [cat.id]: false }));
      },
      error: () => {
        this.newSubSaving.update(m => ({ ...m, [cat.id]: false }));
      },
    });
  }

  startEditSub(sub: SubCategory) {
    this.subEdit.set({ subId: sub.id, value: sub.name, saving: false });
    this.subDeleteId.set(null);
  }

  cancelEditSub() { this.subEdit.set(null); }

  saveEditSub(cat: Category) {
    const state = this.subEdit();
    if (!state) return;
    const name = state.value.trim();
    if (!name) return;
    this.subEdit.update(s => s ? { ...s, saving: true } : null);
    this.svc.updateSubCategory(cat.id, state.subId, { name }).subscribe({
      next: updated => {
        this.categories.update(list =>
          list.map(c => c.id === cat.id
            ? { ...c, subCategories: c.subCategories.map(s => s.id === updated.id ? updated : s) }
            : c
          )
        );
        this.subEdit.set(null);
      },
      error: () => {
        this.subEdit.update(s => s ? { ...s, saving: false } : null);
      },
    });
  }

  askDeleteSub(subId: string) {
    this.subDeleteId.set(subId);
    this.subEdit.set(null);
  }

  cancelDeleteSub() { this.subDeleteId.set(null); }

  confirmDeleteSub(cat: Category, subId: string) {
    this.svc.deleteSubCategory(cat.id, subId).subscribe({
      next: () => {
        this.categories.update(list =>
          list.map(c => c.id === cat.id
            ? { ...c, subCategories: c.subCategories.filter(s => s.id !== subId) }
            : c
          )
        );
        this.subDeleteId.set(null);
      },
    });
  }

  isEditingSub(subId: string): boolean {
    return this.subEdit()?.subId === subId;
  }

  isDeletingSub(subId: string): boolean {
    return this.subDeleteId() === subId;
  }

  subEditValue(): string {
    return this.subEdit()?.value ?? '';
  }

  setSubEditValue(v: string) {
    this.subEdit.update(s => s ? { ...s, value: v } : null);
  }

  subEditSaving(): boolean {
    return this.subEdit()?.saving ?? false;
  }

  onSubInputKeydown(event: KeyboardEvent, cat: Category) {
    if (event.key === 'Enter') this.saveEditSub(cat);
    if (event.key === 'Escape') this.cancelEditSub();
  }

  onNewSubKeydown(event: KeyboardEvent, cat: Category) {
    if (event.key === 'Enter') this.addSub(cat);
  }
}
