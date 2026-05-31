import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

const TABS = [
  { label: 'Categorie',     route: 'categories' },
  { label: 'Profilo',       route: 'profile' },
  { label: 'Preferenze',    route: 'preferences' },
] as const;

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Settings {
  readonly tabs = TABS;
}
