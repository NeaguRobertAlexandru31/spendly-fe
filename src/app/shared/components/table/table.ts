import {
  Component,
  input,
  output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TableColumn<T = unknown> {
  key: string;
  label: string;
  sortable?: boolean;
  align?: 'left' | 'right' | 'center';
  width?: string;
}

export interface SortState {
  key: string;
  dir: 'asc' | 'desc';
}

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './table.html',
  styleUrl: './table.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Table<T = unknown> {
  columns = input<TableColumn<T>[]>([]);
  sort = input<SortState | null>(null);
  sortChanged = output<SortState>();

  onSort(col: TableColumn<T>) {
    if (!col.sortable) return;
    const current = this.sort();
    const dir: 'asc' | 'desc' =
      current?.key === col.key && current.dir === 'asc' ? 'desc' : 'asc';
    this.sortChanged.emit({ key: col.key, dir });
  }

  isSorted(key: string): 'asc' | 'desc' | null {
    const s = this.sort();
    return s?.key === key ? s.dir : null;
  }
}
