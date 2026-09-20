import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Product, ProductType } from '../core/models';
import { Store } from '../core/store';
import { fmt, UI } from '../ui/ui';

const TYPE_META: Record<ProductType, { label: string; icon: string; tag: string }> = {
  physical: { label: 'Physical', icon: 'gift', tag: 'tag--seed' },
  digital: { label: 'Digital', icon: 'book', tag: 'tag--brand' },
  service: { label: 'Service', icon: 'cap', tag: 'tag--amber' },
};

/* ============================================================
   SHOP (storefront listing)
   ============================================================ */
@Component({
  selector: 'app-shop-page',
  standalone: true,
  imports: [RouterLink, FormsModule, UI],
  template: `
    <div class="page">
      <div class="page-head">
        <div class="col g-6">
          <span class="kicker"><app-icon name="wallet" [size]="13" /> Marketplace</span>
          <h1 class="display-lg">Shop the community</h1>
          <span class="muted sm">Products, templates and services from founders building in public. Every purchase supports a real (fictional) journey.</span>
        </div>
        <a class="btn btn--primary" routerLink="/shop/new"><app-icon name="plus" [size]="15" /> Sell a product</a>
      </div>

      <div class="row g-6 scroll-x mb-16">
        @for (f of filters; track f.key) {
          <button class="chip chip--sm" [class.chip--on]="filter() === f.key" (click)="filter.set(f.key)">
            {{ f.label }}
          </button>
        }
      </div>

      @if (featured().length && filter() === 'all') {
        <div class="col g-10 mb-16">
          <h4>Featured</h4>
          <div class="grid grid-3">
            @for (p of featured(); track p.id) {
              <div class="card card--hover col" style="overflow:hidden">
                <a [routerLink]="['/shop', p.id]">
                  <app-media [emoji]="p.emoji" [caption]="p.title" [gradient]="p.gradient" ratio="16x9" [radius]="0" [tag]="tm(p.type).label" />
                </a>
                <div class="col g-8 pad-sm">
                  <div class="row between">
                    <span class="tag" [class]="tm(p.type).tag">{{ p.category }}</span>
                    @if (p.rating > 0) { <span class="tiny b amber-text">★ {{ p.rating }}</span> }
                  </div>
                  <a class="b hoverline" [routerLink]="['/shop', p.id]">{{ p.title }}</a>
                  <span class="tiny muted clamp-2">{{ p.tagline }}</span>
                  <div class="row between" style="align-items:flex-end">
                    <span class="b num">{{ fmt.money(p.price, p.currency) }}</span>
                    <span class="tiny faint">{{ p.sold }} sold</span>
                  </div>
                  <a class="btn btn--sm btn--block btn--primary" [routerLink]="['/shop', p.id]">View</a>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <div class="grid grid-3">
        @for (p of list(); track p.id) {
          <div class="card card--hover col" style="overflow:hidden">
            <a [routerLink]="['/shop', p.id]">
              <app-media [emoji]="p.emoji" [caption]="p.title" [gradient]="p.gradient" ratio="16x9" [radius]="0" [tag]="tm(p.type).label" />
            </a>
            <div class="col g-8 pad-sm">
              <div class="row between">
                <span class="tag" [class]="tm(p.type).tag">{{ p.category }}</span>
                @if (p.rating > 0) { <span class="tiny b amber-text">★ {{ p.rating }}</span> }
              </div>
              <a class="b hoverline" [routerLink]="['/shop', p.id]">{{ p.title }}</a>
              <span class="tiny muted clamp-2">{{ p.tagline }}</span>
              <div class="row g-6 tiny faint">
                <app-icon name="pin" [size]="11" /> {{ startupName(p.startupId) }}
              </div>
              <div class="row between" style="align-items:flex-end">
                <div class="row g-6" style="align-items:baseline">
                  <span class="b num" style="font-size:15px">{{ fmt.money(p.price, p.currency) }}</span>
                  @if (p.compareAt) { <span class="tiny faint" style="text-decoration:line-through">{{ p.compareAt }}</span> }
                </div>
                <span class="tiny faint">{{ p.sold }} sold</span>
              </div>
              <a class="btn btn--sm btn--block btn--primary" [routerLink]="['/shop', p.id]">View</a>
            </div>
          </div>
        }
      </div>

      @if (!list().length) {
        <app-empty icon="wallet" title="No products in this filter"
          text="Try another category, or list the first product yourself.">
          <a class="btn btn--primary btn--sm" routerLink="/shop/new">Sell a product</a>
        </app-empty>
      }

      <span class="mock-note mt-16"><app-icon name="lock" [size]="11" /> Checkout is simulated — no payment is processed and nothing ships</span>
    </div>
  `,
})
export class ShopPage {
  readonly store = inject(Store);
  readonly fmt = fmt;
  readonly filter = signal('all');
  readonly filters = [
    { key: 'all', label: 'Everything' },
    { key: 'physical', label: '📦 Physical' },
    { key: 'digital', label: '💾 Digital' },
    { key: 'service', label: '🎧 Services' },
  ];

  readonly featured = computed(() => this.store.featuredProducts());
  readonly list = computed(() => {
    const f = this.filter();
    const all = this.store.products();
    return f === 'all' ? all : all.filter(p => p.type === f);
  });

  tm = (t: ProductType) => TYPE_META[t];
  startupName = (id: string) => this.store.startup(id)?.name ?? 'Nawa founder';
}

/* ============================================================
   PRODUCT DETAIL + CHECKOUT
   ============================================================ */
@Component({
  selector: 'app-product-page',
  standalone: true,
  imports: [RouterLink, FormsModule, UI],
  template: `
    <div class="page page--narrow">
      @if (product(); as p) {
        <a class="link tiny row g-4 mb-16" routerLink="/shop"><app-icon name="arrowL" [size]="13" /> Back to shop</a>

        <div class="wsgrid">
          <div class="col g-16">
            <app-media [emoji]="p.emoji" [caption]="p.title" [gradient]="p.gradient" ratio="16x9" [radius]="14" />

            <div class="card col g-14 pad">
              <div class="row between wrap g-8">
                <span class="tag" [class]="tm(p.type).tag"><app-icon [name]="tm(p.type).icon" [size]="12" /> {{ tm(p.type).label }}</span>
                <span class="tag tag--outline">{{ p.category }}</span>
              </div>
              <h2>{{ p.title }}</h2>
              <span class="muted">{{ p.tagline }}</span>
              <div class="row g-8">
                <app-av [name]="seller()?.name ?? ''" [size]="30" [verified]="seller()?.verified ?? false" />
                <span class="sm">by <a class="b hoverline" [routerLink]="['/u', seller()?.handle]">{{ seller()?.name }}</a>
                  · <a class="hoverline" [routerLink]="['/s', startup()?.slug]">{{ startup()?.name }}</a></span>
              </div>
              <div class="divider"></div>
              <p class="sm" style="line-height:1.6">{{ p.description }}</p>

              <span class="up faint">What you get</span>
              @for (inc of p.includes; track inc) {
                <div class="row-t g-8 sm"><app-icon name="check" [size]="14" class="seed-text" /> {{ inc }}</div>
              }

              @if (p.type === 'digital' && p.deliveryNote) {
                <div class="panel panel--brand row-t g-8"><app-icon name="zap" [size]="15" class="brand-text" /><span class="sm">{{ p.deliveryNote }}</span></div>
              }
            </div>

            <!-- reviews -->
            <div class="card col g-12 pad">
              <div class="row between">
                <h4>Reviews</h4>
                @if (p.rating > 0) { <span class="b amber-text">★ {{ p.rating }} · {{ p.reviews.length }}</span> }
              </div>
              @if (p.reviews.length) {
                @for (r of p.reviews; track r.id) {
                  <div class="row-t g-10">
                    <app-av [name]="store.person(r.authorId)?.name ?? 'User'" [size]="32" />
                    <div class="grow">
                      <div class="row g-6"><span class="sm b">{{ store.person(r.authorId)?.name ?? 'User' }}</span>
                        <span class="tiny amber-text">{{ stars(r.rating) }}</span>
                        <span class="tiny faint">{{ r.at }}</span></div>
                      <div class="sm muted">{{ r.text }}</div>
                    </div>
                  </div>
                }
              } @else { <span class="tiny faint">No reviews yet — be the first after you buy.</span> }

              <div class="divider"></div>
              <span class="up faint">Leave a review</span>
              <div class="row g-6">
                @for (n of [1,2,3,4,5]; track n) {
                  <button class="star-btn" [class.on]="myRating() >= n" (click)="myRating.set(n)">★</button>
                }
              </div>
              <textarea class="textarea" rows="2" [(ngModel)]="reviewText" placeholder="How was it?"></textarea>
              <button class="btn btn--sm" [disabled]="!myRating() || !reviewText.trim()" (click)="review(p.id)">Post review</button>
            </div>
          </div>

          <!-- buy box -->
          <div class="col g-16">
            <div class="card col g-12 pad" style="position:sticky;top:16px">
              <div class="row g-8" style="align-items:baseline">
                <span class="bb" style="font-size:24px;font-family:var(--display)">{{ fmt.money(p.price, p.currency) }}</span>
                @if (p.compareAt) { <span class="faint" style="text-decoration:line-through">{{ p.compareAt }}</span> }
              </div>
              @if (p.type === 'physical' && p.stock != null) {
                <span class="tiny" [class.rose-text]="p.stock === 0" [class.faint]="p.stock > 0">
                  {{ p.stock > 0 ? p.stock + ' in stock' : 'Out of stock' }}
                </span>
              }

              @if (p.type === 'physical') {
                <div class="row g-8">
                  <span class="sm muted grow">Quantity</span>
                  <button class="btn btn--icon btn--sm" (click)="dec()"><app-icon name="minus" [size]="14" /></button>
                  <span class="b num" style="min-width:24px;text-align:center">{{ qty() }}</span>
                  <button class="btn btn--icon btn--sm" (click)="inc(p.stock)"><app-icon name="plus" [size]="14" /></button>
                </div>
              }

              @if (p.type === 'service' && p.slots?.length) {
                <span class="up faint">Pick a slot</span>
                <div class="row g-6 wrap">
                  @for (sl of p.slots ?? []; track sl) {
                    <button class="chip chip--sm" [class.chip--on]="slot() === sl" (click)="slot.set(sl)">{{ sl }}</button>
                  }
                </div>
              }

              <div class="divider"></div>
              <div class="row between sm"><span class="muted">Total</span><span class="b num">{{ fmt.money(total(p), p.currency) }}</span></div>

              @if (!bought()) {
                <button class="btn btn--primary btn--lg btn--block"
                  [disabled]="(p.type === 'physical' && p.stock === 0) || (p.type === 'service' && !slot())"
                  (click)="buy(p)">
                  <app-icon name="wallet" [size]="16" /> {{ p.type === 'service' ? 'Book & pay' : 'Buy now' }}
                </button>
              } @else {
                <div class="panel panel--seed col g-4">
                  <div class="row g-8"><app-icon name="check" [size]="16" class="seed-text" /><span class="sm b">Order confirmed</span></div>
                  <span class="tiny muted">{{ confirmMsg(p) }}</span>
                </div>
                <a class="btn btn--sm btn--block" routerLink="/wallet">View in wallet</a>
              }
              <span class="mock-note"><app-icon name="lock" [size]="11" /> Simulated — no payment taken</span>
            </div>

            <button class="btn btn--outline-brand btn--block" (click)="donate(p)">
              <app-icon name="heart" [size]="15" /> Or just tip the founder
            </button>
          </div>
        </div>
      } @else {
        <app-empty icon="wallet" title="Product not found" text="It may have been removed.">
          <a class="btn btn--primary btn--sm" routerLink="/shop">Back to shop</a>
        </app-empty>
      }
    </div>
  `,
  styles: [`
    .star-btn { font-size: 22px; line-height: 1; color: var(--line-2); background: none; border: 0; cursor: pointer; }
    .star-btn.on { color: var(--amber-500); }
    .wsgrid { display: grid; grid-template-columns: minmax(0,1fr) 300px; gap: 16px; align-items: start; }
    @media (max-width: 1020px) { .wsgrid { grid-template-columns: 1fr; } }
  `],
})
export class ProductPage {
  readonly store = inject(Store);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  readonly fmt = fmt;

  private id = toSignal(this.route.paramMap);
  readonly product = computed(() => this.store.product(this.id()?.get('id') ?? undefined));
  readonly seller = computed(() => { const p = this.product(); return p ? this.store.person(p.sellerId) : undefined; });
  readonly startup = computed(() => { const p = this.product(); return p ? this.store.startup(p.startupId) : undefined; });

  readonly qty = signal(1);
  readonly slot = signal('');
  readonly bought = signal(false);
  readonly myRating = signal(0);
  reviewText = '';

  tm = (t: ProductType) => TYPE_META[t];
  stars = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n);
  total = (p: Product) => p.price * (p.type === 'physical' ? this.qty() : 1);

  inc(stock?: number): void { this.qty.update(q => (stock != null ? Math.min(stock, q + 1) : q + 1)); }
  dec(): void { this.qty.update(q => Math.max(1, q - 1)); }

  buy(p: Product): void {
    this.store.buyProduct(p.id, p.type === 'physical' ? this.qty() : 1, this.slot() || undefined);
    this.bought.set(true);
  }

  confirmMsg(p: Product): string {
    if (p.type === 'digital') return 'Your download is ready in your wallet (simulated).';
    if (p.type === 'service') return `Booked for ${this.slot()}. The founder will confirm in Messages.`;
    return 'Shipping details would be collected here in a real store.';
  }

  review(id: string): void {
    this.store.addReview(id, this.myRating(), this.reviewText.trim());
    this.reviewText = '';
    this.myRating.set(0);
  }

  donate(p: Product): void {
    this.router.navigate(['/s', this.startup()?.slug], { queryParams: { tip: 1 } });
  }
}

/* ============================================================
   SELL A PRODUCT
   ============================================================ */
@Component({
  selector: 'app-sell-page',
  standalone: true,
  imports: [RouterLink, FormsModule, UI],
  template: `
    <div class="page page--narrow">
      <a class="link tiny row g-4 mb-16" routerLink="/shop"><app-icon name="arrowL" [size]="13" /> Back to shop</a>
      <div class="card card--lg">
        <div class="pad-lg col g-18">
          <div class="col g-6">
            <span class="kicker">Marketplace</span>
            <h1>List a product</h1>
            <p class="muted">Sell a physical good, a digital download, or a service — attached to your startup {{ store.activeStartup().name }}.</p>
          </div>

          <div class="field">
            <label>Type</label>
            <div class="row g-8">
              @for (t of types; track t.key) {
                <button class="chip" [class.chip--on]="type() === t.key" (click)="type.set(t.key)">{{ t.emoji }} {{ t.label }}</button>
              }
            </div>
          </div>

          <div class="grid grid-2">
            <div class="field"><label>Title</label><input class="input" [(ngModel)]="title" placeholder="e.g. Weekly Farm Box" /></div>
            <div class="field"><label>Category</label><input class="input" [(ngModel)]="category" placeholder="e.g. Food & produce" /></div>
          </div>
          <div class="field"><label>One-line pitch</label><input class="input" [(ngModel)]="tagline" placeholder="What it is, in a sentence" /></div>
          <div class="field"><label>Description</label><textarea class="textarea" rows="4" [(ngModel)]="description"></textarea></div>

          <div class="grid grid-2">
            <div class="field"><label>Price ({{ store.currency }})</label><input class="input num" type="number" min="0" step="5" [(ngModel)]="price" /></div>
            <div class="field"><label>Emoji</label><input class="input" [(ngModel)]="emoji" maxlength="2" /></div>
          </div>

          @if (type() === 'physical') {
            <div class="field"><label>Stock</label><input class="input num" type="number" min="0" [(ngModel)]="stock" /></div>
          }
          @if (type() === 'service') {
            <div class="field"><label>Available slots (comma separated)</label><input class="input" [(ngModel)]="slotsRaw" placeholder="Tue 10:00, Wed 15:00" /></div>
          }
          @if (type() === 'digital') {
            <div class="field"><label>Delivery note</label><input class="input" [(ngModel)]="deliveryNote" placeholder="How the buyer receives it" /></div>
          }

          <div class="field"><label>What's included (one per line)</label><textarea class="textarea" rows="3" [(ngModel)]="includesRaw" placeholder="First thing&#10;Second thing"></textarea></div>

          <div class="row between">
            <a class="btn btn--ghost" routerLink="/shop">Cancel</a>
            <button class="btn btn--primary btn--lg" [disabled]="!title.trim() || price <= 0" (click)="create()">
              <app-icon name="plus" [size]="16" /> List product
            </button>
          </div>
          <span class="mock-note"><app-icon name="lock" [size]="11" /> Listings are conceptual — nothing is charged or shipped in this demo</span>
        </div>
      </div>
    </div>
  `,
})
export class SellPage {
  readonly store = inject(Store);
  private router = inject(Router);

  readonly types = [
    { key: 'physical' as ProductType, label: 'Physical', emoji: '📦' },
    { key: 'digital' as ProductType, label: 'Digital', emoji: '💾' },
    { key: 'service' as ProductType, label: 'Service', emoji: '🎧' },
  ];
  readonly type = signal<ProductType>('physical');

  title = '';
  tagline = '';
  category = '';
  description = '';
  price = 30;
  emoji = '🛍️';
  stock = 50;
  slotsRaw = '';
  deliveryNote = '';
  includesRaw = '';

  create(): void {
    const p = this.store.createProduct({
      type: this.type(),
      title: this.title.trim(),
      tagline: this.tagline.trim() || this.title.trim(),
      description: this.description.trim() || this.tagline.trim(),
      price: Number(this.price) || 0,
      category: this.category.trim() || 'General',
      emoji: this.emoji.trim() || '🛍️',
      includes: this.includesRaw.split('\n').map(s => s.trim()).filter(Boolean),
      stock: this.type() === 'physical' ? Number(this.stock) : undefined,
      slots: this.type() === 'service' ? this.slotsRaw.split(',').map(s => s.trim()).filter(Boolean) : undefined,
      deliveryNote: this.type() === 'digital' ? (this.deliveryNote.trim() || undefined) : undefined,
    });
    this.router.navigate(['/shop', p.id]);
  }
}
