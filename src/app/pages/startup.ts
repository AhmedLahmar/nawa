import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '../core/store';
import { CARDS } from '../feed/cards';
import { PostCard } from '../feed/post-card';
import { DonateDialog, DonationsLedger } from '../feed/donate';
import { fmt, UI } from '../ui/ui';

@Component({
  selector: 'app-startup-page',
  standalone: true,
  imports: [RouterLink, UI, CARDS, PostCard, DonateDialog, DonationsLedger],
  template: `
    @if (s(); as s) {
      <div class="page page--narrow">
        <!-- ---------- header ---------- -->
        <div class="card card--lg" style="overflow:hidden">
          <div class="cover" [style.background]="s.gradient"></div>
          <div class="pad-lg col g-16" style="margin-top:-38px">
            <div class="row between wrap g-16" style="align-items:flex-end">
              <div class="row g-14" style="align-items:flex-end">
                <app-av [name]="s.name" [emoji]="s.emoji" [gradient]="s.gradient" [size]="82" [square]="true"
                  style="box-shadow:0 0 0 4px var(--surface)" />
                <div>
                  <div class="row g-8 wrap">
                    <h1 style="font-size:27px">{{ s.name }}</h1>
                    @if (s.buildInPublic) { <span class="day-pill">🌱 Building in public — Day {{ s.day }}</span> }
                  </div>
                  <p class="muted" style="margin-top:4px">{{ s.tagline }}</p>
                </div>
              </div>
              <div class="row g-8">
                <button class="btn btn--primary" (click)="store.toggleFollow(s.id, s.name)">
                  @if (store.isFollowing(s.id)) { Following ✓ } @else { <app-icon name="plus" [size]="15" /> Follow journey }
                </button>
                @if (campaign(); as c) {
                  <a class="btn btn--seed" [routerLink]="['/fund', c.id]"><app-icon name="rocket" [size]="15" /> Support</a>
                }
                <button class="btn btn--outline-brand" (click)="tip.set(true)"><app-icon name="heart" [size]="15" /> Tip</button>
                <button class="btn btn--icon" (click)="store.toast('Link copied to clipboard (demo)', '🔗')">
                  <app-icon name="link" [size]="16" />
                </button>
              </div>
            </div>

            <div class="row g-6 wrap">
              <span class="tag tag--brand">{{ s.industry }}</span>
              <span class="tag"><app-icon name="pin" [size]="11" /> {{ s.city }}, {{ s.country }}</span>
              <span class="tag"><app-icon name="users" [size]="11" /> {{ fmt.k(s.followers) }} followers</span>
              <span class="tag"><app-icon name="rocket" [size]="11" /> {{ s.supporters }} supporters</span>
              @if (incubator(); as i) {
                <a class="tag tag--seed" [routerLink]="['/incubators', i.slug]">🏢 {{ i.name }}</a>
              }
            </div>

            <div class="divider"></div>

            <!-- founder -->
            <div class="row between wrap g-12">
              <a class="row g-11" [routerLink]="['/u', founder()?.handle]">
                <app-av [name]="founder()?.name ?? ''" [size]="44" [verified]="founder()?.verified ?? false" />
                <span>
                  <span class="row g-6">
                    <span class="b">{{ founder()?.name }}</span>
                    <span class="tag tag--seed">Founder Score {{ founderScore() }}</span>
                  </span>
                  <span class="tiny faint">{{ founder()?.title }} · {{ founder()?.daysBuilding }} days building in public</span>
                </span>
              </a>
              <div class="row g-8">
                @for (t of s.team.slice(1); track t.name) {
                  <span class="row g-6 tag"><app-av [name]="t.name" [size]="20" /> {{ t.name }} · {{ t.role }}</span>
                }
              </div>
            </div>
          </div>

          <div class="tabs" style="padding:0 12px">
            @for (t of tabs; track t.key) {
              <button class="tab" [class.on]="tab() === t.key" (click)="setTab(t.key)">{{ t.label }}</button>
            }
          </div>
        </div>

        <!-- ---------- overview ---------- -->
        @if (tab() === 'overview') {
          <div class="col g-16 mt-16">
            <div class="card">
              <div class="card__head"><h4>Stage</h4><span class="tiny faint">Updated Day {{ s.day }}</span></div>
              <div class="card__body"><app-stages [stages]="s.stages" /></div>
            </div>

            <div class="card">
              <div class="card__head">
                <h4>Traction</h4>
                <span class="tiny faint">Published by the founder · last 7 weeks</span>
              </div>
              <div class="grid grid-2" style="gap:1px;background:var(--line-2)">
                @for (k of s.kpis; track k.label) {
                  <div style="background:var(--surface);padding:16px 18px">
                    <div class="row between">
                      <span class="stat__l">{{ k.label }}</span>
                      @if (k.delta) { <span class="stat__d" [class]="k.tone === 'rose' ? 'rose-text' : 'seed-text'">{{ k.delta }}</span> }
                    </div>
                    <div class="stat__v" style="margin:2px 0 6px">{{ k.value }}</div>
                    <app-spark [series]="k.trend ?? []" [color]="sparkColor(k.tone)" [height]="34" />
                  </div>
                }
              </div>
            </div>

            <div class="grid grid-2">
              <div class="card col g-10 pad">
                <span class="up rose-text">The problem</span>
                <p class="sm">{{ s.problem }}</p>
              </div>
              <div class="card col g-10 pad">
                <span class="up seed-text">The solution</span>
                <p class="sm">{{ s.solution }}</p>
              </div>
            </div>

            <div class="card col g-12 pad">
              <span class="up faint">How it makes money</span>
              <p class="sm">{{ s.businessModel }}</p>
              <div class="divider"></div>
              <span class="up faint">Market</span>
              <p class="sm">{{ s.market }}</p>
            </div>

            @if (campaign(); as c) {
              <div class="card card--seed-tint">
                <div class="card__head" style="border-bottom:0">
                  <h4>Community round · {{ c.status }}</h4>
                  <span class="tag tag--amber">{{ c.daysLeft }} days left</span>
                </div>
                <div class="col g-12" style="padding:0 18px 18px">
                  <app-bar [pct]="pct(c.raised, c.goal)" tone="amber" [thick]="true" />
                  <div class="row between wrap g-12">
                    <div class="stat">
                      <span class="stat__v">{{ fmt.money(c.raised, c.currency) }}</span>
                      <span class="stat__l">raised of {{ fmt.n(c.goal) }} {{ c.currency }}</span>
                    </div>
                    <div class="stat"><span class="stat__v">{{ c.backers }}</span><span class="stat__l">supporters</span></div>
                    <div class="stat"><span class="stat__v">{{ pct(c.raised, c.goal) }}%</span><span class="stat__l">funded</span></div>
                    <a class="btn btn--seed" [routerLink]="['/fund', c.id]">Open campaign <app-icon name="chevR" [size]="15" /></a>
                  </div>
                  <span class="mock-note"><app-icon name="lock" [size]="11" /> Conceptual demo — no real financial transactions</span>
                </div>
              </div>
            }

            @if (products().length) {
              <div class="col g-12">
                <div class="row between">
                  <h4>Shop this startup</h4>
                  <a class="link tiny" routerLink="/shop">All products →</a>
                </div>
                <div class="grid grid-3">
                  @for (p of products(); track p.id) {
                    <a class="card card--hover col" [routerLink]="['/shop', p.id]" style="overflow:hidden;text-decoration:none">
                      <app-media [emoji]="p.emoji" [caption]="p.title" [gradient]="p.gradient" ratio="16x9" [radius]="0" />
                      <div class="col g-4 pad-sm">
                        <span class="sm b clamp-2">{{ p.title }}</span>
                        <span class="b num seed-text">{{ fmt.money(p.price, p.currency) }}</span>
                      </div>
                    </a>
                  }
                </div>
              </div>
            }

            <app-donations-ledger [startupId]="s.id" />

            @if (s.endorsements.length) {
              <div class="card">
                <div class="card__head"><h4>Expert endorsements</h4><a class="link tiny" routerLink="/experts">Find experts</a></div>
                <div class="card__body col g-14">
                  @for (e of s.endorsements; track e.expertId) {
                    <div class="row-t g-11">
                      <app-av [name]="store.person(e.expertId)?.name ?? ''" [size]="38" [verified]="true" />
                      <div class="grow">
                        <div class="row g-6">
                          <a class="sm b hoverline" [routerLink]="['/u', store.person(e.expertId)?.handle]">{{ store.person(e.expertId)?.name }}</a>
                          <span class="tag tag--brand">Expert</span>
                          <span class="tiny faint">{{ e.at }}</span>
                        </div>
                        <p class="sm muted" style="margin-top:3px">“{{ e.quote }}”</p>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }

            @if (videos().length) {
              <div class="col g-12">
                <h4>Video updates</h4>
                <div class="scroll-x">
                  @for (v of videos(); track v.id) {
                    <div style="width:186px;flex:none"><app-video-card [v]="v" /></div>
                  }
                </div>
              </div>
            }
          </div>
        }

        <!-- ---------- journey ---------- -->
        @if (tab() === 'journey') {
          <div class="col g-16 mt-16">
            <div class="card">
              <div class="card__head">
                <h4>The journey so far</h4>
                <span class="tiny faint">Day 1 → Day {{ s.day }}</span>
              </div>
              <div class="card__body">
                <div class="jstrip">
                  @for (n of s.journey; track n.day) {
                    <div class="jnode" [class.done]="n.status === 'done'" [class.now]="n.status === 'now'">
                      <div class="jnode__dot">
                        @if (n.status === 'done') { <app-icon name="check" [size]="10" [weight]="3.4" /> }
                      </div>
                      <div class="tiny b" style="margin-top:8px">Day {{ n.day }}</div>
                      <div class="tiny muted" style="margin-top:2px">{{ n.emoji }} {{ n.label }}</div>
                    </div>
                  }
                </div>
              </div>
            </div>

            <div class="card">
              <div class="card__head"><h4>Milestones in detail</h4></div>
              <div class="card__body">
                <div class="tl">
                  @for (n of s.journey; track n.day) {
                    <div class="tl__i" [class]="n.status">
                      <div class="tl__dot">
                        @if (n.status === 'done') { <app-icon name="check" [size]="10" [weight]="3.4" /> }
                        @else if (n.status === 'now') { <span style="width:6px;height:6px;border-radius:50%;background:#fff"></span> }
                      </div>
                      <div class="row g-8 wrap">
                        <span class="tag" [class.tag--seed]="n.status === 'done'" [class.tag--brand]="n.status === 'now'">Day {{ n.day }}</span>
                        <span class="b">{{ n.emoji }} {{ n.label }}</span>
                        @if (n.status === 'next') { <span class="tag">planned</span> }
                      </div>
                      @if (n.detail) { <p class="sm muted" style="margin-top:4px">{{ n.detail }}</p> }
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>
        }

        <!-- ---------- updates ---------- -->
        @if (tab() === 'updates') {
          <div class="col g-16 mt-16" style="max-width:640px;margin-inline:auto">
            @if (posts().length) {
              @for (p of posts(); track p.id) { <app-post-card [post]="p" /> }
            } @else {
              <app-empty icon="edit" title="No public updates yet"
                text="When the founder publishes their first Build in Public update it will appear here." />
            }
          </div>
        }

        <!-- ---------- community ---------- -->
        @if (tab() === 'community') {
          <div class="col g-16 mt-16">
            <div class="card">
              <div class="stat-grid">
                <div class="stat"><span class="stat__v">{{ fmt.k(s.followers) }}</span><span class="stat__l">followers</span></div>
                <div class="stat"><span class="stat__v">{{ s.supporters }}</span><span class="stat__l">supporters</span></div>
                <div class="stat"><span class="stat__v">{{ s.endorsements.length }}</span><span class="stat__l">expert endorsements</span></div>
                <div class="stat"><span class="stat__v">{{ posts().length }}</span><span class="stat__l">public updates</span></div>
              </div>
            </div>

            <div class="card">
              <div class="card__head"><h4>People following this build</h4></div>
              <div class="card__body" style="padding:6px 16px 14px">
                @for (p of community(); track p.id) {
                  <div class="hl-row">
                    <app-av [name]="p.name" [size]="36" [verified]="p.verified" />
                    <span class="grow">
                      <a class="sm b hoverline" [routerLink]="['/u', p.handle]">{{ p.name }}</a>
                      <span class="tiny faint" style="display:block">{{ p.title }} · {{ p.city }}</span>
                    </span>
                    <span class="tag">{{ p.role }}</span>
                  </div>
                }
              </div>
            </div>

            @if (mentor(); as m) {
              <div class="card card--tint col g-12 pad">
                <span class="up brand-text">Assigned mentor</span>
                <div class="row g-11">
                  <app-av [name]="m.name" [size]="44" [verified]="true" />
                  <div class="grow">
                    <a class="b hoverline" [routerLink]="['/u', m.handle]">{{ m.name }}</a>
                    <div class="tiny faint">{{ m.title }}</div>
                  </div>
                  <a class="btn btn--sm" routerLink="/messages">Message</a>
                </div>
              </div>
            }
          </div>
        }
      </div>

      @if (tip()) {
        <app-donate-dialog [toStartupId]="s.id" source="startup" (close)="tip.set(false)" />
      }
    } @else {
      <div class="page">
        <app-empty icon="compass" title="Startup not found" text="This page may have been part of an earlier demo session.">
          <a class="btn btn--primary btn--sm" routerLink="/discover">Back to Discover</a>
        </app-empty>
      </div>
    }
  `,
})
export class StartupPage {
  readonly store = inject(Store);
  private route = inject(ActivatedRoute);
  readonly fmt = fmt;

  private params = toSignal(this.route.paramMap);
  private query = toSignal(this.route.queryParamMap);

  constructor() {
    // open the tip dialog when arrived via ?tip=1 (e.g. from a product page)
    effect(() => { if (this.query()?.get('tip') === '1') this.tip.set(true); });
  }

  readonly tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'journey', label: 'Journey' },
    { key: 'updates', label: 'Updates' },
    { key: 'community', label: 'Community' },
  ];
  private manualTab = signal<string | null>(null);
  readonly tab = computed(() => this.manualTab() ?? this.query()?.get('tab') ?? 'overview');
  readonly tip = signal(false);

  readonly s = computed(() => this.store.startupBySlug(this.params()?.get('slug') ?? ''));
  readonly founder = computed(() => {
    const s = this.s();
    return s ? this.store.person(s.founderId) : undefined;
  });
  readonly founderScore = computed(() => {
    const f = this.founder();
    return f?.id === 'u_me' ? this.store.myScore() : f?.founderScore ?? 0;
  });
  readonly campaign = computed(() => {
    const s = this.s();
    return s ? this.store.campaignOf(s.id) : undefined;
  });
  readonly incubator = computed(() => this.store.incubatorById(this.s()?.incubatorId));
  readonly mentor = computed(() => {
    const id = this.s()?.mentorId;
    return id ? this.store.person(id) : undefined;
  });
  readonly posts = computed(() => {
    const s = this.s();
    return s ? this.store.postsOf(s.id) : [];
  });
  readonly videos = computed(() => {
    const s = this.s();
    return s ? this.store.videosOf(s.id) : [];
  });
  readonly products = computed(() => {
    const s = this.s();
    return s ? this.store.productsOfStartup(s.id) : [];
  });
  readonly community = computed(() =>
    this.store.people().filter(p => p.role === 'supporter' || p.role === 'expert').slice(0, 6));

  pct = (a: number, b: number) => fmt.pct(a, b);
  sparkColor = (tone?: string) =>
    tone === 'amber' ? 'var(--amber-500)' : tone === 'rose' ? 'var(--rose-500)' : tone === 'brand' ? 'var(--brand-600)' : 'var(--seed-500)';

  setTab(t: string): void { this.manualTab.set(t); }
}
