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

  it('color() should return fallback for unknown category', () => {
    fixture.componentRef.setInput('name', 'Sconosciuta');
    expect(component.color()).toBe('var(--c-other)');
  });

  it('soft() should return fallback for unknown category', () => {
    fixture.componentRef.setInput('name', 'Sconosciuta');
    expect(component.soft()).toBe('var(--c-other-soft)');
  });

  it('color() should return mapped value for known category', () => {
    fixture.componentRef.setInput('name', 'Cibo');
    expect(component.color()).toBe('var(--c-food)');
  });

  it('soft() should return mapped value for known category', () => {
    fixture.componentRef.setInput('name', 'Cibo');
    expect(component.soft()).toBe('var(--c-food-soft)');
  });

  it('color() should map "Cibo & Spesa" to food color', () => {
    fixture.componentRef.setInput('name', 'Cibo & Spesa');
    expect(component.color()).toBe('var(--c-food)');
  });

  it('size input defaults to md', () => {
    expect(component.size()).toBe('md');
  });
});
