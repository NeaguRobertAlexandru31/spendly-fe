import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '@core/services/auth/auth';
import { ModalService } from '@core/services/modal/modal';
import { Home, List, LogOut, Settings } from '@core/utils/icons';

const NAV = [
  { label: 'Dashboard', icon: Home,     route: '/dashboard' },
  { label: 'Spese',     icon: List,     route: '/transactions' },
  { label: 'Settings',  icon: Settings, route: '/settings' },
] as const;

@Component({
  selector: 'app-bottom-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './bottom-bar.html',
})
export class BottomBar implements OnInit, OnDestroy {
  private readonly auth        = inject(AuthService);
  private readonly router      = inject(Router);
  private readonly modalService = inject(ModalService);

  readonly nav    = NAV;
  readonly LogOut = LogOut;

  private scrollVisible = signal(true);
  readonly modalOpen    = this.modalService.isOpen;

  visible = computed(() => this.scrollVisible() && !this.modalOpen());

  private lastY    = 0;
  private ticking  = false;
  private scrollTarget: Element | Window = window;
  private readonly listener = () => this.onScroll();

  readonly initials = computed(() => {
    const name = this.auth.user()?.name ?? '';
    return name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  });

  ngOnInit() {
    const main = document.querySelector('main');
    this.scrollTarget = main ?? window;
    this.lastY = main ? main.scrollTop : window.scrollY;
    this.scrollTarget.addEventListener('scroll', this.listener, { passive: true });
  }

  ngOnDestroy() {
    this.scrollTarget.removeEventListener('scroll', this.listener);
  }

  private onScroll() {
    if (this.ticking) return;
    this.ticking = true;
    requestAnimationFrame(() => {
      const main = document.querySelector('main');
      const currentY = main ? main.scrollTop : window.scrollY;
      const delta = currentY - this.lastY;
      if (Math.abs(delta) > 6) {
        // scroll giù → nascondi, scroll su → mostra
        this.scrollVisible.set(delta < 0 || currentY < 40);
        this.lastY = currentY;
      }
      this.ticking = false;
    });
  }

  onLogout() {
    this.auth.logout().subscribe({
      next:  () => this.router.navigate(['/auth/login']),
      error: () => { this.auth.user.set(null); this.router.navigate(['/auth/login']); },
    });
  }
}
