import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { animate, style, transition, trigger } from '@angular/animations';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import { AuthService } from '@core/services/auth/auth';
import {
  ChevronLeft,
  ChevronRight,
  Home,
  List,
  LogOut,
  Settings,
} from '@core/utils/icons';

const NAV = [
  { label: 'Dashboard', icon: Home, route: '/dashboard' },
  { label: 'Spese', icon: List, route: '/transactions' },
  { label: 'Impostazioni', icon: Settings, route: '/settings' },
] as const;

@Component({
  selector: 'app-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './sidebar.html',
  animations: [
    trigger('label', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-6px)' }),
        animate('140ms 190ms ease-out', style({ opacity: 1, transform: 'translateX(0)' })),
      ]),
      transition(':leave', [
        animate('80ms ease-in', style({ opacity: 0, transform: 'translateX(-6px)' })),
      ]),
    ]),
  ],
})
export class Sidebar {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  collapsed = signal(false);
  readonly nav = NAV;
  readonly ChevronLeft = ChevronLeft;
  readonly ChevronRight = ChevronRight;
  readonly LogOut = LogOut;

  readonly user = this.auth.user;
  readonly initials = computed(() => {
    const name = this.auth.user()?.name ?? '';
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  });

  toggle() {
    this.collapsed.update(v => !v);
  }

  onLogout() {
    this.auth.logout().subscribe({
      next: () => this.router.navigate(['/auth/login']),
      error: () => {
        this.auth.user.set(null);
        this.router.navigate(['/auth/login']);
      },
    });
  }
}
