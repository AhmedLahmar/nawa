import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '../core/store';
import { CARDS } from '../feed/cards';
import { fmt, UI } from '../ui/ui';

/* ============================================================
   Challenges — directory
   ============================================================ */
@Component({
  selector: 'app-challenges-page',
  standalone: true,
  imports: [RouterLink, UI, CARDS],
  template: `
    <div class="page">
      <div class="page-head">
        <div class="col g-6">
          <span class="kicker"><app-icon name="flag" [size]="13" /> Challenges</span>
          <h1 class="display-lg">Momentum, with company</h1>
          <span class="muted sm" style="max-width:540px">
            Time-boxed sprints with a public scoreboard. You do the work you were going to do anyway — in front of
            people who are doing the same.
          </span>
        </div>
        <a class="btn" routerLink="/build"><app-icon name="rocket" [size]="15" /> Open your workspace</a>
      </div>

      <div class="grid grid-auto">
        @for (c of store.challenges(); track c.id) { <app-challenge-card [c]="c" /> }
      </div>
    </div>
  `,
})
export class ChallengesPage {
  readonly store = inject(Store);
}

/* ============================================================
   Challenge detail + leaderboard
   ============================================================ */
@Component({
  selector: 'app-challenge-page',
  standalone: true,
  imports: [RouterLink, UI, CARDS],
  template: `
    @if (c(); as c) {
      <div class="page page--narrow">
        <div class="card card--lg" style="overflow:hidden">
          <div class="cover" [style.background]="c.gradient" style="height:132px">
            <div class="col g-6" style="position:absolute;bottom:14px;left:18px;right:18px;color:#fff">
              <span style="font-size:26px">{{ c.emoji }}</span>
              <h1 style="font-size:26px;color:#fff">{{ c.title }}</h1>
              <span class="sm" style="color:rgba(255,255,255,.86)">{{ c.subtitle }}</span>
            </div>
          </div>
          <div class="pad-lg col g-14">
            <div class="row between wrap g-12">
              <div class="row g-16 wrap">
                <div class="stat"><span class="stat__v">{{ c.participants }}</span><span class="stat__l">participants</span></div>
                <div class="stat"><span class="stat__v">{{ c.daysLeft }}</span><span class="stat__l">days left</span></div>
                <div class="stat"><span class="stat__v">{{ done() }}/{{ c.milestones.length }}</span><span class="stat__l">your milestones</span></div>
              </div>
              <div class="row g-8">
                <button class="btn" [class.btn--primary]="!joined()" (click)="store.toggleChallenge(c.id)">
                  @if (joined()) { Leave challenge } @else { <app-icon name="plus" [size]="15" /> Join challenge }
                </button>
                @if (joined()) {
                  <button class="btn btn--seed" (click)="share(c.title)"><app-icon name="send" [size]="15" /> Post progress</button>
                }
              </div>
            </div>
            <div class="row g-6 wrap">
              <span class="tag tag--amber">{{ c.window }}</span>
              <span class="tag tag--seed">🎁 {{ c.reward }}</span>
              @if (joined()) { <span class="tag tag--brand">You are in</span> }
            </div>
          </div>
        </div>

        <div class="chgrid mt-16">
          <div class="col g-16">
            <div class="card">
              <div class="card__head"><h4>The milestones</h4><span class="tiny faint">{{ c.window }}</span></div>
              <div class="card__body">
                <div class="tl">
                  @for (m of c.milestones; track m.label) {
                    <div class="tl__i" [class.done]="m.done" [class.now]="!m.done && nextLabel() === m.label">
                      <div class="tl__dot">
                        @if (m.done) { <app-icon name="check" [size]="10" [weight]="3.4" /> }
                      </div>
                      <div class="row g-8 wrap">
                        <span class="tag" [class.tag--seed]="m.done">Day {{ m.day }}</span>
                        <span class="b sm">{{ m.label }}</span>
                      </div>
                    </div>
                  }
                </div>
              </div>
            </div>

            <div class="card">
              <div class="card__head"><h4>Leaderboard</h4><span class="tiny faint">points for shipping, not for posting</span></div>
              <div class="card__body col">
                @for (row of c.leaderboard; track row.personId) {
                  <div class="lb-row" style="padding:11px 0;border-bottom:1px solid var(--line-2)">
                    <span class="lb-rank" [class]="'lb-rank--' + ($index + 1)">{{ $index + 1 }}</span>
                    <app-av [name]="name(row.personId)" [size]="36" [verified]="verified(row.personId)" />
                    <span class="grow col g-2" style="min-width:0">
                      <a class="sm b hoverline" [routerLink]="['/u', handle(row.personId)]">{{ name(row.personId) }}</a>
                      @if (row.startupId) {
                        <a class="tiny faint hoverline" [routerLink]="['/s', slug(row.startupId)]">{{ startupName(row.startupId) }}</a>
                      }
                    </span>
                    <span class="tag">🔥 {{ row.streak }}-day streak</span>
                    <span class="b num">{{ row.points }}</span>
                  </div>
                }
              </div>
            </div>

            <div class="card">
              <div class="card__head"><h4>Rules</h4></div>
              <div class="card__body col g-8">
                @for (r of c.rules; track r) {
                  <span class="row-t g-9 sm"><app-icon name="check" [size]="14" class="seed-text" style="margin-top:2px" /> {{ r }}</span>
                }
                <span class="mock-note mt-8"><app-icon name="lock" [size]="11" /> Prizes and scores are illustrative in this demo</span>
              </div>
            </div>
          </div>

          <div class="col g-16">
            <div class="card card--tint col g-12 pad">
              <span class="up brand-text">Your run</span>
              @if (joined()) {
                <div class="col g-6">
                  <div class="row between tiny"><span class="muted">Milestones done</span><span class="b">{{ done() }}/{{ c.milestones.length }}</span></div>
                  <app-bar [pct]="pct(done(), c.milestones.length)" tone="seed" />
                </div>
                <span class="tiny muted">Keep publishing — each update counts toward your streak and your Founder Score.</span>
                <a class="btn btn--sm btn--primary btn--block" routerLink="/build" [queryParams]="{ compose: 1 }">
                  Post today's update
                </a>
              } @else {
                <span class="sm muted">Join to get a scoreboard, a deadline and a few hundred people doing it with you.</span>
                <button class="btn btn--primary btn--sm btn--block" (click)="store.toggleChallenge(c.id)">Join challenge</button>
              }
            </div>
            <div class="card col g-10 pad">
              <span class="up faint">Why challenges work</span>
              <span class="tiny muted">
                Deadlines beat motivation. A public scoreboard turns "I should validate this" into "I have four
                interviews booked before Friday".
              </span>
            </div>
          </div>
        </div>
      </div>
    } @else {
      <div class="page">
        <app-empty icon="flag" title="Challenge not found" text="Have a look at the ones running now.">
          <a class="btn btn--primary btn--sm" routerLink="/challenges">All challenges</a>
        </app-empty>
      </div>
    }
  `,
  styles: [`
    .chgrid { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 16px; align-items: start; }
    @media (max-width: 1020px) { .chgrid { grid-template-columns: 1fr; } }
  `],
})
export class ChallengePage {
  readonly store = inject(Store);
  private route = inject(ActivatedRoute);
  readonly fmt = fmt;

  private params = toSignal(this.route.paramMap);
  readonly c = computed(() => this.store.challenge(this.params()?.get('slug') ?? ''));
  readonly joined = computed(() => {
    const c = this.c();
    return c ? this.store.isJoined(c.id) : false;
  });
  readonly done = computed(() => this.c()?.milestones.filter(m => m.done).length ?? 0);
  readonly nextLabel = computed(() => this.c()?.milestones.find(m => !m.done)?.label ?? '');

  pct = (a: number, b: number) => fmt.pct(a, b);
  name = (id: string) => this.store.person(id)?.name ?? '';
  handle = (id: string) => this.store.person(id)?.handle ?? '';
  verified = (id: string) => this.store.person(id)?.verified ?? false;
  startupName = (id: string) => this.store.startup(id)?.name ?? '';
  slug = (id: string) => this.store.startup(id)?.slug ?? '';

  share(title: string): void {
    this.store.publish({
      type: 'build',
      text: `Day ${this.store.activeStartup()?.day ?? 1} of the "${title}" challenge. Shipped what I said I would and learned one thing I did not expect.`,
      startupId: this.store.activeStartup()?.id,
      withDay: true,
    });
  }
}
