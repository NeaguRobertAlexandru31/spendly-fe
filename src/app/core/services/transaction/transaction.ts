import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type {
  CreateTransactionRequest,
  Transaction,
  UpdateTransactionRequest,
} from '@core/models/transaction.model';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  constructor(private readonly http: HttpClient) {}

  getAll() {
    return this.http.get<Transaction[]>('/api/transactions');
  }

  getById(id: string) {
    return this.http.get<Transaction>(`/api/transactions/${id}`);
  }

  create(dto: CreateTransactionRequest) {
    return this.http.post<Transaction>('/api/transactions', dto);
  }

  update(id: string, dto: UpdateTransactionRequest) {
    return this.http.patch<Transaction>(`/api/transactions/${id}`, dto);
  }

  delete(id: string) {
    return this.http.delete<void>(`/api/transactions/${id}`);
  }

  upsertOpeningBalance(year: number, month: number, amount: string) {
    return this.http.patch<Transaction>(`/api/transactions/opening-balance/${year}/${month}`, { amount });
  }
}
