import {
  Component,
  input,
  output,
  effect,
  ChangeDetectionStrategy,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.html',
  styleUrl: './modal.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Modal implements OnDestroy {
  open = input<boolean>(false);
  width = input<number>(520);
  closed = output<void>();

  private escHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') this.closed.emit();
  };

  constructor() {
    effect(() => {
      if (this.open()) {
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', this.escHandler);
      } else {
        document.body.style.overflow = '';
        document.removeEventListener('keydown', this.escHandler);
      }
    });
  }

  ngOnDestroy() {
    document.body.style.overflow = '';
    document.removeEventListener('keydown', this.escHandler);
  }

  onOverlayClick() {
    this.closed.emit();
  }
}
