import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type {
  Category,
  CreateCategoryRequest,
  CreateSubCategoryRequest,
  SubCategory,
  UpdateCategoryRequest,
  UpdateSubCategoryRequest,
} from '@core/models/category.model';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  constructor(private readonly http: HttpClient) {}

  getAll() {
    return this.http.get<Category[]>('/api/categories');
  }

  getById(id: string) {
    return this.http.get<Category>(`/api/categories/${id}`);
  }

  create(dto: CreateCategoryRequest) {
    return this.http.post<Category>('/api/categories', dto);
  }

  update(id: string, dto: UpdateCategoryRequest) {
    return this.http.patch<Category>(`/api/categories/${id}`, dto);
  }

  delete(id: string) {
    return this.http.delete<void>(`/api/categories/${id}`);
  }

  createSubCategory(categoryId: string, dto: CreateSubCategoryRequest) {
    return this.http.post<SubCategory>(`/api/categories/${categoryId}/subcategories`, dto);
  }

  updateSubCategory(categoryId: string, subId: string, dto: UpdateSubCategoryRequest) {
    return this.http.patch<SubCategory>(`/api/categories/${categoryId}/subcategories/${subId}`, dto);
  }

  deleteSubCategory(categoryId: string, subId: string) {
    return this.http.delete<void>(`/api/categories/${categoryId}/subcategories/${subId}`);
  }
}
