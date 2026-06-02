import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { MetricsService } from './metrics';

describe('MetricsService', () => {
  let service: MetricsService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient()] });
    service = TestBed.inject(MetricsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
