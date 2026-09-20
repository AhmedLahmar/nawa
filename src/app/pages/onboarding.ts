import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { analyzeIdea, generateRoadmap } from '../core/ai';
import { IdeaAnalysis, Roadmap, Startup } from '../core/models';
import { Store } from '../core/store';
import { UI } from '../ui/ui';

const EXAMPLES = [
  'An app that helps small farmers in Béja share refrigerated trucks so their produce stops spoiling on the way to market.',
  'A tool that lets Tunisian freelancers invoice European clients and get paid in TND the same week.',
  'A mobile tutoring marketplace where Tunisian high-school students revise the bac with verified teachers in Darija.',
];

const CITIES = ['Tunis', 'Sfax', 'Sousse', 'Monastir', 'Bizerte', 'Casablanca', 'Algiers', 'Cairo', 'Dubai', 'Riyadh'];

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [RouterLink, FormsModule, UI],
  template: `
    <div class="ob">
      <header class="ob__top">
        <a class="row g-9" routerLink="/">
          <span class="mark">🌱</span>
          <span class="bb" style="font-family:var(--display);font-size:17px;letter-spacing:-.03em">Nawa</span>
        </a>
        <div class="step-dots">
          @for (s of [1,2,3,4,5]; track s) {
            <span class="step-dot" [class.on]="step() === s" [class.past]="step() > s"></span>
          }
        </div>
        <a class="btn btn--ghost btn--sm" routerLink="/home">Skip to demo</a>
      </header>

      <div class="ob__body">
        <!-- ============ 1. account ============ -->
        @if (step() === 1) {
          <div class="ob__card card card--lg fade-up">
            <div class="pad-lg col g-20">
              <div class="col g-8">
                <span class="kicker">Step 1 of 5 · 40 seconds</span>
                <h1>Create your founder account</h1>
                <p class="muted">No password, no verification, nothing to install. This is a concept demo — your data stays in this browser.</p>
              </div>
              <div class="grid grid-2">
                <div class="field">
                  <label>Your name</label>
                  <input class="input" [(ngModel)]="name" placeholder="Ahmed Ben Ali" />
                </div>
                <div class="field">
                  <label>City</label>
                  <select class="select" [(ngModel)]="city">
                    @for (c of cities; track c) { <option [value]="c">{{ c }}</option> }
                  </select>
                </div>
              </div>
              <div class="field">
                <label>What describes you best?</label>
                <div class="row g-8 wrap">
                  @for (r of roleOptions; track r.key) {
                    <button class="chip" [class.chip--on]="role() === r.key" (click)="role.set(r.key)">
                      {{ r.emoji }} {{ r.label }}
                    </button>
                  }
                </div>
                <span class="hint">You can act as any role in this demo — the founder path is the full experience.</span>
              </div>
              <div class="panel panel--brand row-t g-10">
                <span style="font-size:18px">🧭</span>
                <span class="sm">
                  <b>What happens next:</b> you describe your idea in one paragraph, Copilot validates it and builds
                  a five-phase roadmap, then your startup page goes live and your journey starts publishing.
                </span>
              </div>
              <div class="row between">
                <a class="btn btn--ghost" routerLink="/">Back to home</a>
                <button class="btn btn--primary btn--lg" [disabled]="!name.trim()" (click)="step.set(2)">
                  Continue <app-icon name="arrowR" [size]="16" />
                </button>
              </div>
            </div>
          </div>
        }

        <!-- ============ 2. the idea ============ -->
        @if (step() === 2) {
          <div class="ob__card card card--lg fade-up">
            <div class="pad-lg col g-20">
              <div class="col g-8">
                <span class="kicker">Step 2 of 5</span>
                <h1>Tell us about your idea</h1>
                <p class="muted">
                  One paragraph, plain words. Who has the problem, where they are, and what you would build for them.
                  The more specific you are, the more useful Copilot's validation gets.
                </p>
              </div>
              <textarea class="textarea" rows="6" [(ngModel)]="idea"
                placeholder="I want to build …"></textarea>
              <div class="col g-8">
                <span class="up faint">Or start from an example</span>
                @for (e of examples; track e) {
                  <button class="prompt-chip" (click)="idea = e">{{ e }}</button>
                }
              </div>
              <div class="row between">
                <button class="btn btn--ghost" (click)="step.set(1)"><app-icon name="arrowL" [size]="16" /> Back</button>
                <button class="btn btn--primary btn--lg" [disabled]="idea.trim().length < 12" (click)="analyze()">
                  <app-icon name="sparkles" [size]="16" /> Validate my idea
                </button>
              </div>
            </div>
          </div>
        }

        <!-- ============ 3. analysis ============ -->
        @if (step() === 3) {
          @if (thinking()) {
            <div class="ob__card card card--lg fade-up">
              <div class="pad-lg col g-16 center" style="align-items:center;padding:52px 24px">
                <span class="mark" style="width:52px;height:52px;border-radius:16px;font-size:24px">✨</span>
                <h2>Copilot is reading your idea</h2>
                <div class="col g-8 full" style="max-width:400px;margin-top:8px">
                  @for (t of thinkSteps; track t; let i = $index) {
                    <div class="row g-10 sm" [style.opacity]="thinkTick() > i ? 1 : 0.35">
                      @if (thinkTick() > i) {
                        <app-icon name="check" [size]="14" class="seed-text" />
                      } @else {
                        <span class="typing"><i></i><i></i><i></i></span>
                      }
                      <span>{{ t }}</span>
                    </div>
                  }
                </div>
                <span class="mock-note mt-16"><app-icon name="lock" [size]="11" /> Simulated analysis — runs offline, no AI service is called</span>
              </div>
            </div>
          } @else if (analysis(); as a) {
            <div class="ob__wide col g-16 fade-up">
              <div class="card card--lg">
                <div class="pad-lg col g-20">
                  <div class="row between wrap g-16">
                    <div class="col g-6" style="max-width:520px">
                      <span class="kicker">Step 3 of 5 · Idea validation</span>
                      <h1>{{ a.name }}</h1>
                      <p class="muted">{{ a.tagline }}</p>
                      <div class="row g-6 wrap mt-4">
                        <span class="tag tag--brand">{{ a.industry }}</span>
                        <span class="tag">{{ city }}</span>
                        @for (s of a.segments.slice(0, 2); track s) { <span class="tag">{{ s }}</span> }
                      </div>
                    </div>
                    <div class="row g-20">
                      <div class="center">
                        <app-score-ring [value]="a.opportunityScore" [size]="104" caption="opportunity" />
                      </div>
                      <div class="col g-10">
                        @for (m of meters(a); track m.label) {
                          <div class="col g-4" style="min-width:132px">
                            <div class="row between tiny">
                              <span class="muted">{{ m.label }}</span>
                              <span class="b" [class]="m.cls">{{ m.value }}</span>
                            </div>
                            <app-bar [pct]="m.pct" [tone]="m.tone" [thin]="true" />
                          </div>
                        }
                      </div>
                    </div>
                  </div>

                  <div class="panel panel--brand row-t g-10">
                    <span style="font-size:18px">🎯</span>
                    <div>
                      <div class="up brand-text">Recommended next step</div>
                      <div class="sm b" style="margin-top:2px">{{ a.nextStep }}</div>
                    </div>
                  </div>

                  <div class="grid grid-2">
                    <div class="card card--flat col g-10 pad">
                      <span class="up faint">Market size (estimated)</span>
                      @for (m of a.marketSize; track m.label) {
                        <div class="row between">
                          <span class="sm"><b>{{ m.label }}</b> <span class="faint tiny">{{ m.note }}</span></span>
                          <span class="b num">{{ m.value }}</span>
                        </div>
                      }
                      <div class="divider"></div>
                      <span class="tiny faint">Directional estimates for a demo, not investment research.</span>
                    </div>
                    <div class="card card--flat col g-10 pad">
                      <span class="up faint">Who is already there</span>
                      @for (c of a.competitors; track c.name) {
                        <div class="row-t g-8">
                          <span class="tag tag--outline">{{ c.kind }}</span>
                          <span class="sm grow"><b>{{ c.name }}</b> — <span class="muted">{{ c.note }}</span></span>
                        </div>
                      }
                    </div>
                    <div class="card card--flat col g-8 pad">
                      <span class="up seed-text">What works in your favour</span>
                      @for (s of a.strengths; track s) {
                        <div class="row-t g-8 sm"><app-icon name="check" [size]="14" class="seed-text" /><span>{{ s }}</span></div>
                      }
                    </div>
                    <div class="card card--flat col g-8 pad">
                      <span class="up rose-text">What could kill it</span>
                      @for (r of a.risks; track r) {
                        <div class="row-t g-8 sm"><app-icon name="alert" [size]="14" class="rose-text" /><span>{{ r }}</span></div>
                      }
                    </div>
                  </div>

                  <div class="card card--flat col g-12 pad">
                    <div class="row between">
                      <span class="up faint">Suggested MVP — three things only</span>
                      <span class="tag tag--amber">Ship in 3 weeks</span>
                    </div>
                    <div class="grid grid-3">
                      @for (m of a.mvp; track m.label; let i = $index) {
                        <div class="panel col g-6">
                          <span class="mono tiny brand-text">0{{ i + 1 }}</span>
                          <span class="sm b">{{ m.label }}</span>
                          <span class="tiny muted">{{ m.why }}</span>
                        </div>
                      }
                    </div>
                    <div class="row g-8 tiny muted">
                      <app-icon name="dollar" [size]="13" /> Pricing hypothesis: {{ a.pricing }}
                    </div>
                  </div>

                  <div class="row between wrap g-12">
                    <button class="btn btn--ghost" (click)="step.set(2)"><app-icon name="arrowL" [size]="16" /> Edit my idea</button>
                    <button class="btn btn--primary btn--lg" (click)="step.set(4)">
                      Generate my roadmap <app-icon name="arrowR" [size]="16" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          }
        }

        <!-- ============ 4. roadmap ============ -->
        @if (step() === 4 && roadmap(); as rm) {
          <div class="ob__wide col g-16 fade-up">
            <div class="col g-8">
              <span class="kicker">Step 4 of 5 · Your roadmap</span>
              <h1>Five phases from idea to fundraising</h1>
              <p class="muted" style="max-width:640px">
                Copilot turned your idea into {{ taskCount(rm) }} concrete tasks. You can tick them off in your Build
                workspace — each completed task feeds your Founder Score and your public journey.
              </p>
            </div>
            <div class="grid grid-2">
              @for (p of rm.phases; track p.id; let i = $index) {
                <div class="phase">
                  <div class="phase__h">
                    <span class="lb-rank" [class.lb-rank--1]="i === 0">{{ i + 1 }}</span>
                    <div class="grow">
                      <div class="sm b">{{ p.name }}</div>
                      <div class="tiny faint">{{ p.goal }}</div>
                    </div>
                    <span class="tag">{{ p.weeks }}</span>
                  </div>
                  @for (t of p.tasks; track t.id) {
                    <div class="task">
                      <span class="tick"><app-icon name="check" [size]="12" [weight]="3" /></span>
                      <span class="sm grow task__t">{{ t.label }}</span>
                    </div>
                  }
                </div>
              }
            </div>
            <div class="row between wrap g-12">
              <button class="btn btn--ghost" (click)="step.set(3)"><app-icon name="arrowL" [size]="16" /> Back to validation</button>
              <button class="btn btn--primary btn--lg" (click)="step.set(5)">
                Looks right — create my startup <app-icon name="arrowR" [size]="16" />
              </button>
            </div>
          </div>
        }

        <!-- ============ 5. create + first post ============ -->
        @if (step() === 5) {
          @if (!created()) {
            <div class="ob__card card card--lg fade-up">
              <div class="pad-lg col g-20">
                <div class="col g-8">
                  <span class="kicker">Step 5 of 5</span>
                  <h1>Set up your public page</h1>
                  <p class="muted">This is what supporters, experts and incubators will see. You can change everything later.</p>
                </div>
                <div class="grid grid-2">
                  <div class="field">
                    <label>Startup name</label>
                    <input class="input" [(ngModel)]="startupName" />
                  </div>
                  <div class="field">
                    <label>Based in</label>
                    <select class="select" [(ngModel)]="city">
                      @for (c of cities; track c) { <option [value]="c">{{ c }}</option> }
                    </select>
                  </div>
                </div>
                <div class="field">
                  <label>One-line pitch</label>
                  <input class="input" [(ngModel)]="tagline" />
                </div>
                <div class="panel row g-12">
                  <button class="switch" [class.on]="bip()" (click)="bip.set(!bip())"></button>
                  <div class="grow">
                    <div class="sm b">Build in public from Day 1</div>
                    <div class="tiny muted">Your day counter, milestones and KPI changes become shareable updates. This is what the whole platform is built around.</div>
                  </div>
                </div>
                <div class="row between">
                  <button class="btn btn--ghost" (click)="step.set(4)"><app-icon name="arrowL" [size]="16" /> Back</button>
                  <button class="btn btn--seed btn--lg" [disabled]="!startupName.trim()" (click)="create()">
                    <app-icon name="rocket" [size]="16" /> Create startup
                  </button>
                </div>
              </div>
            </div>
          } @else if (created(); as s) {
            <div class="ob__card card card--lg fade-up">
              <div class="pad-lg col g-18">
                <div class="row g-12">
                  <app-av [name]="s.name" [emoji]="s.emoji" [gradient]="s.gradient" [size]="52" [square]="true" />
                  <div class="grow">
                    <div class="row g-8">
                      <h2>{{ s.name }}</h2>
                      <span class="day-pill">🌱 Day 1</span>
                    </div>
                    <div class="sm muted">{{ s.tagline }}</div>
                  </div>
                </div>
                <div class="panel panel--seed row-t g-10">
                  <span style="font-size:18px">✅</span>
                  <span class="sm">
                    Your page is live and your roadmap is loaded. One thing left: the update that starts the loop.
                    <b>Say what you are building and what you will do this week.</b>
                  </span>
                </div>
                <div class="field">
                  <label>Your first Build in Public update</label>
                  <textarea class="textarea" rows="5" [(ngModel)]="firstPost"></textarea>
                  <span class="hint">Founders who publish in their first 24 hours are 3× more likely to still be publishing on Day 30 (demo statistic).</span>
                </div>
                <div class="row between wrap g-12">
                  <a class="btn btn--ghost" routerLink="/build">Do it later</a>
                  <button class="btn btn--primary btn--lg" [disabled]="!firstPost.trim()" (click)="publish()">
                    <app-icon name="send" [size]="16" /> Publish Day 1 update
                  </button>
                </div>
              </div>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .ob { min-height: 100vh; background:
      radial-gradient(900px 420px at 12% -10%, var(--brand-50), transparent 60%),
      radial-gradient(700px 380px at 92% 0%, var(--seed-100), transparent 55%), var(--canvas); }
    .ob__top { height: 66px; display: flex; align-items: center; justify-content: space-between;
      gap: 16px; padding: 0 clamp(14px, 4vw, 34px); }
    .ob__body { padding: clamp(12px, 3vw, 34px) clamp(14px, 4vw, 34px) 70px; display: flex; justify-content: center; }
    .ob__card { width: min(680px, 100%); }
    .ob__wide { width: min(1080px, 100%); }
    .mark { width: 30px; height: 30px; border-radius: 9px; display: grid; place-items: center;
      background: linear-gradient(140deg, #14b87a, #5a46f0 120%); font-size: 15px; flex: none; }
    .g-9 { gap: 9px }
  `],
})
export class Onboarding {
  private store = inject(Store);
  private router = inject(Router);

  readonly cities = CITIES;
  readonly examples = EXAMPLES;
  readonly roleOptions = [
    { key: 'founder', label: 'Founder', emoji: '🚀' },
    { key: 'supporter', label: 'Supporter', emoji: '🤝' },
    { key: 'expert', label: 'Expert', emoji: '🎓' },
    { key: 'incubator', label: 'Incubator', emoji: '🏢' },
  ];
  readonly thinkSteps = [
    'Reading the problem and the customer',
    'Comparing with what exists in the region',
    'Sizing the opportunity in TND',
    'Choosing the smallest useful MVP',
    'Writing your five-phase roadmap',
  ];

  readonly step = signal(1);
  readonly role = signal('founder');
  readonly thinking = signal(false);
  readonly thinkTick = signal(0);
  readonly analysis = signal<IdeaAnalysis | null>(null);
  readonly roadmap = signal<Roadmap | null>(null);
  readonly created = signal<Startup | null>(null);
  readonly bip = signal(true);

  name = this.store.me().name;
  city = this.store.me().city;
  idea = '';
  startupName = '';
  tagline = '';
  firstPost = '';

  taskCount = (rm: Roadmap) => rm.phases.reduce((n, p) => n + p.tasks.length, 0);

  meters(a: IdeaAnalysis) {
    const map = { Low: 30, Medium: 62, High: 92 } as const;
    return [
      { label: 'Market potential', value: a.marketPotential, pct: map[a.marketPotential], tone: 'seed' as const, cls: 'seed-text' },
      { label: 'Competition', value: a.competition, pct: map[a.competition], tone: 'amber' as const, cls: 'amber-text' },
      { label: 'Execution risk', value: a.risk, pct: map[a.risk], tone: 'brand' as const, cls: 'brand-text' },
      { label: 'Timing', value: a.timing, pct: 78, tone: 'seed' as const, cls: 'seed-text' },
    ];
  }

  analyze(): void {
    this.store.updateMe({ name: this.name.trim() || this.store.me().name, city: this.city });
    this.step.set(3);
    this.thinking.set(true);
    this.thinkTick.set(0);
    const tick = () => {
      this.thinkTick.update(t => t + 1);
      if (this.thinkTick() < this.thinkSteps.length) setTimeout(tick, 420);
      else setTimeout(() => this.reveal(), 380);
    };
    setTimeout(tick, 400);
  }

  private reveal(): void {
    const a = analyzeIdea(this.idea);
    this.analysis.set(a);
    this.store.saveAnalysis(a);
    this.roadmap.set(generateRoadmap(a, 'preview'));
    this.startupName = a.name;
    this.tagline = a.tagline;
    this.firstPost =
      `Day 1. I am building ${a.name} — ${a.tagline.toLowerCase()}\n\n` +
      `Why now: ${a.strengths[0] ?? 'the problem keeps showing up and nobody local has solved it well'}.\n\n` +
      `This week: ${a.nextStep}\n\nI will post what I learn here every few days, numbers included.`;
    this.thinking.set(false);
  }

  create(): void {
    const a = this.analysis();
    if (!a) return;
    const s = this.store.createStartupFromAnalysis(
      { ...a, tagline: this.tagline.trim() || a.tagline },
      { name: this.startupName.trim(), city: this.city, buildInPublic: this.bip() },
    );
    this.created.set(s);
    this.store.toast(`${s.name} is live — Day 1 starts now`, '🌱');
  }

  publish(): void {
    const s = this.created();
    if (!s) return;
    this.store.publish({ type: 'build', text: this.firstPost.trim(), startupId: s.id, withDay: true });
    this.router.navigate(['/home']);
  }
}
