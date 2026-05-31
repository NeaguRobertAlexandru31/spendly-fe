import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth-guard/auth-guard';
import { guestGuard } from './core/guards/guest-guard/guest-guard';
import { Shell } from './shared/components/shell/shell';

export const routes: Routes = [
  {
    path: 'auth',
    canActivate: [guestGuard],
    children: [
      { path: 'login',           loadComponent: () => import('./features/auth/login/login').then(m => m.Login) },
      { path: 'register',        loadComponent: () => import('./features/auth/register/register').then(m => m.Register) },
      { path: 'confirm',         loadComponent: () => import('./features/auth/confirm/confirm').then(m => m.Confirm) },
      { path: 'forgot-password', loadComponent: () => import('./features/auth/forgot-password/forgot-password').then(m => m.ForgotPassword) },
      { path: 'reset-password',  loadComponent: () => import('./features/auth/reset-password/reset-password').then(m => m.ResetPassword) },
      { path: '',                redirectTo: 'login', pathMatch: 'full' },
    ],
  },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard',    loadComponent: () => import('./features/dashboard/dashboard').then(m => m.Dashboard) },
      { path: 'transactions', loadComponent: () => import('./features/transactions/transactions').then(m => m.Transactions) },
      { path: 'settings',     loadComponent: () => import('./features/settings/settings').then(m => m.Settings) },
      { path: '',             redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '/auth/login' },
];
