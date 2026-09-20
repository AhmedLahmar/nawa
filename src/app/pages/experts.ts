import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Store } from '../core/store';
import { ExpertProfile, Startup } from '../core/models';
import { CARDS } from '../feed/cards';
import { fmt, UI } from '../ui/ui';

/* ============================================================
   Expert marketplace
   ============================================================ */
@Component({
  selector: 'app-experts-page',
  standalone: true,
  imports: [RouterLink, FormsModule, UI, CARDS],
  template: `
    <div class="page">
      <div class="page-head">
        <div class="col g-6">
          <span class="kicker"><app-icon name="cap" [size]="13" /> Experts &amp; mentors</span>
          <h1 class="display-lg">Borrow experience instead of buying it</h1>
          <span class="muted sm" style="max-width:540px">
            Operators, investors and specialists who have already solved what you are stuck on — book a focused
            session, or read what they answer in public.
          </span>
        </div>
        <div class="col g-8" style="align-items:flex-end">
          <span class="mock-note"><app-icon name="lock" [size]="11" /> Bookings and prices are simulated</span>
          <a class="btn" routerLink="/home"><app-icon name="help" [size]="15" /> Ask the community instead</a>
        </div>
      </div>

      <div class="row between wrap g-12 mb-16">
        <div class="searchbar" style="max-width:320px">
          <app-icon name="search" [size]="16" class="faint" />
          <input [(ngModel)]="q" placeholder="Search by name, skill or industry…" />
        </div>
        <div class="row g-6 wrap">
          <button class="chip" [class.chip--on]="cat() === 'all'" (click)="cat.set('all')">All</button>
          @for (c of categories(); track c) {
            <button class="chip" [class.chip--on]="cat() === c" (click)="cat.set(c)">{{ c }}</button>
          }
        </div>
      </div>

      @if (list().length) {
        <div class="grid grid-auto">
          @for (e of list(); track e.id) { <app-expert-card [e]="e" /> }
        </div>
      } @else {
        <app-empty icon="cap" title="No expert matches that" text="Try a different skill or clear the filter." />
      }

      <div class="card card--flat col g-12 pad-lg mt-24">
        <h4>Answered in public this week</h4>
        <div class="grid grid-2">
          @for (e of withAnswers(); track e.id) {
            <div class="panel col g-6">
              <span class="sm b">{{ e.topAnswer?.q }}</span>
              <span class="tiny muted">{{ e.topAnswer?.a }}</span>
              <a class="link tiny" [routerLink]="['/experts', e.id]">— {{ name(e.personId) }} →</a>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class ExpertsPage {
  readonly store = inject(Store);
  q = '';
  readonly cat = signal('all');

  readonly categories = computed(() => {
    const set = new Set<string>();
    for (const e of this.store.experts()) e.categories.forEach(c => set.add(c));
    return [...set].slice(0, 7);
  });

  readonly list = computed(() => {
    const term = this.q.trim().toLowerCase();
    const cat = this.cat();
    return this.store.experts().filter(e => {
      if (cat !== 'all' && !e.categories.includes(cat)) return false;
      if (!term) return true;
      const p = this.store.person(e.personId);
      return [p?.name, p?.title, e.headline, ...e.categories, ...e.industries]
        .join(' ').toLowerCase().includes(term);
    });
  });

  readonly withAnswers = computed(() => this.store.experts().filter(e => e.topAnswer).slice(0, 4));
  name = (id: string) => this.store.person(id)?.name ?? '';
}

/* ============================================================
   Expert detail + simulated booking
   ============================================================ */
@Component({
  selector: 'app-expert-page',
  standalone: true,
  imports: [RouterLink, UI, CARDS],
  template: `
    @if (e(); as e) {
      <div class="page page--narrow">
        <div class="card card--lg" style="overflow:hidden">
          <div class="cover" [style.background]="e.gradient" style="height:118px"></div>
          <div class="pad-lg col g-16" style="margin-top:-38px">
            <div class="row between wrap g-16" style="align-items:flex-end">
              <div class="row g-14" style="align-items:flex-end">
                <app-av [name]="p()?.name ?? ''" [size]="84" [verified]="true" style="box-shadow:0 0 0 4px var(--surface)" />
                <div>
                  <h1 style="font-size:25px">{{ p()?.name }}</h1>
                  <div class="sm muted">{{ e.headline }}</div>
                  <div class="row g-8 tiny faint mt-4 wrap">
                    <span>★ {{ e.rating }} ({{ e.reviews }} reviews)</span><span class="dot-sep"></span>
                    <span>{{ e.sessions }} sessions</span><span class="dot-sep"></span>
                    <span>{{ e.years }} years</span><span class="dot-sep"></span>
                    <span>replies in {{ e.responseTime }}</span>
                  </div>
                </div>
              </div>
              <div class="row g-8">
                <a class="btn" [routerLink]="['/u', p()?.handle]"><app-icon name="user" [size]="15" /> Profile</a>
                <a class="btn" routerLink="/messages"><app-icon name="message" [size]="15" /> Message</a>
              </div>
            </div>

            <div class="row g-6 wrap">
              @for (c of e.categories; track c) { <span class="tag tag--brand">{{ c }}</span> }
              @for (i of e.industries; track i) { <span class="tag">{{ i }}</span> }
              @for (l of e.languages; track l) { <span class="tag tag--outline">{{ l }}</span> }
            </div>
          </div>
        </div>

        <div class="egrid mt-16">
          <div class="col g-16">
            <div class="card col g-10 pad-lg">
              <span class="up faint">About</span>
              <p class="sm">{{ p()?.bio }}</p>
              @if (p()?.previously?.length) {
                <div class="divider"></div>
                <span class="up faint">Previously</span>
                @for (x of p()?.previously ?? []; track x) {
                  <span class="row g-8 sm"><app-icon name="briefcase" [size]="13" class="faint" /> {{ x }}</span>
                }
              }
            </div>

            @if (e.topAnswer; as a) {
              <div class="card card--tint col g-8 pad-lg">
                <span class="up brand-text">Answered in public</span>
                <span class="bb">{{ a.q }}</span>
                <p class="sm muted">{{ a.a }}</p>
                <span class="tiny faint">{{ e.answers }} community answers so far</span>
              </div>
            }

            @if (endorsed().length) {
              <div class="card">
                <div class="card__head"><h4>Startups they backed publicly</h4></div>
                <div class="card__body col g-12">
                  @for (row of endorsed(); track row.s.id) {
                    <div class="row-t g-11">
                      <app-av [name]="row.s.name" [emoji]="row.s.emoji" [gradient]="row.s.gradient" [size]="38" [square]="true" />
                      <div class="grow">
                        <a class="sm b hoverline" [routerLink]="['/s', row.s.slug]">{{ row.s.name }}</a>
                        <p class="tiny muted" style="margin-top:2px">“{{ row.quote }}”</p>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }

            <div class="card">
              <div class="card__head"><h4>What a session looks like</h4></div>
              <div class="card__body col g-12">
                @for (st of sessionSteps; track st.t) {
                  <div class="row-t g-10">
                    <span class="tag tag--brand">{{ $index + 1 }}</span>
                    <span class="grow"><span class="sm b">{{ st.t }}</span>
                      <span class="tiny muted" style="display:block">{{ st.d }}</span></span>
                  </div>
                }
              </div>
            </div>
          </div>

          <div class="col g-16 esticky">
            <div class="card col g-12 pad">
              <span class="up faint">Book a session</span>
              @for (o of options(e); track o.kind) {
                <button class="prompt-chip" [style.border-color]="kind() === o.kind ? 'var(--brand-500)' : ''"
                  (click)="kind.set(o.kind)">
                  <div class="row between">
                    <b>{{ o.kind }}</b>
                    <span class="num b">{{ fmt.money(o.price, store.currency) }}</span>
                  </div>
                  <span class="tiny muted">{{ o.desc }}</span>
                </button>
              }
              <div class="divider"></div>
              <span class="up faint">Pick a slot</span>
              <div class="row g-6 wrap">
                @for (a of e.availability; track a) {
                  <button class="chip chip--sm" [class.chip--on]="slot() === a" (click)="slot.set(a)">{{ a }}</button>
                }
              </div>
              @if (booked()) {
                <div class="panel panel--seed col g-4">
                  <span class="row g-8 b sm"><app-icon name="check" [size]="14" class="seed-text" /> Session booked</span>
                  <span class="tiny muted">A thread with {{ p()?.name }} is waiting in Messages.</span>
                </div>
                <a class="btn btn--block" routerLink="/messages">Open the conversation</a>
              } @else {
                <button class="btn btn--primary btn--block" [disabled]="!slot()" (click)="book(e)">
                  <app-icon name="calendar" [size]="15" /> Request {{ kind() }}
                </button>
                <span class="mock-note" style="justify-content:center">Simulated booking — no payment, no calendar invite</span>
              }
            </div>

            <div class="card col g-10 pad">
              <span class="up faint">Come prepared</span>
              <span class="tiny muted">
                Experts here are most useful when you bring numbers. Share your last three updates and the single
                decision you are stuck on.
              </span>
              <a class="btn btn--sm btn--block" routerLink="/build">Open your workspace</a>
            </div>
          </div>
        </div>
      </div>
    } @else {
      <div class="page">
        <app-empty icon="cap" title="Expert not found" text="Browse the marketplace to find someone else.">
          <a class="btn btn--primary btn--sm" routerLink="/experts">All experts</a>
        </app-empty>
      </div>
    }
  `,
  styles: [`
    .egrid { display: grid; grid-template-columns: minmax(0, 1fr) 310px; gap: 16px; align-items: start; }
    .esticky { position: sticky; top: 76px; }
    @media (max-width: 1020px) { .egrid { grid-template-columns: 1fr; } .esticky { position: static; } }
  `],
})
export class ExpertPage {
  readonly store = inject(Store);
  private route = inject(ActivatedRoute);
  readonly fmt = fmt;

  private params = toSignal(this.route.paramMap);
  readonly e = computed(() => this.store.expert(this.params()?.get('id') ?? ''));
  readonly p = computed(() => {
    const e = this.e();
    return e ? this.store.person(e.personId) : undefined;
  });

  readonly kind = signal('30-min call');
  readonly slot = signal('');
  readonly booked = signal(false);

  readonly sessionSteps = [
    { t: 'You send context', d: 'Your last updates, your numbers and the decision you need to make.' },
    { t: 'Focused call', d: 'No general advice — one problem, worked through with someone who has done it.' },
    { t: 'Written follow-up', d: 'Concrete next steps that land on your roadmap.' },
    { t: 'Public endorsement', d: 'If the work is good, the expert can vouch for you on your startup page.' },
  ];

  readonly endorsed = computed<{ s: Startup; quote: string }[]>(() => {
    const e = this.e();
    if (!e) return [];
    const rows: { s: Startup; quote: string }[] = [];
    for (const s of this.store.startups()) {
      const quote = s.endorsements.find(x => x.expertId === e.personId)?.quote;
      if (quote) rows.push({ s, quote });
    }
    return rows;
  });

  options(e: ExpertProfile) {
    return [
      { kind: '30-min call', price: e.price30, desc: 'One question, answered properly.' },
      { kind: '60-min deep dive', price: e.price60, desc: 'Strategy, pricing or go-to-market in depth.' },
      { kind: 'Monthly package', price: e.packagePrice, desc: e.packageDesc },
    ];
  }

  book(e: ExpertProfile): void {
    const price = this.options(e).find(o => o.kind === this.kind())?.price ?? 0;
    this.store.bookSession(e.id, this.kind(), this.slot(), price);
    this.booked.set(true);
  }
}
