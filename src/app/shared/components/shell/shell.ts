import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { animate, query, style, transition, trigger } from '@angular/animations';

import { Sidebar } from '../sidebar/sidebar';
import { BottomBar } from '../bottom-bar/bottom-bar';

export const routeAnim = trigger('routeAnim', [
  transition('* <=> *', [
    query(':enter', [
      style({ opacity: 0, transform: 'translateY(10px)' }),
      animate('220ms cubic-bezier(0.25,0.46,0.45,0.94)',
        style({ opacity: 1, transform: 'translateY(0)' })),
    ], { optional: true }),
  ]),
]);

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, Sidebar, BottomBar],
  templateUrl: './shell.html',
  animations: [routeAnim],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Shell {}
