import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { TransactionService } from './transaction';

describe('TransactionService', () => {
  let service: TransactionService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient()] });
    service = TestBed.inject(TransactionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
