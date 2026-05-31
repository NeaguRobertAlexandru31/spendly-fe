export type TransactionType = 'INCOME' | 'EXPENSE' | 'CREDIT' | 'DEBIT';

export interface CategoryRef {
  id: string;
  name: string;
}

export interface SubCategory {
  id: string;
  name: string;
  type: TransactionType;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  subCategories: SubCategory[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryRequest {
  name: string;
  type: TransactionType;
}

export interface UpdateCategoryRequest {
  name?: string;
  type?: TransactionType;
}

export interface CreateSubCategoryRequest {
  name: string;
  type: TransactionType;
}

export interface UpdateSubCategoryRequest {
  name?: string;
  type?: TransactionType;
}
