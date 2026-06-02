import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@core/services/auth/auth';

@Component({
  selector: 'app-change-password',
  imports: [FormsModule],
  templateUrl: './change-password.html',
  styleUrl: './change-password.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangePassword {
  currentPassword = signal('');
  newPassword = signal('');
  showCurrent = signal(false);
  showNew = signal(false);
  loading = signal(false);
  error = signal('');
  success = signal(false);

  constructor(private readonly auth: AuthService) {}

  submit() {
    if (this.loading()) return;
    this.error.set('');
    this.loading.set(true);
    this.auth.changePassword({ currentPassword: this.currentPassword(), newPassword: this.newPassword() }).subscribe({
      next: () => { this.success.set(true); this.loading.set(false); },
      error: (e: { error?: { message?: string } }) => {
        this.error.set(e.error?.message ?? 'Errore durante il cambio password');
        this.loading.set(false);
      },
    });
  }
}
