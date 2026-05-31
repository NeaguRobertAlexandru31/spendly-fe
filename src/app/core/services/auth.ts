import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import type {
  AuthUser,
  ChangePasswordRequest,
  ConfirmEmailRequest,
  ForgotPasswordRequest,
  LoginRequest,
  MessageResponse,
  RegisterRequest,
  ResetPasswordRequest,
} from '@core/models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly user = signal<AuthUser | null>(null);

  constructor(private readonly http: HttpClient) {}

  register(dto: RegisterRequest) {
    return this.http.post<MessageResponse>('/api/auth/register', dto);
  }

  confirmEmail(dto: ConfirmEmailRequest) {
    return this.http.post<MessageResponse>('/api/auth/confirm', dto);
  }

  login(dto: LoginRequest) {
    return this.http.post<MessageResponse>('/api/auth/login', dto).pipe(
      tap(() => this.fetchMe().subscribe()),
    );
  }

  logout() {
    return this.http.post<MessageResponse>('/api/auth/logout', {}).pipe(
      tap(() => this.user.set(null)),
    );
  }

  fetchMe() {
    return this.http.get<AuthUser>('/api/auth/me').pipe(
      tap(u => this.user.set(u)),
    );
  }

  forgotPassword(dto: ForgotPasswordRequest) {
    return this.http.post<MessageResponse>('/api/auth/forgot-password', dto);
  }

  resetPassword(dto: ResetPasswordRequest) {
    return this.http.post<MessageResponse>('/api/auth/reset-password', dto);
  }

  changePassword(dto: ChangePasswordRequest) {
    return this.http.patch<MessageResponse>('/api/auth/change-password', dto);
  }
}
