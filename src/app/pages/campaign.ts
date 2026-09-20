import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Store } from '../core/store';
import { Post, Reward } from '../core/models';
import { PostCard } from '../feed/post-card';
import { CARDS } from '../feed/cards';
import { fmt, UI } from '../ui/ui';

@Component({
  selector: 'app-campaign-page',
  standalone: true,
  imports: [RouterLink, FormsModule, UI, CARDS, PostCard],
  template: `
    @if (c(); as c) {
      <div class="page">
        <div class="mockbar mb-16" style="border:1px dashed var(--line);border-radius:10px">
          <app-icon name="lock" [size]="13" />
          <span><b>Conceptual funding.</b> This campaign is part of a product demo — no payment is processed, no card is
            collected and no money moves at any point.</span>
        </div>

        <div class="cgrid">
          <!-- ============ left: the story ============ -->
          <div class="col g-16">
            @if (s(); as s) {
              <div class="card" style="overflow:hidden">
                <div class="cover" [style.background]="s.gradient">
                  <div class="row g-8" style="position:absolute;bottom:12px;left:14px;right:14px">
                    <span class="day-pill">🌱 Day {{ s.day }} in public</span>
                    <span class="tag tag--ink" style="background:rgba(10,10,18,.5);color:#fff">{{ s.industry }}</span>
                    @if (c.trending) { <span class="tag tag--amber">🔥 Trending</span> }
                  </div>
                </div>
                <div class="col g-14 pad-lg">
                  <div class="row g-12">
                    <app-av [name]="s.name" [emoji]="s.emoji" [gradient]="s.gradient" [size]="52" [square]="true" />
                    <div class="grow">
                      <a class="row g-6 hoverline" [routerLink]="['/s', s.slug]">
                        <span class="bb lg">{{ s.name }}</span>
                        <app-icon name="chevR" [size]="14" class="faint" />
                      </a>
                      <span class="tiny muted">{{ s.city }}, {{ s.country }} · {{ fmt.k(s.followers) }} followers</span>
                    </div>
                  </div>
                  <h1 style="font-size:25px;line-height:1.25">{{ c.headline }}</h1>
                  <p class="lg muted">{{ c.pitch }}</p>
                </div>
              </div>
            }

            <div class="card">
              <div class="card__head"><h4>Why people back this</h4></div>
              <div class="card__body col g-10">
                @for (w of c.why; track w) {
                  <div class="row-t g-10">
                    <app-icon name="check" [size]="15" class="seed-text" style="margin-top:2px" />
                    <span class="sm">{{ w }}</span>
                  </div>
                }
              </div>
            </div>

            @if (proof().length) {
              <div class="col g-12">
                <div class="row between">
                  <h4>The receipts — updates from the build</h4>
                  @if (s(); as s) {
                    <a class="link tiny" [routerLink]="['/s', s.slug]" [queryParams]="{ tab: 'updates' }">All updates →</a>
                  }
                </div>
                @for (p of proof(); track p.id) { <app-post-card [post]="p" /> }
              </div>
            }

            <div class="card">
              <div class="card__head"><h4>Where the money goes</h4><span class="tiny faint">planned allocation</span></div>
              <div class="card__body row g-20 wrap">
                <app-donut [slices]="c.useOfFunds" [size]="150" [centerTop]="fmt.n(c.goal) + ''" [centerSub]="c.currency + ' goal'" />
                <div class="col g-10 grow" style="min-width:220px">
                  @for (u of c.useOfFunds; track u.label) {
                    <div class="col g-4">
                      <div class="row between">
                        <span class="row g-8 sm">
                          <i [style.background]="u.color" style="width:10px;height:10px;border-radius:3px"></i>
                          {{ u.label }}
                        </span>
                        <span class="sm b num">{{ u.pct }}%</span>
                      </div>
                      <div class="bar bar--thin"><div class="bar__fill" [style.background]="u.color" [style.width.%]="u.pct"></div></div>
                    </div>
                  }
                </div>
              </div>
            </div>

            <div class="card">
              <div class="card__head"><h4>Funding milestones</h4></div>
              <div class="card__body">
                <div class="tl">
                  @for (m of c.milestones; track m.label) {
                    <div class="tl__i" [class.done]="c.raised >= m.amount" [class.now]="c.raised < m.amount && next(c) === m.label">
                      <div class="tl__dot">
                        @if (c.raised >= m.amount) { <app-icon name="check" [size]="10" [weight]="3.4" /> }
                      </div>
                      <div class="row g-8 wrap">
                        <span class="b sm">{{ m.label }}</span>
                        <span class="tag" [class.tag--seed]="c.raised >= m.amount">{{ fmt.money(m.amount, c.currency) }}</span>
                      </div>
                    </div>
                  }
                </div>
              </div>
            </div>

            <div class="card">
              <div class="card__head"><h4>Support tiers</h4><span class="mock-note">rewards are illustrative</span></div>
              <div class="card__body col g-12">
                @for (r of c.rewards; track r.id) {
                  <div class="card card--flat col g-10 pad" [class.card--tint]="picked()?.id === r.id">
                    <div class="row between wrap g-8">
                      <span class="bb">{{ r.title }}</span>
                      <span class="tag tag--brand">{{ fmt.money(r.amount, c.currency) }}</span>
                    </div>
                    <span class="sm muted">{{ r.desc }}</span>
                    @if (r.perks.length) {
                      <div class="col g-4">
                        @for (p of r.perks; track p) {
                          <span class="row g-8 tiny"><app-icon name="check" [size]="12" class="seed-text" /> {{ p }}</span>
                        }
                      </div>
                    }
                    <div class="row between wrap g-8">
                      <span class="tiny faint">
                        {{ r.claimed }} supporters
                        @if (r.limit) { · {{ r.limit - r.claimed }} of {{ r.limit }} left }
                      </span>
                      <button class="btn btn--sm btn--outline-brand" (click)="open(r)">Choose this tier</button>
                    </div>
                  </div>
                }
              </div>
            </div>

            <div class="grid grid-2">
              <div class="card">
                <div class="card__head"><h4>Questions</h4></div>
                <div class="card__body col g-12">
                  @for (f of c.faqs; track f.q) {
                    <div class="col g-4">
                      <span class="sm b">{{ f.q }}</span>
                      <span class="tiny muted">{{ f.a }}</span>
                    </div>
                  }
                </div>
              </div>
              <div class="card">
                <div class="card__head"><h4>Risks the founder named</h4></div>
                <div class="card__body col g-10">
                  @for (r of c.risks; track r) {
                    <div class="row-t g-9">
                      <app-icon name="alert" [size]="14" class="amber-text" style="margin-top:2px" />
                      <span class="tiny muted">{{ r }}</span>
                    </div>
                  }
                  <span class="tiny faint">Founders who name risks early keep supporters longer.</span>
                </div>
              </div>
            </div>
          </div>

          <!-- ============ right: the ask ============ -->
          <div class="col g-16 sticky">
            <div class="card col g-14 pad">
              <div class="row between">
                <span class="tag" [class.tag--seed]="c.status === 'funded'" [class.tag--amber]="c.status === 'live'">
                  {{ c.status === 'funded' ? 'Goal reached' : 'Round open' }}
                </span>
                <span class="tiny faint">{{ c.daysLeft }} days left</span>
              </div>
              <div class="col g-4">
                <span class="display-lg" style="font-size:29px">{{ fmt.money(c.raised, c.currency) }}</span>
                <span class="tiny muted">pledged of {{ fmt.n(c.goal) }} {{ c.currency }} goal</span>
              </div>
              <app-bar [pct]="pct()" tone="amber" [thick]="true" />
              <div class="row between">
                <div class="stat"><span class="stat__v">{{ c.backers }}</span><span class="stat__l">supporters</span></div>
                <div class="stat"><span class="stat__v">{{ pct() }}%</span><span class="stat__l">funded</span></div>
                <div class="stat"><span class="stat__v">{{ c.daysLeft }}</span><span class="stat__l">days left</span></div>
              </div>

              @if (store.hasBacked(c.id)) {
                <div class="panel panel--seed col g-6">
                  <span class="row g-8 b sm"><app-icon name="check" [size]="14" class="seed-text" /> You are backing this round</span>
                  <span class="tiny muted">Simulated support recorded. You will get every update from here on.</span>
                </div>
                <a class="btn btn--block" routerLink="/home">Follow the updates</a>
              } @else {
                <button class="btn btn--seed btn--lg btn--block" (click)="open()">
                  <app-icon name="rocket" [size]="16" /> Support this round
                </button>
                <span class="mock-note" style="justify-content:center">Simulated — no payment is taken</span>
              }

              <div class="divider"></div>
              <div class="row g-8">
                <button class="btn btn--sm grow" (click)="store.toast('Link copied to clipboard (demo)', '🔗')">
                  <app-icon name="link" [size]="14" /> Share
                </button>
                @if (s(); as s) {
                  <button class="btn btn--sm grow" (click)="store.toggleFollow(s.id, s.name)">
                    @if (store.isFollowing(s.id)) { Following ✓ } @else { Follow build }
                  </button>
                }
              </div>
            </div>

            @if (founder(); as f) {
              <div class="card col g-12 pad">
                <span class="up faint">Who you are backing</span>
                <a class="row g-11" [routerLink]="['/u', f.handle]">
                  <app-av [name]="f.name" [size]="46" [verified]="f.verified" />
                  <span class="grow">
                    <span class="b sm hoverline">{{ f.name }}</span>
                    <span class="tiny faint" style="display:block">{{ f.title }}</span>
                  </span>
                </a>
                <div class="stat-grid" style="margin:0 -14px">
                  <div class="stat"><span class="stat__v">{{ f.founderScore }}</span><span class="stat__l">Founder Score</span></div>
                  <div class="stat"><span class="stat__v">{{ f.daysBuilding }}</span><span class="stat__l">days in public</span></div>
                  <div class="stat"><span class="stat__v">{{ fmt.k(f.followers) }}</span><span class="stat__l">followers</span></div>
                </div>
                <a class="btn btn--sm btn--block" routerLink="/messages"><app-icon name="message" [size]="14" /> Ask a question</a>
              </div>
            }

            @if (s(); as s) {
              <div class="card col g-10 pad">
                <span class="up faint">Traction behind the ask</span>
                @for (k of s.kpis; track k.label) {
                  <div class="row between">
                    <span class="tiny muted">{{ k.label }}</span>
                    <span class="row g-8"><span class="sm b num">{{ k.value }}</span>
                      @if (k.delta) { <span class="tiny b seed-text">{{ k.delta }}</span> }</span>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      </div>

      <!-- ============ simulated support modal ============ -->
      @if (modal()) {
        <div class="modal-scrim" (click)="close()">
          <div class="modal" (click)="$event.stopPropagation()">
            @if (!done()) {
              <div class="modal__h">
                <div class="col g-4">
                  <h3>Support {{ s()?.name }}</h3>
                  <span class="tiny muted">Choose an amount — this is a simulation, nothing is charged.</span>
                </div>
                <button class="btn btn--icon btn--sm" (click)="close()"><app-icon name="x" [size]="15" /></button>
              </div>
              <div class="modal__b col g-16">
                <div class="row g-8 wrap">
                  @for (a of presets; track a) {
                    <button class="chip" [class.chip--on]="amount === a" (click)="amount = a">{{ a }} {{ c.currency }}</button>
                  }
                </div>
                <div class="field">
                  <label>Amount ({{ c.currency }})</label>
                  <input class="input num" type="number" min="10" step="10" [(ngModel)]="amount" />
                  <span class="hint">{{ tierHint(c.rewards) }}</span>
                </div>
                <div class="field">
                  <label>Reward tier</label>
                  <div class="col g-8">
                    @for (r of c.rewards; track r.id) {
                      <button class="prompt-chip" [style.border-color]="picked()?.id === r.id ? 'var(--brand-500)' : ''"
                        (click)="pick(r)">
                        <b>{{ r.title }}</b> · {{ fmt.money(r.amount, c.currency) }}<br />{{ r.desc }}
                      </button>
                    }
                  </div>
                </div>
                <div class="row between">
                  <span class="sm">Show my name on the supporters wall</span>
                  <button class="switch" [class.on]="showName()" (click)="showName.set(!showName())"></button>
                </div>
                <div class="mockbar" style="border-radius:10px;border:1px dashed var(--line)">
                  <app-icon name="shield" [size]="12" /> No card details are collected. This demo never processes payments.
                </div>
              </div>
              <div class="modal__f">
                <button class="btn" (click)="close()">Cancel</button>
                <button class="btn btn--seed" [disabled]="!amount || amount < 10" (click)="confirm()">
                  <app-icon name="rocket" [size]="15" /> Complete simulated support
                </button>
              </div>
            } @else {
              <div class="modal__b col g-16 center" style="align-items:center;text-align:center">
                <div class="empty__ic" style="background:var(--seed-100);color:var(--seed-600)">
                  <app-icon name="check" [size]="26" [weight]="2.6" />
                </div>
                <div class="col g-6">
                  <h3>You are in 🚀</h3>
                  <span class="sm muted">
                    {{ amount }} {{ c.currency }} recorded as simulated support for {{ s()?.name }}.
                    You now get every update from the build.
                  </span>
                </div>
                <div class="card card--flat full col g-8 pad-sm">
                  <div class="row between tiny"><span class="muted">Tier</span><span class="b">{{ picked()?.title ?? 'No reward' }}</span></div>
                  <div class="row between tiny"><span class="muted">Round progress</span><span class="b">{{ pct() }}% funded</span></div>
                  <div class="row between tiny"><span class="muted">Payment</span><span class="b amber-text">not processed (demo)</span></div>
                </div>
                <div class="row g-8">
                  <button class="btn" (click)="close()">Stay on the page</button>
                  <a class="btn btn--primary" routerLink="/home" (click)="close()">Back to feed</a>
                </div>
              </div>
            }
          </div>
        </div>
      }
    } @else {
      <div class="page">
        <app-empty icon="dollar" title="Campaign not found" text="This round may have been created in an earlier demo session.">
          <a class="btn btn--primary btn--sm" routerLink="/fund">Browse open rounds</a>
        </app-empty>
      </div>
    }
  `,
  styles: [`
    .cgrid { display: grid; grid-template-columns: minmax(0, 1fr) 330px; gap: 18px; align-items: start; }
    .sticky { position: sticky; top: 76px; }
    @media (max-width: 1020px) { .cgrid { grid-template-columns: 1fr; } .sticky { position: static; } }
  `],
})
export class CampaignPage {
  readonly store = inject(Store);
  private route = inject(ActivatedRoute);
  readonly fmt = fmt;

  private params = toSignal(this.route.paramMap);
  readonly c = computed(() => this.store.campaign(this.params()?.get('id') ?? ''));
  readonly s = computed(() => {
    const c = this.c();
    return c ? this.store.startup(c.startupId) : undefined;
  });
  readonly founder = computed(() => {
    const s = this.s();
    return s ? this.store.person(s.founderId) : undefined;
  });
  readonly pct = computed(() => {
    const c = this.c();
    return c ? fmt.pct(c.raised, c.goal) : 0;
  });
  readonly proof = computed(() => {
    const c = this.c();
    if (!c) return [];
    const byId = c.updatePostIds.map(id => this.store.posts().find(p => p.id === id)).filter(Boolean);
    return (byId.length ? byId : this.store.postsOf(c.startupId).slice(0, 2)) as Post[];
  });

  readonly presets = [50, 150, 300, 600];
  readonly modal = signal(false);
  readonly done = signal(false);
  readonly picked = signal<Reward | null>(null);
  readonly showName = signal(true);
  amount = 150;

  next(c: { raised: number; milestones: { label: string; amount: number }[] }): string {
    return c.milestones.find(m => c.raised < m.amount)?.label ?? '';
  }

  open(r?: Reward): void {
    if (r) { this.picked.set(r); this.amount = r.amount; }
    this.done.set(false);
    this.modal.set(true);
  }
  close(): void { this.modal.set(false); }

  pick(r: Reward): void {
    this.picked.set(r);
    if (this.amount < r.amount) this.amount = r.amount;
  }

  tierHint(rewards: Reward[]): string {
    const tier = [...rewards].reverse().find(r => this.amount >= r.amount);
    return tier ? `Unlocks: ${tier.title}` : 'Any amount is welcome — rewards start higher up.';
  }

  confirm(): void {
    const c = this.c();
    if (!c) return;
    this.store.backCampaign(c.id, Number(this.amount) || 0, this.picked()?.title);
    this.done.set(true);
  }
}
