import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoryBadge } from './category-badge';

describe('CategoryBadge', () => {
  let component: CategoryBadge;
  let fixture: ComponentFixture<CategoryBadge>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoryBadge],
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryBadge);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
