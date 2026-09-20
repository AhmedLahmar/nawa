import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TxnKind } from '../core/models';
import { Store } from '../core/store';
import { fmt, UI } from '../ui/ui';

const TXN_META: Record<TxnKind, { label: string; icon: string; tone: string }> = {
  donation: { label: 'Donation', icon: 'heart', tone: 'seed-text' },
  sale: { label: 'Product sale', icon: 'wallet', tone: 'seed-text' },
  gift: { label: 'Live gift', icon: 'gift', tone: 'seed-text' },
  campaign: { label: 'Community round', icon: 'rocket', tone: 'seed-text' },
  payout: { label: 'Payout', icon: 'logout', tone: 'rose-text' },
  purchase: { label: 'Purchase', icon: 'wallet', tone: 'rose-text' },
};

@Component({
  selector: 'app-wallet-page',
  standalone: true,
  imports: [RouterLink, UI],
  template: `
    <div class="page page--narrow">
      <div class="page-head">
        <div class="col g-6">
          <span class="kicker"><app-icon name="wallet" [size]="13" /> Wallet</span>
          <h1 class="display-lg">Earnings</h1>
          <span class="muted sm">Everything your build brings in — campaign funds, product sales, tips and live gifts — in one place.</span>
        </div>
        <button class="btn btn--primary" (click)="payout()"><app-icon name="logout" [size]="15" /> Withdraw</button>
      </div>

      <!-- balance hero -->
      <div class="card card--tint col g-14 pad-lg mb-16">
        <div class="row between wrap g-16">
          <div class="col g-4">
            <span class="up brand-text">Available balance</span>
            <span class="bb" style="font-size:34px;font-family:var(--display);letter-spacing:-.02em">
              {{ fmt.money(store.walletBalance(), store.currency) }}
            </span>
            <span class="tiny faint">Simulated — no real funds are held or moved</span>
          </div>
          <div class="row g-20 wrap">
            <div class="stat"><span class="stat__v seed-text">{{ fmt.money(store.earningsIn(), store.currency) }}</span><span class="stat__l">total in</span></div>
            <div class="stat"><span class="stat__v">{{ store.myOrders().length }}</span><span class="stat__l">your orders</span></div>
            <div class="stat"><span class="stat__v">{{ salesCount() }}</span><span class="stat__l">sales</span></div>
          </div>
        </div>
      </div>

      <!-- breakdown by source -->
      <div class="grid grid-2 mb-16">
        <div class="card col g-12 pad">
          <span class="up faint">Where it comes from</span>
          @for (b of breakdown(); track b.kind) {
            <div class="col g-4">
              <div class="row between sm">
                <span class="row g-8"><app-icon [name]="meta(b.kind).icon" [size]="14" class="seed-text" /> {{ meta(b.kind).label }}</span>
                <span class="b num">{{ fmt.money(b.total, store.currency) }}</span>
              </div>
              <app-bar [pct]="b.pct" tone="seed" [thin]="true" />
            </div>
          }
          @if (!breakdown().length) { <span class="tiny faint">No income yet — sell a product or open a community round.</span> }
        </div>

        <div class="card col g-10 pad">
          <span class="up faint">Grow your earnings</span>
          <a class="hl-row" routerLink="/shop/new">
            <span class="row-ic"><app-icon name="wallet" [size]="16" /></span>
            <span class="grow"><span class="sm b" style="display:block">Sell a product</span><span class="tiny faint">Physical, digital or a service</span></span>
            <app-icon name="chevR" [size]="15" class="faint" />
          </a>
          <a class="hl-row" routerLink="/build/campaign">
            <span class="row-ic"><app-icon name="rocket" [size]="16" /></span>
            <span class="grow"><span class="sm b" style="display:block">Open a community round</span><span class="tiny faint">Raise from people who follow you</span></span>
            <app-icon name="chevR" [size]="15" class="faint" />
          </a>
          <a class="hl-row" routerLink="/live">
            <span class="row-ic"><app-icon name="video" [size]="16" /></span>
            <span class="grow"><span class="sm b" style="display:block">Go live</span><span class="tiny faint">Collect gifts from viewers in real time</span></span>
            <app-icon name="chevR" [size]="15" class="faint" />
          </a>
        </div>
      </div>

      <!-- transactions -->
      <div class="card" style="overflow:hidden">
        <div class="card__head">
          <h4>Transactions</h4>
          <div class="seg">
            @for (f of filters; track f.key) {
              <button [class.on]="filter() === f.key" (click)="filter.set(f.key)">{{ f.label }}</button>
            }
          </div>
        </div>
        @if (txns().length) {
          @for (t of txns(); track t.id) {
            <div class="txn">
              <span class="txn__ic" [class.txn__ic--out]="t.amount < 0">
                <app-icon [name]="meta(t.kind).icon" [size]="16" />
              </span>
              <div class="grow col g-2" style="min-width:0">
                <span class="sm b clamp-1">{{ t.label }}</span>
                <span class="tiny faint">
                  {{ meta(t.kind).label }}
                  @if (t.counterpartyId && party(t.counterpartyId)) { · {{ party(t.counterpartyId) }} }
                  · {{ t.at }}
                </span>
              </div>
              <span class="b num nowrap" [class.seed-text]="t.amount > 0" [class.rose-text]="t.amount < 0">
                {{ t.amount > 0 ? '+' : '' }}{{ fmt.money(t.amount, t.currency) }}
              </span>
            </div>
          }
        } @else {
          <app-empty icon="wallet" title="No transactions in this filter" text="Money in and out shows up here." />
        }
      </div>

      <span class="mock-note mt-16"><app-icon name="lock" [size]="11" /> This wallet is conceptual — Nawa never processes real payments in this demo</span>
    </div>
  `,
  styles: [`
    .txn { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-top: 1px solid var(--line-2); }
    .txn:first-of-type { border-top: 0; }
    .txn__ic { width: 38px; height: 38px; border-radius: 11px; display: grid; place-items: center; flex: none;
      background: var(--seed-100); color: var(--seed-600); }
    .txn__ic--out { background: var(--canvas-2); color: var(--muted); }
    .row-ic { width: 34px; height: 34px; border-radius: 10px; display: grid; place-items: center; flex: none;
      background: var(--brand-50); color: var(--brand-600); }
  `],
})
export class WalletPage {
  readonly store = inject(Store);
  readonly fmt = fmt;
  readonly filter = signal('all');
  readonly filters = [
    { key: 'all', label: 'All' },
    { key: 'in', label: 'In' },
    { key: 'out', label: 'Out' },
  ];

  readonly txns = computed(() => {
    const f = this.filter();
    const all = this.store.transactions();
    if (f === 'in') return all.filter(t => t.amount > 0);
    if (f === 'out') return all.filter(t => t.amount < 0);
    return all;
  });

  readonly salesCount = computed(() => this.store.transactions().filter(t => t.kind === 'sale').length);

  readonly breakdown = computed(() => {
    const income = this.store.transactions().filter(t => t.amount > 0);
    const total = income.reduce((n, t) => n + t.amount, 0) || 1;
    const byKind = new Map<TxnKind, number>();
    for (const t of income) byKind.set(t.kind, (byKind.get(t.kind) ?? 0) + t.amount);
    return [...byKind.entries()]
      .map(([kind, sum]) => ({ kind, total: sum, pct: Math.round((sum / total) * 100) }))
      .sort((a, b) => b.total - a.total);
  });

  meta = (k: TxnKind) => TXN_META[k];
  party = (id: string) => this.store.person(id)?.name ?? this.store.startup(id)?.name ?? '';

  payout(): void {
    this.store.toast('Withdrawals are simulated — no funds move in this demo', '🔒');
  }
}
