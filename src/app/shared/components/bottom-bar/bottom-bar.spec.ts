import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { signal } from '@angular/core';

import { BottomBar } from './bottom-bar';
import { AuthService } from '@core/services/auth/auth';
import { ModalService } from '@core/services/modal/modal';

describe('BottomBar', () => {
  let component: BottomBar;
  let fixture: ComponentFixture<BottomBar>;

  const mockAuthService = {
    user: signal<{ name: string } | null>(null),
    logout: () => ({ subscribe: (o: { next: () => void }) => o.next() }),
  };

  const mockModalService = {
    isOpen: signal(false),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BottomBar],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
        { provide: ModalService, useValue: mockModalService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BottomBar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should expose nav items', () => {
    expect(component.nav.length).toBe(3);
  });

  it('visible() should be true when modal is closed', () => {
    mockModalService.isOpen.set(false);
    expect(component.visible()).toBe(true);
  });

  it('visible() should be false when modal is open', () => {
    mockModalService.isOpen.set(true);
    expect(component.visible()).toBe(false);
  });

  it('initials() should return empty string when user is null', () => {
    mockAuthService.user.set(null);
    expect(component.initials()).toBe('');
  });

  it('initials() should return uppercase initials from user name', () => {
    mockAuthService.user.set({ name: 'Mario Rossi' });
    expect(component.initials()).toBe('MR');
  });
});
