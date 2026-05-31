import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  email = signal('');
  password = signal('');
  showPassword = signal(false);
  loading = signal(false);
  error = signal('');

  constructor(private readonly auth: AuthService, private readonly router: Router) {}

  submit() {
    if (this.loading()) return;
    this.error.set('');
    this.loading.set(true);
    this.auth.login({ email: this.email(), password: this.password() }).subscribe({
      next: () => { this.loading.set(false); this.router.navigate(['/dashboard']); },
      error: (e: { error?: { message?: string } }) => {
        this.error.set(e.error?.message ?? 'Errore durante il login');
        this.loading.set(false);
      },
    });
  }
}
