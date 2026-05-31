import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardMetric } from './card-metric';

describe('CardMetric', () => {
  let component: CardMetric;
  let fixture: ComponentFixture<CardMetric>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardMetric],
    }).compileComponents();

    fixture = TestBed.createComponent(CardMetric);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
