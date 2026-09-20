import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Store } from '../core/store';
import { COPILOT_PROMPTS, analyzeIdea, copilotAnswer } from '../core/ai';
import { IdeaAnalysis } from '../core/models';
import { Composer } from '../feed/composer';
import { PostCard } from '../feed/post-card';
import { CARDS } from '../feed/cards';
import { fmt, UI } from '../ui/ui';

const TABS = [
  { key: 'dashboard', label: 'Dashboard', path: '/build', icon: 'grid' },
  { key: 'copilot', label: 'AI Copilot', path: '/build/copilot', icon: 'sparkles' },
  { key: 'validator', label: 'Idea validator', path: '/build/validator', icon: 'target' },
  { key: 'roadmap', label: 'Roadmap', path: '/build/roadmap', icon: 'layers' },
  { key: 'campaign', label: 'Community round', path: '/build/campaign', icon: 'dollar' },
];

@Component({
  selector: 'app-build-page',
  standalone: true,
  imports: [RouterLink, FormsModule, UI, CARDS, Composer, PostCard],
  template: `
    <div class="page">
      <div class="page-head">
        <div class="col g-6">
          <span class="kicker"><app-icon name="rocket" [size]="13" /> Build in Public</span>
          <h1 class="display-lg">Your workspace</h1>
          @if (s(); as s) {
            <span class="muted sm">
              {{ s.name }} · Day {{ s.day }} · {{ stageLabel() }} stage · Founder Score {{ store.myScore() }}
            </span>
          } @else {
            <span class="muted sm">No startup yet — start with your idea and the Copilot will set the rest up.</span>
          }
        </div>
        <div class="row g-8 wrap">
          @if (store.myStartups().length > 1) {
            <div class="seg">
              @for (m of store.myStartups(); track m.id) {
                <button [class.on]="m.id === store.activeStartupId()" (click)="store.setActiveStartup(m.id)">
                  {{ m.emoji }} {{ m.name }}
                </button>
              }
            </div>
          }
          @if (s(); as s) {
            <a class="btn" [routerLink]="['/s', s.slug]"><app-icon name="eye" [size]="15" /> View public page</a>
          }
          <a class="btn btn--primary" routerLink="/build" [queryParams]="{ compose: 1 }">
            <app-icon name="plus" [size]="15" /> Post update
          </a>
        </div>
      </div>

      <div class="tabs mb-16">
        @for (t of tabs; track t.key) {
          <a class="tab" [class.on]="tab() === t.key" [routerLink]="t.path">
            <app-icon [name]="t.icon" [size]="14" style="vertical-align:-2px;margin-right:5px" />{{ t.label }}
          </a>
        }
      </div>

      <!-- ==================== DASHBOARD ==================== -->
      @if (tab() === 'dashboard') {
        <div class="wsgrid">
          <div class="col g-16">
            <app-next-steps />

            <app-composer [startExpanded]="composeParam()" />

            <div class="col g-12">
              <div class="row between">
                <h4>Your public updates</h4>
                @if (s(); as s) { <a class="link tiny" [routerLink]="['/s', s.slug]" [queryParams]="{ tab: 'updates' }">See all →</a> }
              </div>
              @if (myPosts().length) {
                @for (p of myPosts().slice(0, 4); track p.id) { <app-post-card [post]="p" /> }
              } @else {
                <app-empty icon="edit" title="Nothing shared yet"
                  text="Your first update is what turns an idea into a journey people can follow." />
              }
            </div>
          </div>

          <div class="col g-16">
            <div class="card card--tint col g-12 pad">
              <div class="row between">
                <span class="up brand-text">Credibility</span>
                <span class="mock-note">demo metric</span>
              </div>
              <div class="row g-14">
                <app-score-ring [value]="store.myScore()" [size]="82" caption="Founder Score" />
                <div class="col g-6 grow">
                  <div class="row between tiny"><span class="muted">Weekly cadence</span><span class="b">{{ cadence() }}/wk</span></div>
                  <app-bar [pct]="cadencePct()" tone="seed" [thin]="true" />
                  <span class="tiny faint">{{ cadenceHint() }}</span>
                </div>
              </div>
              @if (store.scoreEvents().length) {
                <div class="divider"></div>
                @for (e of store.scoreEvents().slice(0, 3); track $index) {
                  <div class="row between tiny">
                    <span class="muted clamp-2">{{ e.label }}</span>
                    <span class="b seed-text">+{{ e.points }}</span>
                  </div>
                }
              }
            </div>

            @if (s(); as s) {
              <div class="card col g-12 pad">
                <span class="up faint">Stage</span>
                <app-stages [stages]="s.stages" [labels]="false" />
                <span class="tiny muted">{{ stageLabel() }} — {{ stageHint() }}</span>
              </div>

              <div class="card col g-12 pad">
                <div class="row between">
                  <span class="up faint">Roadmap</span>
                  <a class="link tiny" routerLink="/build/roadmap">Open</a>
                </div>
                <div class="row between">
                  <span class="sm b">{{ progress().done }} of {{ progress().total }} tasks</span>
                  <span class="tiny mono faint">{{ progress().pct }}%</span>
                </div>
                <app-bar [pct]="progress().pct" tone="brand" />
                @if (nextTask(); as t) {
                  <div class="panel">
                    <span class="tiny faint">Next task</span>
                    <div class="sm b">{{ t }}</div>
                  </div>
                }
              </div>

              <div class="card col g-12 pad">
                <span class="up faint">Audience</span>
                <app-chart [series]="s.kpis[0].trend ?? []" label="Followers" color="var(--brand-600)" [height]="86" />
                <div class="stat-grid" style="margin:0 -14px -6px">
                  <div class="stat"><span class="stat__v">{{ fmt.k(s.followers) }}</span><span class="stat__l">followers</span></div>
                  <div class="stat"><span class="stat__v">{{ s.supporters }}</span><span class="stat__l">supporters</span></div>
                  <div class="stat"><span class="stat__v">{{ myPosts().length }}</span><span class="stat__l">updates</span></div>
                </div>
              </div>

              <div class="card col g-10 pad">
                <span class="up faint">Traction you publish</span>
                @for (k of s.kpis; track k.label) {
                  <div class="row between">
                    <span class="sm muted">{{ k.label }}</span>
                    <span class="row g-8">
                      <span class="sm b num">{{ k.value }}</span>
                      @if (k.delta) { <span class="tiny b" [class]="k.tone === 'rose' ? 'rose-text' : 'seed-text'">{{ k.delta }}</span> }
                    </span>
                  </div>
                }
                <button class="btn btn--sm btn--block mt-8"
                  (click)="store.toast('Metric editing is mocked in this demo', '📊')">
                  <app-icon name="edit" [size]="14" /> Update metrics
                </button>
              </div>
            }
          </div>
        </div>
      }

      <!-- ==================== COPILOT ==================== -->
      @if (tab() === 'copilot') {
        <div class="wsgrid">
          <div class="card col" style="overflow:hidden">
            <div class="card__head">
              <div class="row g-10">
                <app-av name="Copilot" emoji="✨" gradient="linear-gradient(135deg,#5a46f0,#14b87a)" [size]="34" [square]="true" />
                <span class="col">
                  <span class="b sm">Startup Copilot</span>
                  <span class="tiny faint">Knows {{ sName() }}, your stage and your numbers</span>
                </span>
              </div>
              @if (store.copilot().length) {
                <button class="btn btn--xs" (click)="store.clearCopilot()"><app-icon name="refresh" [size]="12" /> New chat</button>
              }
            </div>

            <div class="pad-lg col g-16" style="min-height:320px">
              @if (!store.copilot().length) {
                <div class="col g-14 center" style="align-items:center;padding:14px 0">
                  <div class="empty__ic"><app-icon name="sparkles" [size]="24" /></div>
                  <div class="col g-4">
                    <span class="bb">What do you want to figure out today?</span>
                    <span class="sm muted">Ask anything about your startup — or start from one of these.</span>
                  </div>
                </div>
                <div class="grid grid-2" style="gap:8px">
                  @for (p of prompts; track p.q) {
                    <button class="prompt-chip" (click)="ask(p.q)">{{ p.emoji }} {{ p.label }}</button>
                  }
                </div>
              } @else {
                <div class="chat">
                  @for (t of store.copilot(); track t.id) {
                    <div class="msg" [class.msg--me]="t.mine">
                      @if (!t.mine) {
                        <app-av name="Copilot" emoji="✨" gradient="linear-gradient(135deg,#5a46f0,#14b87a)" [size]="30" [square]="true" />
                      }
                      <div class="col g-8" [style.align-items]="t.mine ? 'flex-end' : 'flex-start'">
                        <div class="msg__b">
                          @if (t.title) { <div class="msg__h">{{ t.title }}</div> }
                          {{ t.text }}
                        </div>
                        @if (t.action; as a) {
                          <a class="btn btn--sm btn--outline-brand" [routerLink]="a.route">
                            {{ a.label }} <app-icon name="chevR" [size]="14" />
                          </a>
                        }
                        @if (t.followUps?.length) {
                          <div class="row g-6 wrap">
                            @for (f of t.followUps ?? []; track f) {
                              <button class="chip chip--sm" (click)="ask(f)">{{ f }}</button>
                            }
                          </div>
                        }
                      </div>
                    </div>
                  }
                  @if (thinking()) {
                    <div class="msg">
                      <app-av name="Copilot" emoji="✨" gradient="linear-gradient(135deg,#5a46f0,#14b87a)" [size]="30" [square]="true" />
                      <div class="msg__b"><span class="typing"><i></i><i></i><i></i></span></div>
                    </div>
                  }
                </div>
              }
            </div>

            <div style="padding:0 18px 14px">
              <div class="composer-bar">
                <input class="input" style="border:0;box-shadow:none;background:transparent" [(ngModel)]="q"
                  placeholder="Ask your Copilot…" (keydown.enter)="ask(q)" />
                <button class="btn btn--primary btn--icon" [disabled]="!q.trim() || thinking()" (click)="ask(q)">
                  <app-icon name="send" [size]="16" />
                </button>
              </div>
            </div>
            <div class="mockbar">
              <app-icon name="lock" [size]="12" /> Simulated copilot — runs offline, no AI service is called
            </div>
          </div>

          <div class="col g-16">
            <div class="card col g-10 pad">
              <span class="up faint">Context the Copilot uses</span>
              <div class="row between tiny"><span class="muted">Startup</span><span class="b">{{ sName() }}</span></div>
              <div class="row between tiny"><span class="muted">Day</span><span class="b">{{ sDay() }}</span></div>
              <div class="row between tiny"><span class="muted">Stage</span><span class="b">{{ stageLabel() }}</span></div>
              <div class="row between tiny"><span class="muted">Followers</span><span class="b">{{ fmt.k(store.me().followers) }}</span></div>
              <div class="row between tiny"><span class="muted">Next task</span><span class="b clamp-2" style="max-width:150px;text-align:right">{{ nextTask() ?? '—' }}</span></div>
              @if (campaign(); as c) {
                <div class="row between tiny"><span class="muted">Round</span><span class="b">{{ pct(c.raised, c.goal) }}% funded</span></div>
              }
            </div>
            <div class="card col g-8 pad">
              <span class="up faint">Ask about</span>
              @for (p of prompts.slice(0, 6); track p.q) {
                <button class="prompt-chip" (click)="ask(p.q)">{{ p.emoji }} {{ p.label }}</button>
              }
            </div>
          </div>
        </div>
      }

      <!-- ==================== VALIDATOR ==================== -->
      @if (tab() === 'validator') {
        <div class="wsgrid">
          <div class="col g-16">
            <div class="card col g-14 pad-lg">
              <div class="col g-4">
                <h4>Validate an idea</h4>
                <span class="sm muted">Describe the problem, who has it, and how you would charge. The more specific, the better the read.</span>
              </div>
              <textarea class="textarea" rows="5" [(ngModel)]="idea"
                placeholder="e.g. Small grocers in Sfax lose stock because they track inventory on paper. A phone app that scans deliveries and warns before stockouts, 30 TND/month."></textarea>
              <div class="row between wrap g-10">
                <span class="mock-note"><app-icon name="lock" [size]="11" /> Simulated analysis — offline, deterministic</span>
                <button class="btn btn--primary" [disabled]="idea.trim().length < 12 || checking()" (click)="validate()">
                  @if (checking()) { Analysing… } @else { <app-icon name="sparkles" [size]="15" /> Analyse idea }
                </button>
              </div>
            </div>

            @if (analysis(); as a) {
              <div class="card fade-up">
                <div class="card__head">
                  <div class="row g-10">
                    <span style="font-size:20px">{{ a.emoji }}</span>
                    <span class="col">
                      <span class="b">{{ a.name }}</span>
                      <span class="tiny faint">{{ a.industry }} · {{ a.tagline }}</span>
                    </span>
                  </div>
                  <span class="tag tag--brand">{{ a.timing }}</span>
                </div>
                <div class="card__body col g-16">
                  <div class="row g-20 wrap">
                    <app-score-ring [value]="a.opportunityScore" [size]="94" caption="Opportunity" />
                    <div class="col g-10 grow" style="min-width:220px">
                      @for (m of meters(a); track m.label) {
                        <div class="col g-4">
                          <div class="row between tiny"><span class="muted">{{ m.label }}</span><span class="b">{{ m.v }}</span></div>
                          <app-bar [pct]="m.pct" [tone]="m.tone" [thin]="true" />
                        </div>
                      }
                    </div>
                  </div>

                  <div class="panel panel--brand col g-4">
                    <span class="up brand-text">Do this next</span>
                    <span class="sm b">{{ a.nextStep }}</span>
                  </div>

                  <div class="grid grid-2">
                    <div class="col g-8">
                      <span class="up seed-text">Working for you</span>
                      @for (x of a.strengths; track x) {
                        <span class="row-t g-8 sm"><app-icon name="check" [size]="13" class="seed-text" /> {{ x }}</span>
                      }
                    </div>
                    <div class="col g-8">
                      <span class="up rose-text">Watch out</span>
                      @for (x of a.risks; track x) {
                        <span class="row-t g-8 sm"><app-icon name="alert" [size]="13" class="rose-text" /> {{ x }}</span>
                      }
                    </div>
                  </div>

                  <div class="divider"></div>
                  <span class="up faint">Market</span>
                  <div class="stat-grid">
                    @for (m of a.marketSize; track m.label) {
                      <div class="stat">
                        <span class="stat__v">{{ m.value }}</span>
                        <span class="stat__l">{{ m.label }}</span>
                        <span class="tiny faint">{{ m.note }}</span>
                      </div>
                    }
                  </div>

                  <span class="up faint">Who else is there</span>
                  @for (c of a.competitors; track c.name) {
                    <div class="hl-row">
                      <span class="tag">{{ c.kind }}</span>
                      <span class="grow"><span class="sm b">{{ c.name }}</span>
                        <span class="tiny muted" style="display:block">{{ c.note }}</span></span>
                    </div>
                  }

                  <span class="up faint">Smallest MVP worth building</span>
                  <div class="grid grid-3">
                    @for (m of a.mvp; track m.label) {
                      <div class="panel col g-4">
                        <span class="sm b">{{ m.label }}</span>
                        <span class="tiny muted">{{ m.why }}</span>
                      </div>
                    }
                  </div>
                  <div class="panel panel--seed col g-4">
                    <span class="up seed-text">Pricing to test</span>
                    <span class="sm">{{ a.pricing }}</span>
                  </div>
                </div>
                <div class="card__foot row between wrap g-10">
                  <span class="tiny faint">Validation is worth more from real people than from a model.</span>
                  <div class="row g-8">
                    <button class="btn btn--sm" (click)="askCommunity(a)">
                      <app-icon name="users" [size]="14" /> Ask the community
                    </button>
                    <a class="btn btn--sm btn--primary" routerLink="/build/roadmap">Turn into a roadmap</a>
                  </div>
                </div>
              </div>
            }
          </div>

          <div class="col g-16">
            <div class="card col g-10 pad">
              <span class="up faint">How to read this</span>
              <span class="tiny muted">
                The score weighs market pull, competition, execution risk and timing. It is a starting point for
                conversations with customers — not a verdict, and not investment advice.
              </span>
            </div>
            @if (store.analyses().length) {
              <div class="card col g-8 pad">
                <span class="up faint">Earlier analyses</span>
                @for (a of store.analyses(); track a.idea) {
                  <button class="prompt-chip" (click)="reopen(a)">
                    {{ a.emoji }} {{ a.name }} · {{ a.opportunityScore }}/100
                  </button>
                }
              </div>
            }
          </div>
        </div>
      }

      <!-- ==================== ROADMAP ==================== -->
      @if (tab() === 'roadmap') {
        @if (roadmap(); as rm) {
          <div class="wsgrid">
            <div class="col g-14">
              <div class="card card--tint row between wrap g-12 pad">
                <div class="col g-4">
                  <span class="up brand-text">{{ rm.sourceLabel }}</span>
                  <span class="sm b">{{ progress().done }} of {{ progress().total }} tasks done · {{ progress().pct }}%</span>
                </div>
                <div style="min-width:200px" class="grow"><app-bar [pct]="progress().pct" tone="brand" [thick]="true" /></div>
              </div>

              @for (ph of rm.phases; track ph.id) {
                <div class="phase">
                  <div class="phase__h" (click)="togglePhase(ph.id)">
                    <span class="tag" [class.tag--seed]="phasePct(ph.tasks) === 100">{{ phaseDone(ph.tasks) }}/{{ ph.tasks.length }}</span>
                    <span class="grow col g-4">
                      <span class="b sm">{{ ph.name }}</span>
                      <span class="tiny faint">{{ ph.goal }} · {{ ph.weeks }}</span>
                    </span>
                    <span style="width:74px"><app-bar [pct]="phasePct(ph.tasks)" tone="seed" [thin]="true" /></span>
                    <app-icon [name]="isOpen(ph.id) ? 'chevD' : 'chevR'" [size]="16" class="faint" />
                  </div>
                  @if (isOpen(ph.id)) {
                    @for (t of ph.tasks; track t.id) {
                      <div class="task" [class.done]="t.done">
                        <button class="tick" [class.on]="t.done" (click)="toggle(t.id)">
                          <app-icon name="check" [size]="11" [weight]="3.4" />
                        </button>
                        <span class="grow col g-4">
                          <span class="task__t sm b">{{ t.label }}</span>
                          @if (t.hint) { <span class="tiny faint">{{ t.hint }}</span> }
                        </span>
                        @if (t.owner) { <span class="tag">{{ t.owner }}</span> }
                      </div>
                    }
                    <div class="task" style="justify-content:flex-end;background:var(--canvas-2)">
                      <button class="btn btn--xs" (click)="sharePhase(ph.name, ph.goal, phasePct(ph.tasks))">
                        <app-icon name="send" [size]="12" /> Share this phase's progress
                      </button>
                    </div>
                  }
                </div>
              }
            </div>

            <div class="col g-16">
              <div class="card col g-10 pad">
                <span class="up faint">Why tick things off</span>
                <span class="tiny muted">
                  Completed tasks feed your Founder Score and become milestones on your public journey —
                  that is what supporters and experts actually look at.
                </span>
                @if (nextTask(); as t) {
                  <div class="panel panel--brand col g-4">
                    <span class="tiny faint">Next up</span>
                    <span class="sm b">{{ t }}</span>
                  </div>
                }
              </div>
              <div class="card col g-10 pad">
                <span class="up faint">Need a hand?</span>
                <span class="tiny muted">An expert can compress weeks of guesswork into one session.</span>
                <a class="btn btn--sm btn--outline-brand btn--block" routerLink="/experts">
                  <app-icon name="cap" [size]="14" /> Browse experts
                </a>
              </div>
            </div>
          </div>
        } @else {
          <app-empty icon="layers" title="No roadmap yet"
            text="Validate an idea and the Copilot will draft a phased roadmap you can work through.">
            <a class="btn btn--primary btn--sm" routerLink="/build/validator">Validate an idea</a>
          </app-empty>
        }
      }

      <!-- ==================== CAMPAIGN BUILDER ==================== -->
      @if (tab() === 'campaign') {
        <div class="wsgrid">
          <div class="col g-16">
            <div class="card card--seed-tint col g-8 pad">
              <div class="row g-8">
                <app-icon name="lock" [size]="16" class="amber-text" />
                <span class="b sm">Conceptual funding only</span>
              </div>
              <span class="sm muted">
                Nothing on this page moves money. Community rounds, rewards and supporter counts are simulated so you
                can see how the end of the journey would look.
              </span>
            </div>

            @if (campaign(); as c) {
              <div class="card">
                <div class="card__head">
                  <h4>Your round is live</h4>
                  <span class="tag tag--amber">{{ c.daysLeft }} days left</span>
                </div>
                <div class="card__body col g-14">
                  <span class="bb">{{ c.headline }}</span>
                  <app-bar [pct]="pct(c.raised, c.goal)" tone="amber" [thick]="true" />
                  <div class="stat-grid">
                    <div class="stat"><span class="stat__v">{{ fmt.money(c.raised, c.currency) }}</span><span class="stat__l">raised</span></div>
                    <div class="stat"><span class="stat__v">{{ fmt.n(c.goal) }}</span><span class="stat__l">goal ({{ c.currency }})</span></div>
                    <div class="stat"><span class="stat__v">{{ c.backers }}</span><span class="stat__l">supporters</span></div>
                    <div class="stat"><span class="stat__v">{{ pct(c.raised, c.goal) }}%</span><span class="stat__l">funded</span></div>
                  </div>
                  <div class="row g-8 wrap">
                    <a class="btn btn--primary" [routerLink]="['/fund', c.id]">Open campaign page <app-icon name="chevR" [size]="15" /></a>
                    <button class="btn" (click)="shareRound(c.headline)"><app-icon name="send" [size]="15" /> Post a funding update</button>
                    <button class="btn" (click)="store.toast('Campaign editing is mocked in this demo', '✏️')">
                      <app-icon name="edit" [size]="15" /> Edit round
                    </button>
                  </div>
                </div>
              </div>
            } @else if (s(); as s) {
              <div class="card">
                <div class="card__head">
                  <h4>Build your community round</h4>
                  <div class="step-dots">
                    @for (i of [1, 2, 3]; track i) {
                      <span class="step-dot" [class.on]="cstep() === i" [class.past]="cstep() > i"></span>
                    }
                  </div>
                </div>
                <div class="card__body col g-16">
                  @if (cstep() === 1) {
                    <div class="field">
                      <label>Headline</label>
                      <input class="input" [(ngModel)]="headline" placeholder="Help us put {{ s.name }} in 100 more hands" />
                    </div>
                    <div class="field">
                      <label>Why now</label>
                      <textarea class="textarea" rows="4" [(ngModel)]="pitch"
                        placeholder="What you have proven so far, what the money unlocks, and what supporters get."></textarea>
                      <span class="hint">Your journey is the pitch — {{ myPosts().length }} public updates already back this up.</span>
                    </div>
                    <div class="grid grid-2">
                      <div class="field">
                        <label>Goal ({{ store.currency }})</label>
                        <input class="input num" type="number" min="1000" step="500" [(ngModel)]="goal" />
                      </div>
                      <div class="field">
                        <label>Duration (days)</label>
                        <select class="select" [(ngModel)]="days">
                          @for (d of [14, 21, 30, 45]; track d) { <option [value]="d">{{ d }} days</option> }
                        </select>
                      </div>
                    </div>
                  }

                  @if (cstep() === 2) {
                    <div class="col g-12">
                      <span class="up faint">Where the money goes</span>
                      @for (sl of slices; track sl.label) {
                        <div class="row g-12">
                          <span class="sm grow">{{ sl.label }}</span>
                          <input class="input num" type="number" min="0" max="100" step="5" style="width:82px" [(ngModel)]="sl.pct" />
                          <span class="tiny faint">%</span>
                        </div>
                      }
                      <span class="tiny" [class.rose-text]="totalPct() !== 100" [class.faint]="totalPct() === 100">
                        Total {{ totalPct() }}% — {{ totalPct() === 100 ? 'balanced' : 'should add up to 100%' }}
                      </span>
                    </div>
                  }

                  @if (cstep() === 3) {
                    <div class="col g-12">
                      <span class="up faint">Reward tiers</span>
                      @for (r of rewards; track r.id) {
                        <div class="panel col g-8">
                          <div class="row g-10">
                            <input class="input" [(ngModel)]="r.title" style="flex:2" />
                            <input class="input num" type="number" step="10" [(ngModel)]="r.amount" style="width:104px" />
                          </div>
                          <input class="input" [(ngModel)]="r.desc" placeholder="What the supporter gets" />
                        </div>
                      }
                      <span class="mock-note"><app-icon name="lock" [size]="11" /> Rewards are illustrative — nothing is charged or shipped</span>
                    </div>
                  }
                </div>
                <div class="card__foot row between">
                  @if (cstep() > 1) {
                    <button class="btn btn--sm" (click)="cstep.set(cstep() - 1)"><app-icon name="arrowL" [size]="14" /> Back</button>
                  } @else { <span class="tiny faint">Step {{ cstep() }} of 3</span> }
                  @if (cstep() < 3) {
                    <button class="btn btn--primary btn--sm" [disabled]="cstep() === 1 && !headline.trim()" (click)="cstep.set(cstep() + 1)">
                      Continue <app-icon name="chevR" [size]="14" />
                    </button>
                  } @else {
                    <button class="btn btn--seed btn--sm" (click)="launch()">
                      <app-icon name="rocket" [size]="14" /> Create campaign page
                    </button>
                  }
                </div>
              </div>
            } @else {
              <app-empty icon="dollar" title="Create a startup first"
                text="A community round only works once there is a journey behind it.">
                <a class="btn btn--primary btn--sm" routerLink="/build/validator">Start with your idea</a>
              </app-empty>
            }
          </div>

          <div class="col g-16">
            @if (!campaign() && s()) {
              <div class="card col g-12 pad">
                <span class="up faint">Live preview</span>
                <span class="bb sm">{{ headline || 'Your headline goes here' }}</span>
                <app-bar [pct]="0" tone="amber" [thick]="true" />
                <div class="row between tiny">
                  <span class="muted">0 {{ store.currency }} raised</span>
                  <span class="b">goal {{ fmt.n(goal) }}</span>
                </div>
                <div class="divider"></div>
                <div class="row g-12" style="align-items:center">
                  <app-donut [slices]="donut()" [size]="104" centerTop="Use" centerSub="of funds" />
                  <div class="col g-6 grow">
                    @for (sl of slices; track sl.label) {
                      <div class="row g-8 tiny">
                        <i [style.background]="sl.color" style="width:9px;height:9px;border-radius:3px;flex:none"></i>
                        <span class="muted grow">{{ sl.label }}</span>
                        <span class="b">{{ sl.pct }}%</span>
                      </div>
                    }
                  </div>
                </div>
              </div>
            }
            <div class="card col g-10 pad">
              <span class="up faint">What makes rounds work here</span>
              <span class="tiny muted">Founders who post weekly raise from people who already follow the build.</span>
              <div class="divider"></div>
              <div class="row between tiny"><span class="muted">Your updates</span><span class="b">{{ myPosts().length }}</span></div>
              <div class="row between tiny"><span class="muted">Followers</span><span class="b">{{ fmt.k(sFollowers()) }}</span></div>
              <div class="row between tiny"><span class="muted">Founder Score</span><span class="b">{{ store.myScore() }}</span></div>
              <div class="row between tiny"><span class="muted">Endorsements</span><span class="b">{{ sEndorsements() }}</span></div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .wsgrid { display: grid; grid-template-columns: minmax(0, 1fr) 304px; gap: 16px; align-items: start; }
    @media (max-width: 1020px) { .wsgrid { grid-template-columns: 1fr; } }
  `],
})
export class BuildPage {
  readonly store = inject(Store);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  readonly fmt = fmt;
  readonly tabs = TABS;
  readonly prompts = COPILOT_PROMPTS;

  private data = toSignal(this.route.data);
  private query = toSignal(this.route.queryParamMap);
  readonly tab = computed(() => (this.data()?.['tab'] as string) ?? 'dashboard');
  readonly composeParam = computed(() => this.query()?.get('compose') === '1');

  readonly s = this.store.activeStartup;
  readonly roadmap = computed(() => this.store.roadmapOf(this.s()?.id));
  readonly campaign = computed(() => {
    const s = this.s();
    return s ? this.store.campaignOf(s.id) : undefined;
  });
  readonly myPosts = computed(() => this.store.postsBy('u_me'));
  readonly sName = computed(() => this.s()?.name ?? 'your idea');
  readonly sDay = computed(() => this.s()?.day ?? 1);
  readonly sFollowers = computed(() => this.s()?.followers ?? 0);
  readonly sEndorsements = computed(() => this.s()?.endorsements.length ?? 0);
  readonly progress = computed(() => this.store.roadmapProgress(this.s()?.id));
  readonly stageLabel = computed(() => this.s()?.stages.find(x => x.status === 'active')?.label ?? 'Idea');
  readonly nextTask = computed(() =>
    this.roadmap()?.phases.flatMap(p => p.tasks).find(t => !t.done)?.label);

  /* ---- dashboard cadence ---- */
  readonly cadence = computed(() => Math.min(7, this.myPosts().length));
  readonly cadencePct = computed(() => Math.min(100, (this.cadence() / 3) * 100));
  readonly cadenceHint = computed(() =>
    this.cadence() >= 3
      ? 'Strong cadence — supporters know what to expect.'
      : 'Three updates a week is the rhythm that builds an audience.');
  readonly stageHint = computed(() => {
    const l = this.stageLabel();
    return l === 'Idea' ? 'talk to 20 people before writing code'
      : l === 'Validation' ? 'look for people who pay, not people who nod'
      : l === 'MVP' ? 'ship something small that solves one thing'
      : l === 'Traction' ? 'find the channel that repeats'
      : l === 'Growth' ? 'make retention boring and predictable'
      : 'tell the story your numbers already prove';
  });

  /* ---- copilot ---- */
  q = '';
  readonly thinking = signal(false);

  ask(question: string): void {
    const text = question.trim();
    if (!text || this.thinking()) return;
    this.q = '';
    this.store.pushCopilotQuestion(text);
    this.thinking.set(true);
    const c = this.campaign();
    const ctx = {
      startup: this.s(),
      nextTask: this.nextTask(),
      followers: this.store.me().followers,
      campaign: c ? { raised: c.raised, goal: c.goal, backers: c.backers, pct: fmt.pct(c.raised, c.goal) } : undefined,
      score: this.store.myScore(),
    };
    setTimeout(() => {
      this.store.pushCopilotAnswer(copilotAnswer(text, ctx));
      this.thinking.set(false);
    }, 850);
  }

  /* ---- validator ---- */
  idea = '';
  readonly checking = signal(false);
  readonly analysis = signal<IdeaAnalysis | null>(null);

  validate(): void {
    this.checking.set(true);
    const text = this.idea;
    setTimeout(() => {
      const a = analyzeIdea(text);
      this.store.saveAnalysis(a);
      this.analysis.set(a);
      this.checking.set(false);
      this.store.addScore('Idea validated', 2);
    }, 1100);
  }

  reopen(a: IdeaAnalysis): void {
    this.idea = a.idea;
    this.analysis.set(a);
  }

  meters(a: IdeaAnalysis): { label: string; v: string; pct: number; tone: 'brand' | 'seed' | 'amber' }[] {
    const scale = (v: string) => (v === 'High' ? 92 : v === 'Medium' ? 58 : 26);
    return [
      { label: 'Market potential', v: a.marketPotential, pct: scale(a.marketPotential), tone: 'seed' },
      { label: 'Competition', v: a.competition, pct: scale(a.competition), tone: 'amber' },
      { label: 'Execution risk', v: a.risk, pct: scale(a.risk), tone: 'amber' },
      { label: 'Timing', v: a.timing, pct: 78, tone: 'brand' },
    ];
  }

  askCommunity(a: IdeaAnalysis): void {
    this.store.publish({
      type: 'question',
      text: `Testing an idea: ${a.tagline}\n\nBiggest risk I see is "${a.risks[0]}". If you are in ${a.segments[0]}, would this be worth paying for — and what would stop you?`,
      startupId: this.s()?.id,
      withDay: !!this.s(),
    });
    this.router.navigate(['/home']);
  }

  /* ---- roadmap ---- */
  private closed = signal<string[]>([]);
  isOpen = (id: string) => !this.closed().includes(id);
  togglePhase(id: string): void {
    this.closed.update(l => (l.includes(id) ? l.filter(x => x !== id) : [...l, id]));
  }
  phaseDone = (tasks: { done: boolean }[]) => tasks.filter(t => t.done).length;
  phasePct = (tasks: { done: boolean }[]) =>
    tasks.length ? Math.round((this.phaseDone(tasks) / tasks.length) * 100) : 0;

  toggle(taskId: string): void {
    const s = this.s();
    if (s) this.store.toggleTask(s.id, taskId);
  }

  sharePhase(name: string, goal: string, pct: number): void {
    this.store.publish({
      type: 'build',
      text: `${name} is ${pct}% done. Goal for this phase: ${goal.toLowerCase()}.\n\nSharing the messy middle as well as the wins — ask me anything about what I learned this week.`,
      startupId: this.s()?.id,
      withDay: true,
    });
  }

  /* ---- campaign builder ---- */
  readonly cstep = signal(1);
  headline = '';
  pitch = '';
  goal = 25000;
  days = 30;
  slices = [
    { label: 'Product & engineering', pct: 45, color: 'var(--brand-600)' },
    { label: 'Hardware & inventory', pct: 35, color: 'var(--seed-500)' },
    { label: 'Community & support', pct: 20, color: 'var(--amber-500)' },
  ];
  rewards = [
    { id: 'r1', title: 'Early supporter', amount: 50, desc: 'Name on the wall of supporters and weekly behind-the-scenes updates', claimed: 0, perks: [] },
    { id: 'r2', title: 'First 100 users', amount: 150, desc: 'Three months of the product free when it launches', claimed: 0, perks: [] },
    { id: 'r3', title: 'Founding partner', amount: 600, desc: 'On-site setup, priority support and a say in the roadmap', claimed: 0, perks: [] },
  ];

  totalPct = () => this.slices.reduce((a, b) => a + Number(b.pct || 0), 0);
  donut = () => this.slices.map(s => ({ label: s.label, pct: Number(s.pct || 0), color: s.color }));

  launch(): void {
    const s = this.s();
    if (!s) return;
    const camp = this.store.createCampaign({
      startupId: s.id,
      headline: this.headline.trim() || `Help us grow ${s.name}`,
      pitch: this.pitch.trim() || s.tagline,
      goal: Number(this.goal) || 25000,
      days: Number(this.days) || 30,
      useOfFunds: this.donut(),
      rewards: this.rewards.map(r => ({ ...r, amount: Number(r.amount) || 0, perks: [r.desc] })),
      why: [
        `${this.myPosts().length} public updates already document the build`,
        `Day ${s.day} of building in public in ${s.city}`,
        s.tagline,
      ],
    });
    this.router.navigate(['/fund', camp.id]);
  }

  pct = (a: number, b: number) => fmt.pct(a, b);

  shareRound(headline: string): void {
    this.store.publish({
      type: 'funding',
      text: `${headline}\n\nThe community round is open. Every supporter gets the same weekly updates you have been reading since Day 1.`,
      startupId: this.s()?.id,
      withDay: true,
    });
  }
}
