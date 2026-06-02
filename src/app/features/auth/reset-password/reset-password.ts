import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth/auth';

@Component({
  selector: 'app-reset-password',
  imports: [FormsModule, RouterLink],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPassword implements OnInit {
  email = signal('');
  code = signal('');
  password = signal('');
  showPassword = signal(false);
  loading = signal(false);
  error = signal('');
  success = signal(false);

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.email.set(this.route.snapshot.queryParamMap.get('email') ?? '');
  }

  submit() {
    if (this.loading()) return;
    this.error.set('');
    this.loading.set(true);
    this.auth.resetPassword({ email: this.email(), code: this.code(), password: this.password() }).subscribe({
      next: () => this.success.set(true),
      error: (e: { error?: { message?: string } }) => {
        this.error.set(e.error?.message ?? 'Errore durante il reset');
        this.loading.set(false);
      },
    });
  }
}
