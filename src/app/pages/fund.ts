import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Store } from '../core/store';
import { CARDS } from '../feed/cards';
import { fmt, UI } from '../ui/ui';

const SORTS = [
  { key: 'trending', label: 'Trending' },
  { key: 'closing', label: 'Closing soon' },
  { key: 'new', label: 'Just opened' },
  { key: 'funded', label: 'Most funded' },
];

@Component({
  selector: 'app-fund-page',
  standalone: true,
  imports: [RouterLink, UI, CARDS],
  template: `
    <div class="page">
      <div class="page-head">
        <div class="col g-6">
          <span class="kicker"><app-icon name="dollar" [size]="13" /> Community rounds</span>
          <h1 class="display-lg">Fund founders you have been following</h1>
          <span class="muted sm" style="max-width:560px">
            Every round here is backed by a public build history — updates, milestones and numbers you can read
            before you decide.
          </span>
        </div>
        <div class="col g-8" style="align-items:flex-end">
          <span class="mock-note"><app-icon name="lock" [size]="11" /> Conceptual demo — no real financial transactions</span>
          @if (store.myStartups().length) {
            <a class="btn btn--primary" routerLink="/build/campaign"><app-icon name="plus" [size]="15" /> Open your round</a>
          }
        </div>
      </div>

      <div class="card card--tint row between wrap g-16 pad mb-16">
        <div class="row g-24 wrap">
          <div class="stat"><span class="stat__v">{{ fmt.money(totalRaised(), store.currency) }}</span><span class="stat__l">pledged in the demo</span></div>
          <div class="stat"><span class="stat__v">{{ campaigns().length }}</span><span class="stat__l">open rounds</span></div>
          <div class="stat"><span class="stat__v">{{ totalBackers() }}</span><span class="stat__l">supporters</span></div>
          <div class="stat"><span class="stat__v">{{ avgFunded() }}%</span><span class="stat__l">average progress</span></div>
        </div>
        <span class="tiny faint" style="max-width:260px">
          Figures are fictional and illustrate how the product would work — nothing is charged, ever.
        </span>
      </div>

      <div class="row between wrap g-12 mb-16">
        <div class="seg">
          @for (s of sorts; track s.key) {
            <button [class.on]="sort() === s.key" (click)="sort.set(s.key)">{{ s.label }}</button>
          }
        </div>
        <div class="row g-6 wrap">
          <button class="chip" [class.chip--on]="ind() === 'all'" (click)="ind.set('all')">All sectors</button>
          @for (i of industries(); track i) {
            <button class="chip" [class.chip--on]="ind() === i" (click)="ind.set(i)">{{ i }}</button>
          }
        </div>
      </div>

      @if (sorted().length) {
        <div class="grid grid-auto">
          @for (c of sorted(); track c.id) { <app-campaign-card [c]="c" /> }
        </div>
      } @else {
        <app-empty icon="dollar" title="No rounds in this sector yet"
          text="Try another filter — or follow founders early so you are there when they open a round." />
      }

      <div class="card card--flat col g-10 pad-lg mt-24">
        <h4>How a community round works here</h4>
        <div class="grid grid-4">
          @for (s of steps; track s.t) {
            <div class="col g-6">
              <span style="font-size:19px">{{ s.e }}</span>
              <span class="sm b">{{ s.t }}</span>
              <span class="tiny muted">{{ s.d }}</span>
            </div>
          }
        </div>
        <span class="mock-note mt-8"><app-icon name="shield" [size]="11" /> Not an investment offering — rewards-based support, simulated for this demo</span>
      </div>
    </div>
  `,
})
export class FundPage {
  readonly store = inject(Store);
  readonly fmt = fmt;
  readonly sorts = SORTS;
  readonly sort = signal('trending');
  readonly ind = signal('all');

  readonly steps = [
    { e: '📣', t: 'Build first', d: 'Founders publish weekly updates long before they ask for money.' },
    { e: '🎯', t: 'Set a goal', d: 'A specific amount tied to a milestone, with use of funds shown openly.' },
    { e: '🚀', t: 'Community backs it', d: 'The people who followed the journey support it and pick a reward.' },
    { e: '📈', t: 'Report back', d: 'Progress updates continue after the round — that is the whole point.' },
  ];

  readonly campaigns = computed(() => this.store.campaigns().filter(c => c.status !== 'upcoming'));
  readonly industries = computed(() => {
    const set = new Set<string>();
    for (const c of this.campaigns()) {
      const s = this.store.startup(c.startupId);
      if (s) set.add(s.industry);
    }
    return [...set];
  });

  readonly sorted = computed(() => {
    const ind = this.ind();
    let list = this.campaigns();
    if (ind !== 'all') list = list.filter(c => this.store.startup(c.startupId)?.industry === ind);
    const pct = (c: { raised: number; goal: number }) => c.raised / c.goal;
    switch (this.sort()) {
      case 'closing': return [...list].sort((a, b) => a.daysLeft - b.daysLeft);
      case 'new': return [...list].sort((a, b) => Number(!!b.isNew) - Number(!!a.isNew));
      case 'funded': return [...list].sort((a, b) => pct(b) - pct(a));
      default: return [...list].sort((a, b) => Number(!!b.trending) - Number(!!a.trending) || pct(b) - pct(a));
    }
  });

  readonly totalRaised = computed(() => this.campaigns().reduce((n, c) => n + c.raised, 0));
  readonly totalBackers = computed(() => this.campaigns().reduce((n, c) => n + c.backers, 0));
  readonly avgFunded = computed(() => {
    const list = this.campaigns();
    if (!list.length) return 0;
    return Math.round(list.reduce((n, c) => n + (c.raised / c.goal) * 100, 0) / list.length);
  });
}
