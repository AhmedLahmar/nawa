import { Component, ElementRef, OnDestroy, computed, inject, signal, viewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ME_ID } from '../core/mock-data';
import { Store } from '../core/store';
import { CancelledError, DemoSettings } from '../services/demo';
import {
  CounselorApi, CounselorHistory, REVIEW_STEPS, ReviewVersion, Risk, ScoreItem, ideaDiff, snapshotOf,
} from '../services/counselor';
import { UI } from '../ui/ui';

type Phase = 'idle' | 'loading' | 'result' | 'error';

@Component({
  selector: 'app-counselor-page',
  standalone: true,
  imports: [RouterLink, FormsModule, UI],
  template: `
    <div class="page">
      @if (s(); as s) {
        <a class="link tiny row g-4 mb-16" [routerLink]="['/s', s.slug]"><app-icon name="arrowL" [size]="13" /> Back to {{ s.name }}</a>

        <div class="page-head">
          <div class="col g-6">
            <span class="kicker"><app-icon name="cap" [size]="13" /> Ask the Counselor</span>
            <h1 class="display-lg">An honest review of {{ s.name }}</h1>
            <span class="muted sm" style="max-width:600px">
              Scores, risks and the assumptions you haven't tested yet. It is meant to be useful, not flattering.
            </span>
          </div>
          <span class="mock-note"><app-icon name="lock" [size]="11" /> Demo — simulated review, no AI service is called</span>
        </div>

        @if (!isOwner()) {
          <app-empty icon="lock" title="Only the founder can ask the Counselor"
            text="Reviews are private to the founder while the idea is being shaped.">
            <a class="btn btn--primary btn--sm" [routerLink]="['/s', s.slug]">Back to the startup</a>
          </app-empty>
        } @else {
          <!-- announces loading / result / error to screen readers -->
          <p class="sr-only" aria-live="polite">{{ liveText() }}</p>

          <div class="wsgrid">
            <!-- ================= main column ================= -->
            <div class="col g-16" style="min-width:0">

              @if (comparing()) {
                <!-- ---------- compare two versions ---------- -->
                <section class="card col g-14 pad" aria-labelledby="cmp-h">
                  <div class="row between wrap g-8">
                    <h2 id="cmp-h" tabindex="-1" #focusTarget style="font-size:18px">Compare reviews</h2>
                    <button type="button" class="btn btn--sm" (click)="comparing.set(false)">Close compare</button>
                  </div>
                  <div class="grid grid-2">
                    <div class="field">
                      <label for="cmp-a">Before</label>
                      <select id="cmp-a" class="select" [ngModel]="cmpA()" (ngModelChange)="cmpA.set($event)">
                        @for (v of versions(); track v.id) { <option [value]="v.id">Version {{ v.version }} · {{ date(v.review.generatedAt) }}</option> }
                      </select>
                    </div>
                    <div class="field">
                      <label for="cmp-b">After</label>
                      <select id="cmp-b" class="select" [ngModel]="cmpB()" (ngModelChange)="cmpB.set($event)">
                        @for (v of versions(); track v.id) { <option [value]="v.id">Version {{ v.version }} · {{ date(v.review.generatedAt) }}</option> }
                      </select>
                    </div>
                  </div>
                  @if (compare(); as c) {
                    <table class="cmp">
                      <caption class="sr-only">Score changes between version {{ c.a.version }} and version {{ c.b.version }}</caption>
                      <thead><tr><th scope="col">Area</th><th scope="col">v{{ c.a.version }}</th><th scope="col">v{{ c.b.version }}</th><th scope="col">Change</th></tr></thead>
                      <tbody>
                        @for (r of c.rows; track r.label) {
                          <tr>
                            <th scope="row">{{ r.label }}</th>
                            <td class="mono">{{ r.a }}</td>
                            <td class="mono">{{ r.b }}</td>
                            <td class="mono b" [class.seed-text]="r.delta > 0" [class.rose-text]="r.delta < 0">{{ r.delta > 0 ? '+' : '' }}{{ r.delta }}</td>
                          </tr>
                        }
                      </tbody>
                    </table>
                    <div class="row g-8 sm"><span class="muted">Verdict:</span> <b>{{ c.a.review.verdictLabel }}</b> <app-icon name="arrowR" [size]="13" /> <b>{{ c.b.review.verdictLabel }}</b></div>
                    <div class="divider"></div>
                    <h3 style="font-size:15px">What changed in the idea</h3>
                    @if (c.diff.length) {
                      @for (d of c.diff; track d.field) {
                        <div class="col g-6">
                          <span class="up faint">{{ d.label }}</span>
                          <div class="grid grid-2">
                            <div class="panel panel--rose"><span class="tiny b">Before</span><p class="sm">{{ d.before || '—' }}</p></div>
                            <div class="panel panel--seed"><span class="tiny b">After</span><p class="sm">{{ d.after || '—' }}</p></div>
                          </div>
                        </div>
                      }
                    } @else {
                      <p class="sm muted">The idea text is identical in both versions — only the review was re-run.</p>
                    }
                  }
                </section>
              } @else {
                @switch (phase()) {
                  @case ('loading') {
                    <section class="card col g-14 pad-lg" aria-labelledby="ld-h" aria-busy="true">
                      <h2 id="ld-h" tabindex="-1" #focusTarget style="font-size:18px">The Counselor is reviewing {{ s.name }}…</h2>
                      <app-bar [pct]="progressPct()" tone="brand" [thick]="true" />
                      <ol class="steps">
                        @for (st of steps; track st; let i = $index) {
                          <li [class.done]="i < progressStep()" [class.now]="i === progressStep()">
                            <span class="steps__dot" aria-hidden="true">
                              @if (i < progressStep()) { <app-icon name="check" [size]="11" [weight]="3" /> }
                            </span>
                            <span>{{ st }}</span>
                            <span class="sr-only">{{ i < progressStep() ? '(done)' : i === progressStep() ? '(in progress)' : '' }}</span>
                          </li>
                        }
                      </ol>
                      <div class="row"><button type="button" class="btn btn--sm" (click)="cancel()">Cancel</button></div>
                    </section>
                  }
                  @case ('error') {
                    <section class="card col g-12 pad-lg" aria-labelledby="er-h" role="alert">
                      <h2 id="er-h" tabindex="-1" #focusTarget style="font-size:18px" class="row g-8">
                        <app-icon name="alert" [size]="18" class="rose-text" /> The review didn't finish
                      </h2>
                      <p class="sm muted">{{ error() }}</p>
                      <div class="row g-8 wrap">
                        <button type="button" class="btn btn--primary" (click)="run()"><app-icon name="refresh" [size]="15" /> Try again</button>
                        @if (selected()) { <button type="button" class="btn" (click)="phase.set('result')">Show the last review</button> }
                      </div>
                    </section>
                  }
                  @default {
                    @if (selected(); as v) {
                      <!-- ---------- result ---------- -->
                      <section class="card col g-14 pad-lg verdict" [class]="'verdict--' + v.review.verdict" aria-labelledby="vd-h">
                        <div class="row between wrap g-8">
                          <span class="tag">Version {{ v.version }} · {{ date(v.review.generatedAt) }}</span>
                          @if (v.id !== latest()?.id) { <span class="tag tag--amber">Older version</span> }
                        </div>
                        <div class="col g-4">
                          <span class="up faint">Overall verdict</span>
                          <h2 id="vd-h" tabindex="-1" #focusTarget style="font-size:24px">{{ v.review.verdictLabel }}</h2>
                        </div>
                        <p class="sm">{{ v.review.summary }}</p>
                      </section>

                      <section class="card col g-14 pad" aria-labelledby="sc-h">
                        <h3 id="sc-h" style="font-size:15px">Scores</h3>
                        <div class="grid grid-2">
                          @for (sc of v.review.scores; track sc.key) {
                            <div class="col g-6">
                              <div class="row between sm"><span class="b">{{ sc.label }}</span><span class="b mono">{{ sc.score }}/10</span></div>
                              <app-bar [pct]="sc.score * 10" [tone]="tone(sc)" [thin]="true" />
                              <span class="tiny muted">{{ sc.reason }}</span>
                            </div>
                          }
                        </div>
                      </section>

                      <div class="grid grid-2">
                        <section class="card col g-10 pad" aria-labelledby="rk-h">
                          <h3 id="rk-h" style="font-size:15px">Top risks</h3>
                          <ul class="plain col g-10">
                            @for (r of v.review.risks; track r.text) {
                              <li class="row-t g-8">
                                <span class="tag" [class]="riskTag(r)" style="flex:none">{{ r.severity }}</span>
                                <span class="sm">{{ r.text }}</span>
                              </li>
                            }
                          </ul>
                        </section>
                        <section class="card col g-10 pad" aria-labelledby="as-h">
                          <h3 id="as-h" style="font-size:15px">Assumptions you haven't tested</h3>
                          <ul class="plain col g-10">
                            @for (a of v.review.assumptions; track a) {
                              <li class="row-t g-8"><app-icon name="help" [size]="15" class="amber-text" style="flex:none" /><span class="sm">{{ a }}</span></li>
                            }
                          </ul>
                        </section>
                      </div>

                      <section class="card card--tint col g-12 pad" aria-labelledby="ns-h">
                        <h3 id="ns-h" style="font-size:15px">3 next steps</h3>
                        <ol class="nsteps">
                          @for (n of v.review.nextSteps; track n) { <li class="sm">{{ n }}</li> }
                        </ol>
                      </section>

                      <div class="row g-8 wrap">
                        <a class="btn btn--primary btn--lg" [routerLink]="['/build/generate']"
                          [queryParams]="{ startup: s.id, review: v.id }">
                          <app-icon name="code" [size]="16" /> Use this review to generate my project
                        </a>
                        <button type="button" class="btn btn--lg" (click)="run()"><app-icon name="refresh" [size]="16" /> Re-run review</button>
                        <button type="button" class="btn btn--lg btn--ghost" (click)="startEdit()"><app-icon name="edit" [size]="16" /> Edit idea</button>
                      </div>
                    } @else {
                      <!-- ---------- first visit ---------- -->
                      <section class="card col g-14 pad-lg" aria-labelledby="in-h">
                        <h2 id="in-h" style="font-size:18px">Get a structured critique before you build more</h2>
                        <ul class="plain col g-8 sm">
                          <li class="row g-8"><app-icon name="target" [size]="15" class="brand-text" /> Scores from 1 to 10 for problem clarity, market potential, feasibility and differentiation</li>
                          <li class="row g-8"><app-icon name="alert" [size]="15" class="rose-text" /> The risks most likely to sink it, including at least one hard truth</li>
                          <li class="row g-8"><app-icon name="help" [size]="15" class="amber-text" /> Assumptions you are relying on but haven't tested</li>
                          <li class="row g-8"><app-icon name="flag" [size]="15" class="seed-text" /> Three concrete next steps</li>
                        </ul>
                        <div class="row"><button type="button" class="btn btn--primary btn--lg" (click)="run()"><app-icon name="cap" [size]="16" /> Ask the Counselor</button></div>
                        <span class="tiny faint">Every review is saved as a version, so you can edit the idea and compare.</span>
                      </section>
                    }
                  }
                }
              }
            </div>

            <!-- ================= side rail ================= -->
            <aside class="col g-16" aria-label="Your idea and review history">
              <section class="card col g-10 pad" aria-labelledby="idea-h">
                <div class="row between">
                  <h2 id="idea-h" style="font-size:15px">Your idea</h2>
                  @if (!editing()) { <button type="button" class="btn btn--xs" (click)="startEdit()"><app-icon name="edit" [size]="12" /> Edit</button> }
                </div>
                @if (editing()) {
                  <form class="col g-10" (submit)="$event.preventDefault(); saveEdit()">
                    <div class="field"><label for="ed-tag">One-line pitch</label><input id="ed-tag" class="input" [(ngModel)]="form.tagline" name="tagline" /></div>
                    <div class="field"><label for="ed-prob">Problem</label><textarea id="ed-prob" class="textarea" rows="3" [(ngModel)]="form.problem" name="problem"></textarea></div>
                    <div class="field"><label for="ed-sol">Solution</label><textarea id="ed-sol" class="textarea" rows="3" [(ngModel)]="form.solution" name="solution"></textarea></div>
                    <div class="field"><label for="ed-bm">Business model</label><textarea id="ed-bm" class="textarea" rows="2" [(ngModel)]="form.businessModel" name="businessModel"></textarea></div>
                    <div class="field">
                      <label for="ed-mk">Market</label>
                      <textarea id="ed-mk" class="textarea" rows="2" [(ngModel)]="form.market" name="market" aria-describedby="ed-mk-h"></textarea>
                      <span id="ed-mk-h" class="hint">Say where your numbers come from (e.g. "source: 2025 sector report").</span>
                    </div>
                    <div class="row g-8">
                      <button type="submit" class="btn btn--primary btn--sm">Save idea</button>
                      <button type="button" class="btn btn--sm" (click)="editing.set(false)">Cancel</button>
                    </div>
                  </form>
                } @else {
                  <dl class="idea">
                    <dt>Pitch</dt><dd>{{ s.tagline }}</dd>
                    <dt>Problem</dt><dd>{{ s.problem }}</dd>
                    <dt>Solution</dt><dd>{{ s.solution }}</dd>
                    @if (s.businessModel) { <dt>Business model</dt><dd>{{ s.businessModel }}</dd> }
                    @if (s.market) { <dt>Market</dt><dd>{{ s.market }}</dd> }
                  </dl>
                  @if (changedSinceLatest()) {
                    <div class="panel panel--amber col g-6">
                      <span class="sm b">Your idea changed since the last review.</span>
                      <button type="button" class="btn btn--sm" (click)="run()">Re-run to compare</button>
                    </div>
                  }
                }
              </section>

              <section class="card col g-8 pad" aria-labelledby="hist-h">
                <div class="row between">
                  <h2 id="hist-h" style="font-size:15px">Versions</h2>
                  @if (versions().length > 1 && !comparing()) {
                    <button type="button" class="btn btn--xs" (click)="openCompare()">Compare</button>
                  }
                </div>
                @if (versions().length) {
                  <ul class="plain col g-6">
                    @for (v of versions(); track v.id) {
                      <li>
                        <button type="button" class="hist" [class.on]="v.id === selected()?.id && !comparing()"
                          [attr.aria-current]="v.id === selected()?.id ? 'true' : null" (click)="select(v.id)">
                          <span class="b sm">Version {{ v.version }}</span>
                          <span class="tiny muted">{{ v.review.verdictLabel }} · avg {{ avg(v) }}/10</span>
                          <span class="tiny faint">{{ date(v.review.generatedAt) }}</span>
                        </button>
                      </li>
                    }
                  </ul>
                } @else {
                  <p class="tiny muted">No reviews yet. Your first one will appear here.</p>
                }
              </section>

              <section class="card col g-8 pad" aria-labelledby="demo-h">
                <h2 id="demo-h" class="up faint">Demo controls</h2>
                <label class="row g-8 sm" style="cursor:pointer">
                  <input type="checkbox" [checked]="demo.isArmed('counselor')" (change)="toggleFail($any($event.target).checked)" />
                  Make the next review fail
                </label>
                <span class="tiny faint">Shows the error and retry state.</span>
              </section>
            </aside>
          </div>
        }
      } @else {
        <app-empty icon="compass" title="Startup not found" text="It may have been part of an earlier demo session.">
          <a class="btn btn--primary btn--sm" routerLink="/discover">Back to Discover</a>
        </app-empty>
      }
    </div>
  `,
  styles: [`
    .plain { list-style: none; margin: 0; padding: 0; }
    .verdict { border-left: 4px solid var(--brand-500); }
    .verdict--promising { border-left-color: var(--seed-500); }
    .verdict--needs-work { border-left-color: var(--amber-500); }
    .verdict--rethink { border-left-color: var(--rose-500); }
    .steps { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
    .steps li { display: flex; align-items: center; gap: 10px; font-size: 13.5px; color: var(--faint); }
    .steps li.done, .steps li.now { color: var(--text); }
    .steps li.now { font-weight: 600; }
    .steps__dot { width: 20px; height: 20px; border-radius: 50%; border: 2px solid var(--line); display: grid; place-items: center; flex: none; }
    .steps li.done .steps__dot { background: var(--seed-500); border-color: var(--seed-500); color: #fff; }
    .steps li.now .steps__dot { border-color: var(--brand-500); animation: livepulse 1.6s infinite; }
    .nsteps { margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 8px; }
    .idea { margin: 0; display: grid; gap: 4px; }
    .idea dt { font-size: 10.5px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--faint); margin-top: 6px; }
    .idea dd { margin: 0; font-size: 13px; color: var(--text); }
    .hist { display: flex; flex-direction: column; gap: 1px; width: 100%; text-align: left; padding: 9px 11px; border-radius: 10px;
      border: 1px solid var(--line); background: var(--surface); color: var(--text); font: inherit; cursor: pointer; }
    .hist:hover { border-color: var(--brand-300); }
    .hist.on { border-color: var(--brand-500); background: var(--brand-50); }
    .cmp { width: 100%; border-collapse: collapse; font-size: 13.5px; }
    .cmp th, .cmp td { text-align: left; padding: 8px 10px; border-bottom: 1px solid var(--line-2); }
    .cmp thead th { font-size: 11px; text-transform: uppercase; letter-spacing: .05em; color: var(--faint); }
    .cmp tbody th { font-weight: 600; }
  `],
})
export class CounselorPage implements OnDestroy {
  readonly store = inject(Store);
  readonly demo = inject(DemoSettings);
  private api = inject(CounselorApi);
  private history = inject(CounselorHistory);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private focusTarget = viewChild<ElementRef<HTMLElement>>('focusTarget');

  readonly steps = REVIEW_STEPS;
  private params = toSignal(this.route.paramMap);
  readonly s = computed(() => this.store.startupBySlug(this.params()?.get('slug') ?? ''));
  readonly isOwner = computed(() => this.s()?.founderId === ME_ID);

  readonly versions = computed(() => { const s = this.s(); return s ? this.history.versionsOf(s.id) : []; });
  readonly latest = computed<ReviewVersion | undefined>(() => this.versions()[0]);
  private readonly selectedId = signal<string | null>(null);
  readonly selected = computed(() => this.history.byId(this.selectedId()) ?? this.latest());

  readonly phase = signal<Phase>('idle');
  readonly progressStep = signal(0);
  readonly progressPct = computed(() => Math.round((this.progressStep() / REVIEW_STEPS.length) * 100));
  readonly error = signal('');
  readonly liveText = signal('');
  private abort: AbortController | null = null;

  readonly editing = signal(false);
  form = { tagline: '', problem: '', solution: '', businessModel: '', market: '' };

  readonly comparing = signal(false);
  readonly cmpA = signal('');
  readonly cmpB = signal('');
  readonly compare = computed(() => {
    const a = this.history.byId(this.cmpA()), b = this.history.byId(this.cmpB());
    if (!a || !b) return null;
    const rows = a.review.scores.map(sa => {
      const sb = b.review.scores.find(x => x.key === sa.key)!;
      return { label: sa.label, a: sa.score, b: sb.score, delta: sb.score - sa.score };
    });
    return { a, b, rows, diff: ideaDiff(a.idea, b.idea) };
  });

  readonly changedSinceLatest = computed(() => {
    const s = this.s(), l = this.latest();
    return !!(s && l && ideaDiff(l.idea, snapshotOf(s)).length);
  });

  constructor() {
    if (this.latest()) this.phase.set('result');
  }

  async run(): Promise<void> {
    const s = this.s();
    if (!s || this.phase() === 'loading') return;
    this.comparing.set(false);
    this.editing.set(false);
    this.abort = new AbortController();
    this.progressStep.set(0);
    this.phase.set('loading');
    this.liveText.set('Review started.');
    this.focusSoon();
    const idea = snapshotOf(s);
    try {
      const review = await this.api.review(idea, p => {
        this.progressStep.set(p.step);
        if (p.step < REVIEW_STEPS.length) this.liveText.set(`${p.label}…`);
      }, this.abort.signal);
      const v = this.history.add(s.id, idea, review);
      this.selectedId.set(v.id);
      this.phase.set('result');
      this.liveText.set(`Review ready: ${review.verdictLabel}.`);
      this.store.addScore('Counselor review completed', 1);
    } catch (e) {
      if (e instanceof CancelledError) {
        this.phase.set(this.latest() ? 'result' : 'idle');
        this.liveText.set('Review cancelled.');
      } else {
        this.error.set(e instanceof Error ? e.message : 'Something went wrong.');
        this.phase.set('error');
        this.liveText.set('The review failed. You can try again.');
      }
    } finally {
      this.abort = null;
      this.focusSoon();
    }
  }

  cancel(): void { this.abort?.abort(); }

  select(id: string): void {
    this.selectedId.set(id);
    this.comparing.set(false);
    this.phase.set('result');
    this.focusSoon();
  }

  openCompare(): void {
    const v = this.versions();
    this.cmpB.set(v[0].id);
    this.cmpA.set(v[1].id);
    this.comparing.set(true);
    this.focusSoon();
  }

  startEdit(): void {
    const s = this.s();
    if (!s) return;
    this.form = { tagline: s.tagline, problem: s.problem, solution: s.solution, businessModel: s.businessModel ?? '', market: s.market ?? '' };
    this.editing.set(true);
    setTimeout(() => document.getElementById('ed-tag')?.focus());
  }

  saveEdit(): void {
    const s = this.s();
    if (!s) return;
    this.store.updateStartup(s.id, {
      tagline: this.form.tagline.trim() || s.tagline, problem: this.form.problem.trim() || s.problem,
      solution: this.form.solution.trim() || s.solution, businessModel: this.form.businessModel.trim(), market: this.form.market.trim(),
    });
    this.editing.set(false);
    this.store.toast('Idea saved — re-run the review to compare', '✏️');
  }

  toggleFail(on: boolean): void {
    if (on) this.demo.failNext('counselor'); else this.demo.consumeFailure('counselor');
  }

  avg = (v: ReviewVersion) => (v.review.scores.reduce((n, s) => n + s.score, 0) / v.review.scores.length).toFixed(1);
  tone = (s: ScoreItem): 'seed' | 'brand' | 'amber' => (s.score >= 7 ? 'seed' : s.score >= 5 ? 'brand' : 'amber');
  riskTag = (r: Risk) => (r.severity === 'critical' ? 'tag--rose' : r.severity === 'major' ? 'tag--amber' : '');
  date = (iso: string) => new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  /** Move focus to the heading of whatever state just rendered. */
  private focusSoon(): void { setTimeout(() => this.focusTarget()?.nativeElement.focus()); }

  ngOnDestroy(): void { this.abort?.abort(); }
}
