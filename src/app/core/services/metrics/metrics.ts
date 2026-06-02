import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import type { DashboardMetrics, DashboardQueryParams } from '@core/models/metrics.model';

@Injectable({ providedIn: 'root' })
export class MetricsService {
  constructor(private readonly http: HttpClient) {}

  getDashboard(params: DashboardQueryParams = {}) {
    let httpParams = new HttpParams();
    if (params.month)       httpParams = httpParams.set('month', params.month);
    if (params.categoryId)  httpParams = httpParams.set('categoryId', params.categoryId);
    if (params.type && params.type !== 'ALL') httpParams = httpParams.set('type', params.type);
    if (params.compareWith) httpParams = httpParams.set('compareWith', params.compareWith);
    return this.http.get<DashboardMetrics>('/api/metrics/dashboard', { params: httpParams });
  }
}
