import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Register {
  name = signal('');
  email = signal('');
  password = signal('');
  showPassword = signal(false);
  accepted = signal(false);
  loading = signal(false);
  error = signal('');

  readonly strength = computed(() => {
    const p = this.password();
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  });

  readonly strengthLabel = computed(() => ['', 'Debole', 'Discreta', 'Buona', 'Forte'][this.strength()]);
  readonly strengthColor = computed(() =>
    ['', 'var(--neg)', 'var(--warn)', 'var(--accent)', 'var(--pos)'][this.strength()],
  );

  constructor(private readonly auth: AuthService, private readonly router: Router) {}

  submit() {
    if (this.loading() || !this.accepted()) return;
    this.error.set('');
    this.loading.set(true);
    this.auth.register({ name: this.name(), email: this.email(), password: this.password() }).subscribe({
      next: () => this.router.navigate(['/auth/confirm'], { queryParams: { email: this.email() } }),
      error: (e: { error?: { message?: string } }) => {
        this.error.set(e.error?.message ?? 'Errore durante la registrazione');
        this.loading.set(false);
      },
    });
  }
}
