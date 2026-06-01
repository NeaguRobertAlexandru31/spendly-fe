import type { CategoryRef, TransactionType } from '@core/models/category.model';

export interface Transaction {
  id: string;
  amount: string;
  currency: string;
  date: string;
  type: TransactionType;
  description?: string | null;
  isRecurring: boolean;
  recurringLabel?: string | null;
  recurringTemplateId?: string | null;
  category?: CategoryRef | null;
  subCategory?: CategoryRef | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionRequest {
  amount: string;
  date: string;
  type: TransactionType;
  currency?: string;
  description?: string;
  isRecurring?: boolean;
  recurringLabel?: string;
  categoryId?: string;
  subCategoryId?: string;
}

export type UpdateTransactionRequest = Partial<CreateTransactionRequest>;
