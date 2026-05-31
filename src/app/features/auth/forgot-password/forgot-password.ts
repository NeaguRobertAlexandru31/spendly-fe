import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth';

@Component({
  selector: 'app-forgot-password',
  imports: [FormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPassword {
  email = signal('');
  loading = signal(false);
  sent = signal(false);

  constructor(private readonly auth: AuthService, private readonly router: Router) {}

  submit() {
    if (this.loading()) return;
    this.loading.set(true);
    this.auth.forgotPassword({ email: this.email() }).subscribe({
      next: () => { this.loading.set(false); this.sent.set(true); },
      error: () => { this.loading.set(false); this.sent.set(true); },
    });
  }

  goToLogin() {
    this.router.navigate(['/auth/login']);
  }
}
