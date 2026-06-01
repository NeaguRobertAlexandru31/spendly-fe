import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type { DashboardMetrics } from '@core/models/metrics.model';

@Injectable({ providedIn: 'root' })
export class MetricsService {
  constructor(private readonly http: HttpClient) {}

  getDashboard() {
    return this.http.get<DashboardMetrics>('/api/metrics/dashboard');
  }
}
