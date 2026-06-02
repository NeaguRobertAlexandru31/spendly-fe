import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { CategoryService } from './category';

describe('CategoryService', () => {
  let service: CategoryService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient()] });
    service = TestBed.inject(CategoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
