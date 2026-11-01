import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UI } from '../ui/ui';

type Way = 'tip' | 'buy' | 'preorder' | 'round';

const WAYS: { key: Way; label: string; gives: string; gets: string; icon: string; route: string }[] = [
  { key: 'tip', label: 'Tip', gives: 'Any amount', gets: 'Nothing in return — pure support', icon: 'heart', route: '/discover' },
  { key: 'buy', label: 'Buy', gives: 'The product price', gets: 'Something that exists today', icon: 'bag', route: '/shop' },
  { key: 'preorder', label: 'Pre-order', gives: 'The launch price', gets: 'The product once it ships', icon: 'clock', route: '/shop' },
  { key: 'round', label: 'Community round', gives: 'A pledge tier', gets: 'Perks and updates, not equity', icon: 'dollar', route: '/fund' },
];

/** Explains the four ways money moves on Nawa, highlighting the ones relevant to the current page. */
@Component({
  selector: 'app-money-guide',
  standalone: true,
  imports: [RouterLink, UI],
  template: `
    <section class="mg mb-16" aria-labelledby="mg-title">
      <h2 id="mg-title" class="sr-only">Ways to support a founder</h2>
      @for (w of ways; track w.key) {
        <a class="mg__i" [class.mg__i--on]="highlight().includes(w.key)" [routerLink]="w.route"
          [attr.aria-current]="highlight().includes(w.key) ? 'page' : null">
          <span class="mg__ic"><app-icon [name]="w.icon" [size]="15" /></span>
          <span class="col" style="min-width:0">
            <span class="sm b">{{ w.label }}</span>
            <span class="tiny muted">You give: {{ w.gives }}</span>
            <span class="tiny muted">You get: {{ w.gets }}</span>
          </span>
        </a>
      }
    </section>
  `,
  styles: [`
    .mg { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
    .mg__i { display: flex; gap: 10px; align-items: flex-start; padding: 11px 12px; border-radius: 12px;
      border: 1px solid var(--line); background: var(--surface); color: var(--text); }
    .mg__i:hover { border-color: var(--brand-300); }
    .mg__i--on { border-color: var(--brand-300); background: var(--brand-50); }
    .mg__ic { width: 28px; height: 28px; border-radius: 8px; display: grid; place-items: center; flex: none;
      background: var(--canvas-2); color: var(--brand-600); }
    .mg__i--on .mg__ic { background: var(--surface); }
    @media (max-width: 860px) { .mg { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  `],
})
export class MoneyGuide {
  readonly highlight = input<Way[]>([]);
  readonly ways = WAYS;
}
