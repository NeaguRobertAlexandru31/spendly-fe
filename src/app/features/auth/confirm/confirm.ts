import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth/auth';

@Component({
  selector: 'app-confirm',
  imports: [FormsModule, RouterLink],
  templateUrl: './confirm.html',
  styleUrl: './confirm.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Confirm implements OnInit {
  email = signal('');
  code = signal('');
  loading = signal(false);
  error = signal('');
  success = signal(false);

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {}

  ngOnInit() {
    const em = this.route.snapshot.queryParamMap.get('email') ?? '';
    this.email.set(em);
  }

  submit() {
    if (this.loading()) return;
    this.error.set('');
    this.loading.set(true);
    this.auth.confirmEmail({ email: this.email(), code: this.code() }).subscribe({
      next: () => this.success.set(true),
      error: (e: { error?: { message?: string } }) => {
        this.error.set(e.error?.message ?? 'Codice non valido');
        this.loading.set(false);
      },
    });
  }

  goToLogin() {
    this.router.navigate(['/auth/login']);
  }
}
