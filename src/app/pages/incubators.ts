import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '../core/store';
import { Cohort, Person, Startup } from '../core/models';
import { CARDS } from '../feed/cards';
import { PostCard } from '../feed/post-card';
import { fmt, UI } from '../ui/ui';

/* ============================================================
   Incubators & accelerators — directory
   ============================================================ */
@Component({
  selector: 'app-incubators-page',
  standalone: true,
  imports: [RouterLink, UI, CARDS],
  template: `
    <div class="page">
      <div class="page-head">
        <div class="col g-6">
          <span class="kicker"><app-icon name="building" [size]="13" /> Incubators &amp; accelerators</span>
          <h1 class="display-lg">Programmes that track progress, not slide decks</h1>
          <span class="muted sm" style="max-width:560px">
            Programmes across Tunisia and MENA use the same public build history you already keep — so applying is
            mostly showing what you have been doing.
          </span>
        </div>
        <a class="btn btn--primary" routerLink="/build"><app-icon name="rocket" [size]="15" /> Strengthen your profile</a>
      </div>

      <div class="grid grid-auto">
        @for (i of store.incubators(); track i.id) { <app-incubator-card [i]="i" /> }
      </div>

      <div class="card card--tint col g-12 pad-lg mt-24">
        <h4>Running a programme?</h4>
        <span class="sm muted" style="max-width:620px">
          The portal gives you one page per cohort: live progress, health flags, mentor assignment and every update
          your founders publish — instead of chasing monthly reports.
        </span>
        <div class="row g-8 wrap">
          @if (store.incubators()[0]; as i) {
            <a class="btn btn--primary btn--sm" [routerLink]="['/incubators', i.slug]" [queryParams]="{ tab: 'cohort' }">
              See a live portal
            </a>
          }
          <button class="btn btn--sm" (click)="store.toast('Programme onboarding is out of scope for this demo', '🏢')">
            Request access
          </button>
        </div>
      </div>
    </div>
  `,
})
export class IncubatorsPage {
  readonly store = inject(Store);
}

/* ============================================================
   Incubator portal — public page + programme dashboard
   ============================================================ */
@Component({
  selector: 'app-incubator-page',
  standalone: true,
  imports: [RouterLink, UI, CARDS, PostCard],
  template: `
    @if (i(); as i) {
      <div class="page">
        <div class="card card--lg" style="overflow:hidden">
          <div class="cover" [style.background]="i.gradient" style="height:120px"></div>
          <div class="pad-lg col g-14" style="margin-top:-34px">
            <div class="row between wrap g-16" style="align-items:flex-end">
              <div class="row g-14" style="align-items:flex-end">
                <app-av [name]="i.name" [emoji]="i.logoText" [gradient]="i.gradient" [size]="76" [square]="true"
                  style="box-shadow:0 0 0 4px var(--surface)" />
                <div>
                  <h1 style="font-size:25px">{{ i.name }}</h1>
                  <div class="tiny faint row g-8 mt-4 wrap">
                    <span><app-icon name="pin" [size]="11" style="display:inline" /> {{ i.city }}, {{ i.country }}</span>
                    <span class="dot-sep"></span>
                    <span>{{ i.cohorts.length }} cohorts</span>
                    <span class="dot-sep"></span>
                    <span>{{ i.mentorIds.length }} mentors</span>
                  </div>
                </div>
              </div>
              <div class="row g-8">
                <button class="btn" (click)="store.toggleFollow(i.id, i.name)">
                  @if (store.isFollowing(i.id)) { Following ✓ } @else { <app-icon name="plus" [size]="15" /> Follow }
                </button>
                @if (i.openCall) {
                  <button class="btn btn--primary" (click)="apply(i.name)">
                    <app-icon name="send" [size]="15" /> Apply · closes {{ i.applyDeadline }}
                  </button>
                }
              </div>
            </div>
            <div class="row g-6 wrap">
              @for (f of i.focus; track f) { <span class="tag tag--brand">{{ f }}</span> }
              @if (i.openCall) { <span class="tag tag--seed">Open call</span> }
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
          <div class="igrid mt-16">
            <div class="col g-16">
              <div class="card col g-10 pad-lg">
                <span class="up faint">About the programme</span>
                <p class="sm">{{ i.about }}</p>
              </div>
              <div class="card">
                <div class="stat-grid">
                  @for (s of i.stats; track s.label) {
                    <div class="stat"><span class="stat__v">{{ s.value }}</span><span class="stat__l">{{ s.label }}</span></div>
                  }
                </div>
              </div>
              <div class="card">
                <div class="card__head"><h4>What founders get</h4></div>
                <div class="card__body grid grid-2" style="gap:10px">
                  @for (p of i.perks; track p) {
                    <span class="row-t g-8 sm"><app-icon name="check" [size]="14" class="seed-text" style="margin-top:2px" /> {{ p }}</span>
                  }
                </div>
              </div>
              @if (portfolio().length) {
                <div class="col g-12">
                  <h4>Startups in the programme</h4>
                  <div class="grid grid-2">
                    @for (s of portfolio(); track s.id) { <app-startup-card [s]="s" /> }
                  </div>
                </div>
              }
            </div>
            <div class="col g-16">
              <div class="card col g-12 pad">
                <span class="up faint">Applying</span>
                <div class="row between tiny"><span class="muted">Deadline</span><span class="b">{{ i.applyDeadline }}</span></div>
                <div class="row between tiny"><span class="muted">Status</span>
                  <span class="b" [class.seed-text]="i.openCall">{{ i.openCall ? 'Open' : 'Closed' }}</span></div>
                <span class="tiny muted">
                  Your public journey is the application: updates, milestones, traction and endorsements are already
                  attached to your profile.
                </span>
                <button class="btn btn--primary btn--sm btn--block" [disabled]="!i.openCall" (click)="apply(i.name)">
                  Apply with my journey
                </button>
                <span class="mock-note" style="justify-content:center">Applications are simulated in this demo</span>
              </div>
              <div class="card col g-10 pad">
                <span class="up faint">Mentors</span>
                @for (m of mentors(); track m.id) {
                  <a class="hl-row" [routerLink]="['/u', m.handle]">
                    <app-av [name]="m.name" [size]="34" [verified]="m.verified" />
                    <span class="grow"><span class="sm b">{{ m.name }}</span>
                      <span class="tiny faint clamp-2" style="display:block">{{ m.title }}</span></span>
                    <app-icon name="chevR" [size]="14" class="faint" />
                  </a>
                }
              </div>
            </div>
          </div>
        }

        <!-- ---------- cohort dashboard ---------- -->
        @if (tab() === 'cohort') {
          @if (cohort(); as co) {
            <div class="col g-16 mt-16">
              <div class="card card--tint row between wrap g-16 pad">
                <div class="col g-4">
                  <span class="up brand-text">{{ co.name }}</span>
                  <span class="sm b">{{ co.window }} · Demo day {{ co.demoDay }}</span>
                  <span class="tiny muted">{{ co.startupIds.length }} startups · {{ co.mentorIds.length }} mentors assigned</span>
                </div>
                <div class="row g-16 wrap">
                  <div class="stat"><span class="stat__v">{{ co.progress }}%</span><span class="stat__l">cohort progress</span></div>
                  <div class="stat"><span class="stat__v">{{ updatesThisWeek() }}</span><span class="stat__l">updates posted</span></div>
                  <div class="stat"><span class="stat__v">{{ atRisk().length }}</span><span class="stat__l">need attention</span></div>
                </div>
              </div>

              <div class="card">
                <div class="card__head"><h4>Programme milestones</h4><span class="tiny faint">across the cohort</span></div>
                <div class="card__body col g-14">
                  @for (m of co.milestones; track m.label) {
                    <div class="col g-4">
                      <div class="row between">
                        <span class="sm b">{{ m.label }}</span>
                        <span class="tiny faint">{{ m.doneCount }}/{{ co.startupIds.length }} · due {{ m.due }}</span>
                      </div>
                      <app-bar [pct]="pct(m.doneCount, co.startupIds.length)" tone="seed" [thin]="true" />
                    </div>
                  }
                </div>
              </div>

              <div class="card">
                <div class="card__head">
                  <h4>Portfolio tracking</h4>
                  <span class="mock-note">read-only demo data</span>
                </div>
                <div class="card__body col">
                  @for (s of cohortStartups(); track s.id) {
                    <div class="lb-row" style="border-bottom:1px solid var(--line-2);padding:12px 0">
                      <span class="health-dot" [class]="'health--' + s.health"></span>
                      <app-av [name]="s.name" [emoji]="s.emoji" [gradient]="s.gradient" [size]="36" [square]="true" />
                      <span class="grow col g-2" style="min-width:0">
                        <a class="sm b hoverline" [routerLink]="['/s', s.slug]">{{ s.name }}</a>
                        <span class="tiny faint clamp-2">Day {{ s.day }} · {{ stage(s) }} · {{ fmt.k(s.followers) }} followers</span>
                      </span>
                      <span class="desktop-only" style="width:120px">
                        <app-bar [pct]="progressOf(s)" tone="brand" [thin]="true" />
                        <span class="tiny faint">{{ progressOf(s) }}% of roadmap</span>
                      </span>
                      <span class="desktop-only tag" [class.tag--rose]="s.health === 'risk'" [class.tag--amber]="s.health === 'warn'"
                        [class.tag--seed]="s.health === 'ok'">{{ healthLabel(s) }}</span>
                      <span class="row g-6">
                        <button class="btn btn--xs" (click)="assign(s)"><app-icon name="cap" [size]="12" /> Mentor</button>
                        <a class="btn btn--xs" routerLink="/messages"><app-icon name="message" [size]="12" /> Message</a>
                      </span>
                    </div>
                  }
                </div>
              </div>

              @if (atRisk().length) {
                <div class="card">
                  <div class="card__head" style="border-bottom:0"><h4>Needs attention this week</h4></div>
                  <div class="col g-10" style="padding:0 18px 18px">
                    @for (s of atRisk(); track s.id) {
                      <div class="row between wrap g-8">
                        <span class="sm"><b>{{ s.name }}</b> — {{ riskReason(s) }}</span>
                        <a class="btn btn--xs" [routerLink]="['/s', s.slug]">Open</a>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          } @else {
            <app-empty icon="building" title="No active cohort" text="This programme has no cohort running in the demo data." />
          }
        }

        <!-- ---------- updates ---------- -->
        @if (tab() === 'updates') {
          <div class="col g-16 mt-16" style="max-width:640px;margin-inline:auto">
            @if (cohortPosts().length) {
              @for (p of cohortPosts(); track p.id) { <app-post-card [post]="p" /> }
            } @else {
              <app-empty icon="edit" title="No updates yet" text="Updates from cohort startups will show up here." />
            }
          </div>
        }
      </div>
    } @else {
      <div class="page">
        <app-empty icon="building" title="Programme not found" text="Browse the directory to find another programme.">
          <a class="btn btn--primary btn--sm" routerLink="/incubators">All programmes</a>
        </app-empty>
      </div>
    }
  `,
  styles: [`
    .igrid { display: grid; grid-template-columns: minmax(0, 1fr) 304px; gap: 16px; align-items: start; }
    @media (max-width: 1020px) { .igrid { grid-template-columns: 1fr; } }
  `],
})
export class IncubatorPage {
  readonly store = inject(Store);
  private route = inject(ActivatedRoute);
  readonly fmt = fmt;

  private params = toSignal(this.route.paramMap);
  private query = toSignal(this.route.queryParamMap);
  private manualTab = signal<string | null>(null);
  readonly tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'cohort', label: 'Cohort dashboard' },
    { key: 'updates', label: 'Cohort updates' },
  ];
  readonly tab = computed(() => this.manualTab() ?? this.query()?.get('tab') ?? 'overview');
  setTab(t: string): void { this.manualTab.set(t); }

  readonly i = computed(() => this.store.incubator(this.params()?.get('slug') ?? ''));
  readonly cohort = computed<Cohort | undefined>(() => this.i()?.cohorts[0]);
  readonly mentors = computed(() =>
    (this.i()?.mentorIds ?? []).map(id => this.store.person(id)).filter(Boolean) as Person[]);
  readonly portfolio = computed(() => {
    const i = this.i();
    return i ? this.store.startups().filter(s => s.incubatorId === i.id) : [];
  });
  readonly cohortStartups = computed(() => {
    const co = this.cohort();
    if (!co) return [];
    return co.startupIds.map(id => this.store.startup(id)).filter(Boolean) as Startup[];
  });
  readonly cohortPosts = computed(() =>
    this.cohortStartups().flatMap(s => this.store.postsOf(s.id)).slice(0, 8));
  readonly atRisk = computed(() => this.cohortStartups().filter(s => s.health !== 'ok'));
  readonly updatesThisWeek = computed(() =>
    this.cohortStartups().reduce((n, s) => n + this.store.postsOf(s.id).length, 0));

  pct = (a: number, b: number) => fmt.pct(a, b);
  stage = (s: Startup) => s.stages.find(x => x.status === 'active')?.label ?? 'Idea';
  progressOf = (s: Startup) => this.store.roadmapProgress(s.id).pct;
  healthLabel = (s: Startup) => (s.health === 'ok' ? 'on track' : s.health === 'warn' ? 'slowing' : 'at risk');
  riskReason = (s: Startup) =>
    s.health === 'risk'
      ? 'no public update in over two weeks — worth a check-in'
      : 'roadmap progress has stalled since the last milestone';

  assign(s: Startup): void {
    this.store.toast(`Mentor request sent for ${s.name} (simulated)`, '🎓');
  }

  apply(name: string): void {
    this.store.toast(`Application to ${name} submitted with your public journey (simulated)`, '📨');
    this.store.addScore('Applied to a programme', 1);
  }
}
