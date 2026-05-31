import { Component } from '@angular/core';
import { Routes } from '@angular/router';

@Component({ standalone: true, template: `<div style="padding:40px;font-family:sans-serif"><h2>✅ Login riuscito — dashboard in arrivo</h2></div>` })
class DashboardPlaceholder {}

export const routes: Routes = [
  {
    path: 'auth',
    children: [
      { path: 'login',           loadComponent: () => import('./features/auth/login/login').then(m => m.Login) },
      { path: 'register',        loadComponent: () => import('./features/auth/register/register').then(m => m.Register) },
      { path: 'confirm',         loadComponent: () => import('./features/auth/confirm/confirm').then(m => m.Confirm) },
      { path: 'forgot-password', loadComponent: () => import('./features/auth/forgot-password/forgot-password').then(m => m.ForgotPassword) },
      { path: 'reset-password',  loadComponent: () => import('./features/auth/reset-password/reset-password').then(m => m.ResetPassword) },
      { path: '',                redirectTo: 'login', pathMatch: 'full' },
    ],
  },
  { path: 'dashboard', component: DashboardPlaceholder },
  { path: '',          redirectTo: '/auth/login', pathMatch: 'full' },
  { path: '**',        redirectTo: '/auth/login' },
];
