import { Component, inject } from '@angular/core';
import { Store } from '../core/store';

@Component({
  selector: 'app-toast-host',
  standalone: true,
  template: `
    <div class="toast-host">
      @for (t of store.toasts(); track t.id) {
        <div class="toast"><span>{{ t.emoji }}</span><span>{{ t.text }}</span></div>
      }
    </div>
  `,
})
export class ToastHost {
  readonly store = inject(Store);
}
