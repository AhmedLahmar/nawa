import { Component, ElementRef, OnDestroy, computed, inject, signal, viewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ME_ID } from '../core/mock-data';
import { Store } from '../core/store';
import { CounselorHistory } from '../services/counselor-history';
import { CancelledError, DemoSettings } from '../services/demo';
import {
  ControlLevel, Destination, GenerationResult, GenerationStage, HOSTS, ProjectApi, ProjectBrief, ProjectPrefs,
  RepoApi, RepoProvider, STACKS, buildPlan,
} from '../services/project';
import {
  STEP_LABELS, StepId, WizardDraft, WizardDrafts, autopilotPrefs, blocker, initialDraft, nextStep, prevStep, stepState, visibleSteps,
} from '../services/wizard';
import { UI } from '../ui/ui';

const LEVELS: { key: ControlLevel; title: string; text: string; detail: string; icon: string }[] = [
  { key: 'autopilot', title: 'Autopilot', text: 'We decide, you approve.', detail: 'We pick sensible settings and show you the plan before anything happens. Fastest.', icon: 'zap' },
  { key: 'guided', title: 'Guided', text: 'You make a few key choices.', detail: 'Choose what it’s built with, where it’s hosted and where the code goes.', icon: 'compass' },
  { key: 'handson', title: 'Hands-on', text: 'You control everything.', detail: 'Adds automated checks, folder layout, local setup and licence.', icon: 'grid' },
];

@Component({
  selector: 'app-generate-page',
  standalone: true,
  imports: [RouterLink, FormsModule, UI],
  template: `
    <div class="page page--narrow">
      @if (!s()) {
        <app-empty icon="rocket" title="Create a startup first" text="The generator builds a starter project from your startup and its idea.">
          <a class="btn btn--primary btn--sm" routerLink="/onboarding">Start with your idea</a>
        </app-empty>
      } @else if (!isOwner()) {
        <app-empty icon="lock" title="Only the founder can generate this project" text="Open the generator from one of your own startups.">
          <a class="btn btn--primary btn--sm" routerLink="/build">Back to your workspace</a>
        </app-empty>
      } @else if (d(); as d) {
        <!-- ---------- header ---------- -->
        <div class="page-head">
          <div class="col g-6">
            <span class="kicker"><app-icon name="code" [size]="13" /> Generate my project</span>
            <h1 class="display-lg">Turn {{ s()!.name }} into a starter project</h1>
            <div class="row g-8 wrap">
              <span class="mock-note"><app-icon name="lock" [size]="11" /> Demo — nothing is created on GitHub, GitLab or any host</span>
              @if (d.level && !busy()) {
                <span class="tag">Control: {{ levelTitle(d.level) }}</span>
                <button type="button" class="link tiny btn-reset" style="width:auto" (click)="go('control')">Change</button>
              }
            </div>
          </div>
        </div>

        @if (resumed()) {
          <div class="panel panel--brand row between wrap g-8 mb-16" role="status">
            <span class="sm">Picked up where you left off ({{ resumed() }}).</span>
            <button type="button" class="btn btn--xs" (click)="startOver()">Start over</button>
          </div>
        }

        <!-- ---------- progress ---------- -->
        <nav aria-label="Setup progress" class="mb-16">
          <ol class="stepper">
            @for (st of steps(); track st; let i = $index) {
              <li [class]="'stepper__i stepper__i--' + state(st)" [attr.aria-current]="st === d.step ? 'step' : null">
                <span class="stepper__n" aria-hidden="true">
                  @if (state(st) === 'done') { <app-icon name="check" [size]="11" [weight]="3" /> } @else { {{ i + 1 }} }
                </span>
                <span class="stepper__l">{{ label(st) }}</span>
                <span class="sr-only">{{ state(st) === 'done' ? '(completed)' : state(st) === 'current' ? '(current step)' : '' }}</span>
              </li>
            }
          </ol>
        </nav>

        <section class="card card--lg">
          <div class="pad-lg col g-16">
            <h2 #stepHeading tabindex="-1" class="step-h">{{ heading(d.step) }}</h2>

            @switch (d.step) {
              <!-- ================= 1. control level ================= -->
              @case ('control') {
                <p class="muted sm">How much do you want to decide yourself? You can change this later.</p>
                <div class="levels">
                  @for (l of levels; track l.key) {
                    <button type="button" class="level" [class.level--on]="d.level === l.key" [attr.aria-pressed]="d.level === l.key"
                      (click)="chooseLevel(l.key)">
                      <span class="level__ic" aria-hidden="true"><app-icon [name]="l.icon" [size]="18" /></span>
                      <span class="b">{{ l.title }}</span>
                      <span class="sm">{{ l.text }}</span>
                      <span class="tiny muted">{{ l.detail }}</span>
                    </button>
                  }
                </div>
              }

              <!-- ================= 2. brief ================= -->
              @case ('brief') {
                <p class="muted sm">This is what we’ll build. We filled it in from your profile, {{ s()!.name }}{{ review() ? ' and your Counselor review' : '' }} — change anything.</p>
                @if (review(); as r) {
                  <div class="panel row between wrap g-8">
                    <span class="sm"><app-icon name="cap" [size]="13" style="display:inline;vertical-align:-2px" /> Using Counselor review v{{ r.version }}: <b>{{ r.review.verdictLabel }}</b> — its next steps are your goals.</span>
                    <button type="button" class="btn btn--xs" (click)="detachReview()">Don’t use it</button>
                  </div>
                }
                <div class="field">
                  <label for="g-name">Project name</label>
                  <input id="g-name" class="input" [ngModel]="d.brief.name" (ngModelChange)="patchBrief({ name: $event })" />
                </div>
                <div class="field">
                  <label for="g-sum">What we’ll build</label>
                  <textarea id="g-sum" class="textarea" rows="3" [ngModel]="d.brief.summary" (ngModelChange)="patchBrief({ summary: $event })"
                    aria-describedby="g-sum-h"></textarea>
                  <span id="g-sum-h" class="hint">One or two sentences. It becomes the top of your README.</span>
                </div>
                <div class="field">
                  <label for="g-aud">Who it’s for</label>
                  <input id="g-aud" class="input" [ngModel]="d.brief.audience" (ngModelChange)="patchBrief({ audience: $event })" />
                </div>
                <div class="grid grid-2">
                  <div class="field">
                    <label for="g-feat">First features (one per line)</label>
                    <textarea id="g-feat" class="textarea" rows="4" [ngModel]="lines(d.brief.features)" (ngModelChange)="patchBrief({ features: split($event) })"></textarea>
                  </div>
                  <div class="field">
                    <label for="g-goals">Goals (one per line)</label>
                    <textarea id="g-goals" class="textarea" rows="4" [ngModel]="lines(d.brief.goals)" (ngModelChange)="patchBrief({ goals: split($event) })"></textarea>
                  </div>
                </div>
              }

              <!-- ================= 3. preferences ================= -->
              @case ('preferences') {
                <p class="muted sm">{{ d.level === 'handson' ? 'Every setting is yours to choose.' : 'Just the choices that matter most. We’ll handle the rest.' }}</p>

                <fieldset class="fs">
                  <legend>What should it be built with?</legend>
                  <div class="opts">
                    @for (st of stacks; track st.id) {
                      <label class="opt" [class.opt--on]="d.prefs.stack === st.id">
                        <input type="radio" name="stack" [value]="st.id" [checked]="d.prefs.stack === st.id" (change)="patchPrefs({ stack: st.id })" />
                        <span class="col"><span class="sm b">{{ st.plain }}</span><span class="tiny muted">{{ st.label }}</span></span>
                      </label>
                    }
                  </div>
                </fieldset>

                <fieldset class="fs">
                  <legend>Where should the code go?</legend>
                  <div class="opts opts--3">
                    @for (o of destinations; track o.key) {
                      <label class="opt" [class.opt--on]="d.prefs.destination === o.key">
                        <input type="radio" name="dest" [value]="o.key" [checked]="d.prefs.destination === o.key" (change)="patchPrefs({ destination: o.key })" />
                        <span class="col"><span class="sm b">{{ o.label }}</span><span class="tiny muted">{{ o.note }}</span></span>
                      </label>
                    }
                  </div>
                </fieldset>

                @if (d.prefs.destination !== 'zip') {
                  <fieldset class="fs">
                    <legend>Where should it be hosted?</legend>
                    <div class="opts opts--3">
                      @for (h of hosts; track h.id) {
                        <label class="opt" [class.opt--on]="d.prefs.hosting === h.id">
                          <input type="radio" name="host" [value]="h.id" [checked]="d.prefs.hosting === h.id" (change)="patchPrefs({ hosting: h.id })" />
                          <span class="sm b">{{ h.label }}</span>
                        </label>
                      }
                    </div>
                  </fieldset>
                  <fieldset class="fs">
                    <legend>Who can see the code?</legend>
                    <div class="opts opts--3">
                      <label class="opt" [class.opt--on]="d.prefs.visibility === 'private'">
                        <input type="radio" name="vis" value="private" [checked]="d.prefs.visibility === 'private'" (change)="patchPrefs({ visibility: 'private' })" />
                        <span class="col"><span class="sm b">Only me</span><span class="tiny muted">Private repository</span></span>
                      </label>
                      <label class="opt" [class.opt--on]="d.prefs.visibility === 'public'">
                        <input type="radio" name="vis" value="public" [checked]="d.prefs.visibility === 'public'" (change)="patchPrefs({ visibility: 'public' })" />
                        <span class="col"><span class="sm b">Everyone</span><span class="tiny muted">Public — good for building in public</span></span>
                      </label>
                    </div>
                  </fieldset>
                }

                @if (d.level === 'handson') {
                  <div class="divider"></div>
                  <span class="up faint">Hands-on options</span>
                  <label class="row g-8 sm" style="cursor:pointer">
                    <input type="checkbox" [checked]="d.prefs.ci" (change)="patchPrefs({ ci: $any($event.target).checked })" />
                    Run automated checks on every change (CI)
                  </label>
                  <fieldset class="fs">
                    <legend>Folder structure</legend>
                    <div class="opts opts--3">
                      @for (o of structures; track o.key) {
                        <label class="opt" [class.opt--on]="d.prefs.structure === o.key">
                          <input type="radio" name="struct" [value]="o.key" [checked]="d.prefs.structure === o.key" (change)="patchPrefs({ structure: o.key })" />
                          <span class="col"><span class="sm b">{{ o.label }}</span><span class="tiny muted">{{ o.note }}</span></span>
                        </label>
                      }
                    </div>
                  </fieldset>
                  <fieldset class="fs">
                    <legend>Local setup</legend>
                    <div class="opts">
                      @for (o of envs; track o.key) {
                        <label class="opt" [class.opt--on]="d.prefs.envSetup === o.key">
                          <input type="radio" name="env" [value]="o.key" [checked]="d.prefs.envSetup === o.key" (change)="patchPrefs({ envSetup: o.key })" />
                          <span class="col"><span class="sm b">{{ o.label }}</span><span class="tiny muted">{{ o.note }}</span></span>
                        </label>
                      }
                    </div>
                  </fieldset>
                  <div class="field" style="max-width:280px">
                    <label for="g-lic">Licence</label>
                    <select id="g-lic" class="select" [ngModel]="d.prefs.license" (ngModelChange)="patchPrefs({ license: $event })">
                      <option value="MIT">MIT — anyone can reuse it</option>
                      <option value="Apache-2.0">Apache 2.0 — reuse with patent protection</option>
                      <option value="Proprietary">Proprietary — all rights reserved</option>
                    </select>
                  </div>
                }
              }

              <!-- ================= 4. repository ================= -->
              @case ('repository') {
                <p class="muted sm">Connect the account you already use. Nawa never creates accounts for you.</p>
                <fieldset class="fs">
                  <legend>Destination</legend>
                  <div class="opts opts--3">
                    @for (o of destinations; track o.key) {
                      <label class="opt" [class.opt--on]="d.prefs.destination === o.key">
                        <input type="radio" name="dest2" [value]="o.key" [checked]="d.prefs.destination === o.key" (change)="patchPrefs({ destination: o.key })" />
                        <span class="col"><span class="sm b">{{ o.label }}</span><span class="tiny muted">{{ o.note }}</span></span>
                      </label>
                    }
                  </div>
                </fieldset>

                @if (d.prefs.destination === 'zip') {
                  <div class="panel row-t g-10">
                    <app-icon name="download" [size]="18" class="brand-text" />
                    <span class="sm">You’ll get a ZIP of the starter project at the end. Nothing is connected to your accounts and nothing is deployed.</span>
                  </div>
                } @else {
                  @if (account(); as a) {
                    <div class="panel panel--seed row between wrap g-10">
                      <span class="row g-10">
                        <app-av [name]="a.handle" [size]="34" />
                        <span class="col"><span class="sm b">Connected as &#64;{{ a.handle }}</span><span class="tiny muted">{{ a.name }} · existing account</span></span>
                      </span>
                      <button type="button" class="btn btn--xs" (click)="repo.disconnect()">Disconnect</button>
                    </div>
                    @if (a.provider !== d.prefs.destination) {
                      <div class="panel panel--amber row between wrap g-8">
                        <span class="sm">This account is on {{ a.name }}, but you chose {{ providerName(d.prefs.destination) }}.</span>
                        <button type="button" class="btn btn--xs" (click)="openConnect()">Connect {{ providerName(d.prefs.destination) }} instead</button>
                      </div>
                    }
                  } @else {
                    <div class="col g-8">
                      <button type="button" class="btn btn--primary btn--lg" style="align-self:flex-start" (click)="openConnect()">
                        <app-icon name="link" [size]="16" /> Connect your {{ providerName(d.prefs.destination) }} account
                      </button>
                      <span class="tiny muted">You’ll be asked to approve access on {{ providerName(d.prefs.destination) }}. Don’t want to connect? Choose <b>Download as ZIP</b>.</span>
                    </div>
                  }
                  <label class="row g-8 tiny muted" style="cursor:pointer">
                    <input type="checkbox" [checked]="demo.isArmed('connect')" (change)="toggleFail('connect', $any($event.target).checked)" />
                    Demo: make the next connection fail
                  </label>
                }
              }

              <!-- ================= 5. plan review ================= -->
              @case ('plan') {
                @if (plan(); as p) {
                  <p class="muted sm">This is exactly what will be created. Nothing happens until you confirm.</p>
                  <div class="plan">
                    <section aria-labelledby="pl-repo">
                      <div class="row between"><h3 id="pl-repo">{{ p.repo ? 'Repository' : 'Download' }}</h3>
                        <button type="button" class="link tiny btn-reset" style="width:auto" (click)="go('repository')">Edit</button></div>
                      @if (p.repo; as r) {
                        <p class="sm"><code>{{ r.owner }}/{{ r.name }}</code> on {{ providerName(r.provider) }} · {{ r.visibility === 'private' ? 'Private' : 'Public' }}</p>
                        <p class="tiny muted">Branches: @for (b of p.branches; track b; let last = $last) { <code>{{ b }}</code>{{ last ? '' : ', ' }} }</p>
                      } @else {
                        <p class="sm">A ZIP file — no repository, no deployment.</p>
                      }
                    </section>
                    <section aria-labelledby="pl-ci">
                      <div class="row between"><h3 id="pl-ci">Automated checks (CI)</h3>
                        @if (d.level !== 'autopilot') { <button type="button" class="link tiny btn-reset" style="width:auto" (click)="go('preferences')">Edit</button> }</div>
                      @if (p.ci; as c) {
                        <p class="sm"><code>{{ c.file }}</code></p>
                        <p class="tiny muted">{{ c.steps.join(' → ') }}</p>
                      } @else { <p class="sm muted">Not included.</p> }
                    </section>
                    <section aria-labelledby="pl-dep">
                      <h3 id="pl-dep">Deployment</h3>
                      @if (p.deploy; as dp) {
                        <p class="sm">{{ dp.host }} · <code>{{ dp.url }}</code></p>
                        <p class="tiny muted">{{ dp.trigger }}</p>
                      } @else { <p class="sm muted">Not deployed (ZIP).</p> }
                    </section>
                    <section aria-labelledby="pl-readme">
                      <div class="row between"><h3 id="pl-readme">README</h3>
                        <button type="button" class="link tiny btn-reset" style="width:auto" (click)="go('brief')">Edit</button></div>
                      <ul class="plain tiny muted">@for (r of p.readme; track r) { <li>{{ r }}</li> }</ul>
                    </section>
                  </div>
                  <section aria-labelledby="pl-files">
                    <h3 id="pl-files" class="mb-8">Starter code · {{ p.stack }} · {{ p.license }}</h3>
                    <ul class="files">
                      @for (f of p.files; track f.path) {
                        <li><code>{{ f.path }}</code><span class="tiny muted">{{ f.note }}</span></li>
                      }
                    </ul>
                  </section>
                  <label class="row g-8 tiny muted" style="cursor:pointer">
                    <input type="checkbox" [checked]="demo.isArmed('generate')" (change)="toggleFail('generate', $any($event.target).checked)" />
                    Demo: make generation fail at the scaffolding stage
                  </label>
                }
              }

              <!-- ================= 6. generating ================= -->
              @case ('generating') {
                <p class="sr-only" aria-live="polite">{{ live() }}</p>
                @if (genError(); as err) {
                  <div class="panel panel--rose col g-10" role="alert">
                    <span class="sm b row g-8"><app-icon name="alert" [size]="16" class="rose-text" /> Generation stopped</span>
                    <span class="sm">{{ err }}</span>
                    <div class="row g-8">
                      <button type="button" class="btn btn--primary btn--sm" (click)="startGeneration()">Try again</button>
                      <button type="button" class="btn btn--sm" (click)="go('plan')">Back to the plan</button>
                    </div>
                  </div>
                } @else {
                  <app-bar [pct]="genPct()" tone="brand" [thick]="true" />
                }
                <ol class="gen">
                  @for (g of stages(); track g.key; let i = $index) {
                    <li [class]="'gen__i gen__i--' + genState(i)">
                      <span class="gen__dot" aria-hidden="true">
                        @if (genState(i) === 'done') { <app-icon name="check" [size]="12" [weight]="3" /> }
                        @else if (genState(i) === 'failed') { <app-icon name="x" [size]="12" [weight]="3" /> }
                      </span>
                      <span class="sm">{{ g.label }}</span>
                      <span class="tiny muted">{{ genState(i) === 'done' ? 'Done' : genState(i) === 'current' ? 'In progress…' : genState(i) === 'failed' ? 'Failed' : 'Waiting' }}</span>
                    </li>
                  }
                </ol>
              }

              <!-- ================= 7. result ================= -->
              @case ('result') {
                @if (result(); as r) {
                  <div class="panel panel--seed row g-10" role="status">
                    <app-icon name="check" [size]="18" class="seed-text" />
                    <span class="sm b">{{ s()!.name }} is ready (simulated).</span>
                  </div>
                  <div class="grid grid-2">
                    @if (r.repoUrl) {
                      <div class="col g-6">
                        <span class="up faint">Repository</span>
                        <code class="url">{{ r.repoUrl }}</code>
                        <button type="button" class="btn btn--sm" style="align-self:flex-start" (click)="openDemoLink('repository')">
                          <app-icon name="branch" [size]="14" /> Open repository
                        </button>
                      </div>
                    }
                    @if (r.liveUrl) {
                      <div class="col g-6">
                        <span class="up faint">Live site</span>
                        <code class="url">{{ r.liveUrl }}</code>
                        <button type="button" class="btn btn--sm" style="align-self:flex-start" (click)="openDemoLink('live site')">
                          <app-icon name="globe" [size]="14" /> Open live site
                        </button>
                      </div>
                    }
                    @if (r.zipName) {
                      <div class="col g-6">
                        <span class="up faint">Download</span>
                        <code class="url">{{ r.zipName }}</code>
                        <button type="button" class="btn btn--primary btn--sm" style="align-self:flex-start" (click)="downloadZip()">
                          <app-icon name="download" [size]="14" /> Download ZIP
                        </button>
                      </div>
                    }
                  </div>
                  <span class="tiny faint">Demo links — no repository, site or file was actually created.</span>
                  <div class="grid grid-2">
                    <section aria-labelledby="rs-gen">
                      <h3 id="rs-gen" class="mb-8">What was generated</h3>
                      <ul class="files">@for (f of r.generated; track f) { <li><code>{{ f }}</code></li> }</ul>
                    </section>
                    <section aria-labelledby="rs-next">
                      <h3 id="rs-next" class="mb-8">Suggested next steps</h3>
                      <ol class="nsteps">@for (n of r.nextSteps; track n) { <li class="sm">{{ n }}</li> }</ol>
                    </section>
                  </div>
                  <div class="row g-8 wrap">
                    <a class="btn btn--primary" routerLink="/build" [queryParams]="{ compose: 1 }"><app-icon name="send" [size]="15" /> Share it in a Build in Public update</a>
                    <a class="btn" routerLink="/build">Back to workspace</a>
                    <button type="button" class="btn btn--ghost" (click)="startOver()">Generate another</button>
                  </div>
                }
              }
            }

            <!-- ---------- footer navigation ---------- -->
            @if (d.step !== 'control' && d.step !== 'result' && d.step !== 'generating') {
              <div class="divider"></div>
              @if (stepBlocker(); as why) { <p id="g-block" class="tiny amber-text">{{ why }}</p> }
              <div class="row between wrap g-10">
                <div class="row g-8">
                  <button type="button" class="btn" (click)="back()"><app-icon name="arrowL" [size]="15" /> Back</button>
                  <button type="button" class="btn btn--ghost" (click)="saveAndExit()">Save &amp; exit</button>
                  <button type="button" class="btn btn--ghost" (click)="askCancel()">Cancel</button>
                </div>
                @if (d.step === 'plan') {
                  <button type="button" class="btn btn--seed btn--lg" (click)="startGeneration()"><app-icon name="rocket" [size]="16" /> Confirm &amp; generate</button>
                } @else {
                  <button type="button" class="btn btn--primary btn--lg" [disabled]="!!stepBlocker()"
                    [attr.aria-describedby]="stepBlocker() ? 'g-block' : null" (click)="next()">
                    Continue <app-icon name="arrowR" [size]="16" />
                  </button>
                }
              </div>
            }
            @if (d.step === 'control') {
              <div class="divider"></div>
              <div class="row g-8">
                @if (d.level) { <button type="button" class="btn" (click)="next()">Keep {{ levelTitle(d.level) }} <app-icon name="arrowR" [size]="15" /></button> }
                <button type="button" class="btn btn--ghost" (click)="saveAndExit()">Save &amp; exit</button>
                <button type="button" class="btn btn--ghost" (click)="askCancel()">Cancel</button>
              </div>
            }
            @if (d.step === 'generating' && !genError()) {
              <div class="row"><button type="button" class="btn" (click)="cancelGeneration()">Cancel generation</button></div>
            }
          </div>
        </section>

        <!-- ---------- mock OAuth consent (existing account only) ---------- -->
        @if (connectOpen()) {
          <app-dialog [title]="providerName(d.prefs.destination) + ' — authorize Nawa'"
            subtitle="Demo of the sign-in step. No real account is accessed." (close)="closeConnect()">
            <div class="col g-12">
              <div class="row g-10">
                <app-av [name]="store.me().handle" [size]="36" />
                <span class="col"><span class="sm b">Signed in as &#64;{{ store.me().handle }}</span><span class="tiny muted">Your existing {{ providerName(d.prefs.destination) }} account</span></span>
              </div>
              <span class="sm b">Nawa would like to:</span>
              <ul class="plain col g-6 sm">
                <li class="row g-8"><app-icon name="check" [size]="14" class="seed-text" /> Create the one repository you confirm in the plan</li>
                <li class="row g-8"><app-icon name="check" [size]="14" class="seed-text" /> Push the starter code to it</li>
                <li class="row g-8"><app-icon name="check" [size]="14" class="seed-text" /> Read your username</li>
              </ul>
              <span class="tiny muted">You can revoke access at any time from your {{ providerName(d.prefs.destination) }} settings.</span>
              @if (connectError(); as e) { <div class="panel panel--rose sm" role="alert">{{ e }}</div> }
              <div class="row g-8" style="justify-content:flex-end">
                <button type="button" class="btn" (click)="closeConnect()">Cancel</button>
                <button type="button" class="btn btn--primary" [disabled]="connecting()" (click)="authorize()">
                  {{ connecting() ? 'Waiting for ' + providerName(d.prefs.destination) + '…' : connectError() ? 'Try again' : 'Authorize' }}
                </button>
              </div>
            </div>
          </app-dialog>
        }

        <!-- ---------- cancel confirmation ---------- -->
        @if (confirmCancel()) {
          <app-dialog title="Discard this project setup?" subtitle="Your saved progress for this project will be deleted." (close)="confirmCancel.set(false)">
            <div class="row g-8" style="justify-content:flex-end">
              <button type="button" class="btn" (click)="confirmCancel.set(false)">Keep editing</button>
              <button type="button" class="btn danger" (click)="discard()">Discard</button>
            </div>
          </app-dialog>
        }
      }
    </div>
  `,
  styles: [`
    .plain { list-style: none; margin: 0; padding: 0; }
    .step-h { font-size: 20px; outline: none; }
    .stepper { list-style: none; margin: 0; padding: 0; display: flex; gap: 6px; flex-wrap: wrap; }
    .stepper__i { display: flex; align-items: center; gap: 7px; padding: 6px 11px 6px 7px; border-radius: 999px;
      border: 1px solid var(--line); background: var(--surface); color: var(--faint); font-size: 12.5px; font-weight: 600; }
    .stepper__i--current { border-color: var(--brand-500); color: var(--brand-700); background: var(--brand-50); }
    .stepper__i--done { color: var(--text); }
    .stepper__n { width: 20px; height: 20px; border-radius: 50%; display: grid; place-items: center; font-size: 11px;
      background: var(--canvas-2); border: 1px solid var(--line); }
    .stepper__i--current .stepper__n { background: var(--brand-600); border-color: var(--brand-600); color: #fff; }
    .stepper__i--done .stepper__n { background: var(--seed-500); border-color: var(--seed-500); color: #fff; }
    @media (max-width: 560px) { .stepper__i:not(.stepper__i--current) .stepper__l { display: none; } }

    .levels { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
    .level { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; text-align: left; padding: 16px;
      border-radius: 14px; border: 1px solid var(--line); background: var(--surface); color: var(--text); font: inherit; cursor: pointer; }
    .level:hover { border-color: var(--brand-300); }
    .level--on { border-color: var(--brand-500); box-shadow: 0 0 0 3px var(--brand-50); }
    .level__ic { width: 34px; height: 34px; border-radius: 10px; display: grid; place-items: center; background: var(--brand-50); color: var(--brand-600); margin-bottom: 4px; }
    @media (max-width: 760px) { .levels { grid-template-columns: 1fr; } }

    .fs { border: 0; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
    .fs legend { font-size: 13px; font-weight: 650; color: var(--ink); margin-bottom: 8px; padding: 0; }
    .opts { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
    .opts--3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    @media (max-width: 640px) { .opts, .opts--3 { grid-template-columns: 1fr; } }
    .opt { display: flex; gap: 10px; align-items: flex-start; padding: 11px 12px; border-radius: 11px;
      border: 1px solid var(--line); background: var(--surface); cursor: pointer; }
    .opt:hover { border-color: var(--brand-300); }
    .opt--on { border-color: var(--brand-500); background: var(--brand-50); }
    .opt input { margin-top: 3px; accent-color: var(--brand-600); }
    .opt:focus-within { outline: 2px solid var(--brand-500); outline-offset: 2px; }

    .plan { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
    @media (max-width: 640px) { .plan { grid-template-columns: 1fr; } }
    .plan section, section[aria-labelledby^="pl-files"], section[aria-labelledby^="rs-"] { border: 1px solid var(--line); border-radius: 12px; padding: 12px 14px; display: flex; flex-direction: column; gap: 4px; }
    h3 { font-size: 14px; }
    code { font-family: var(--mono); font-size: 12px; background: var(--canvas-2); border: 1px solid var(--line-2); border-radius: 6px; padding: 1px 6px; }
    .files { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
    .files li { display: flex; gap: 10px; align-items: baseline; flex-wrap: wrap; }
    .url { display: block; overflow-wrap: anywhere; padding: 6px 9px; }
    .nsteps { margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 6px; }

    .gen { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
    .gen__i { display: grid; grid-template-columns: 24px 1fr auto; gap: 10px; align-items: center; color: var(--faint); }
    .gen__i--done, .gen__i--current { color: var(--text); }
    .gen__i--current .sm { font-weight: 650; }
    .gen__dot { width: 22px; height: 22px; border-radius: 50%; border: 2px solid var(--line); display: grid; place-items: center; }
    .gen__i--done .gen__dot { background: var(--seed-500); border-color: var(--seed-500); color: #fff; }
    .gen__i--current .gen__dot { border-color: var(--brand-500); animation: livepulse 1.6s infinite; }
    .gen__i--failed .gen__dot { background: var(--rose-500); border-color: var(--rose-500); color: #fff; }
    .danger { background: var(--rose-600); border-color: var(--rose-600); color: #fff; }
  `],
})
export class GeneratePage implements OnDestroy {
  readonly store = inject(Store);
  readonly demo = inject(DemoSettings);
  readonly repo = inject(RepoApi);
  private api = inject(ProjectApi);
  private drafts = inject(WizardDrafts);
  private history = inject(CounselorHistory);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private stepHeading = viewChild<ElementRef<HTMLElement>>('stepHeading');

  readonly levels = LEVELS;
  readonly stacks = STACKS;
  readonly hosts = HOSTS;
  readonly destinations: { key: Destination; label: string; note: string }[] = [
    { key: 'github', label: 'GitHub', note: 'Recommended — your existing account' },
    { key: 'gitlab', label: 'GitLab', note: 'Your existing account' },
    { key: 'zip', label: 'Download as ZIP', note: 'No account needed' },
  ];
  readonly structures: { key: ProjectPrefs['structure']; label: string; note: string }[] = [
    { key: 'feature', label: 'By feature', note: 'Each feature in its own folder' },
    { key: 'layer', label: 'By layer', note: 'Components, services, models' },
    { key: 'monorepo', label: 'Monorepo', note: 'Room for several apps' },
  ];
  readonly envs: { key: ProjectPrefs['envSetup']; label: string; note: string }[] = [
    { key: 'dotenv', label: 'Settings file', note: '.env.example with placeholders' },
    { key: 'devcontainer', label: 'Dev container', note: 'One-click setup in your editor' },
    { key: 'docker', label: 'Docker Compose', note: 'Run everything with one command' },
    { key: 'none', label: 'Nothing extra', note: 'I’ll set it up myself' },
  ];

  private readonly startupId = this.route.snapshot.queryParamMap.get('startup') ?? this.store.activeStartupId();
  readonly s = computed(() => this.store.startup(this.startupId));
  readonly isOwner = computed(() => this.s()?.founderId === ME_ID);
  readonly account = this.repo.account;

  readonly d = signal<WizardDraft | null>(null);
  readonly resumed = signal('');
  readonly review = computed(() => this.history.byId(this.d()?.reviewId));
  readonly steps = computed(() => visibleSteps(this.d()?.level ?? null));
  readonly stepBlocker = computed(() => { const d = this.d(); return d ? blocker(d.step, d, this.account()) : null; });
  readonly plan = computed(() => { const d = this.d(); return d ? buildPlan(d.brief, d.prefs, this.account(), d.level ?? 'guided') : null; });

  readonly connectOpen = signal(false);
  readonly connecting = signal(false);
  readonly connectError = signal('');
  readonly confirmCancel = signal(false);

  readonly stages = signal<GenerationStage[]>([]);
  readonly genIndex = signal(0);
  readonly genError = signal('');
  readonly result = signal<GenerationResult | null>(null);
  readonly live = signal('');
  readonly busy = computed(() => this.d()?.step === 'generating');
  readonly genPct = computed(() => (this.stages().length ? Math.round((this.genIndex() / this.stages().length) * 100) : 0));
  private abort: AbortController | null = null;

  constructor() {
    const s = this.s();
    if (!s || s.founderId !== ME_ID) return;
    const reviewId = this.route.snapshot.queryParamMap.get('review') ?? undefined;
    const rv = this.history.byId(reviewId);
    const saved = this.drafts.load(s.id);
    if (saved) {
      const draft: WizardDraft = { ...saved, step: saved.step === 'generating' || saved.step === 'result' ? 'plan' : saved.step };
      if (rv && rv.id !== saved.reviewId) {
        draft.reviewId = rv.id;
        draft.brief = { ...draft.brief, goals: rv.review.nextSteps.slice() };
      }
      this.d.set(draft);
      this.resumed.set(new Date(saved.updatedAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }));
    } else {
      this.d.set(initialDraft(this.store.me(), s, rv));
    }
  }

  /* ---------- labels ---------- */
  label = (st: StepId) => STEP_LABELS[st];
  state = (st: StepId) => stepState(st, this.d()!.step, this.d()!.level);
  levelTitle = (l: ControlLevel) => LEVELS.find(x => x.key === l)!.title;
  providerName = (p: Destination | RepoProvider) => (p === 'gitlab' ? 'GitLab' : p === 'zip' ? 'ZIP' : 'GitHub');
  heading(st: StepId): string {
    return {
      control: 'How much control do you want?', brief: 'Your project brief', preferences: 'Your preferences',
      repository: 'Where should the code live?', plan: 'Review the plan', generating: 'Generating your project', result: 'Your project is ready',
    }[st];
  }
  lines = (a: string[]) => a.join('\n');
  split = (t: string) => t.split('\n').map(x => x.trim()).filter(Boolean);

  /* ---------- draft updates (auto-saved) ---------- */
  private update(fn: (d: WizardDraft) => WizardDraft, persist = true): void {
    const next = fn(this.d()!);
    this.d.set(next);
    if (persist) this.drafts.save(next);
  }
  patchBrief(p: Partial<ProjectBrief>): void { this.update(d => ({ ...d, brief: { ...d.brief, ...p } })); }
  patchPrefs(p: Partial<ProjectPrefs>): void { this.update(d => ({ ...d, prefs: { ...d.prefs, ...p } })); }
  detachReview(): void { this.update(d => ({ ...d, reviewId: undefined })); }

  /* ---------- navigation ---------- */
  go(step: StepId): void {
    this.update(d => ({ ...d, step }));
    this.focusHeading();
  }

  chooseLevel(level: ControlLevel): void {
    this.update(d => ({ ...d, level, prefs: level === 'autopilot' ? autopilotPrefs(d.prefs, this.store.me().skills) : d.prefs }));
    this.next();
  }

  next(): void {
    const d = this.d()!;
    if (blocker(d.step, d, this.account())) return;
    this.go(nextStep(d.step, d, this.account()));
  }

  back(): void { this.go(prevStep(this.d()!.step, this.d()!)); }

  saveAndExit(): void {
    this.drafts.save(this.d()!);
    this.store.toast('Progress saved — pick up where you left off any time', '💾');
    this.router.navigate(['/build']);
  }

  askCancel(): void { this.confirmCancel.set(true); }

  discard(): void {
    this.drafts.clear(this.d()!.startupId);
    this.confirmCancel.set(false);
    this.store.toast('Project setup discarded', '🗑️');
    this.router.navigate(['/build']);
  }

  startOver(): void {
    const s = this.s()!;
    this.drafts.clear(s.id);
    this.resumed.set('');
    this.result.set(null);
    this.d.set(initialDraft(this.store.me(), s, this.review()));
    this.focusHeading();
  }

  /* ---------- mock OAuth ---------- */
  openConnect(): void { this.connectError.set(''); this.connectOpen.set(true); }
  closeConnect(): void { if (!this.connecting()) this.connectOpen.set(false); }

  async authorize(): Promise<void> {
    const dest = this.d()!.prefs.destination;
    if (dest === 'zip') return;
    this.connecting.set(true);
    this.connectError.set('');
    try {
      await this.repo.connect(dest, this.store.me().handle);
      this.connectOpen.set(false);
      this.store.toast(`Connected to ${this.providerName(dest)} (demo)`, '🔗');
      if (this.d()!.level === 'autopilot' && this.d()!.step === 'repository') this.next();
    } catch (e) {
      this.connectError.set(e instanceof Error ? e.message : 'Connection failed.');
    } finally {
      this.connecting.set(false);
    }
  }

  /* ---------- generation ---------- */
  async startGeneration(): Promise<void> {
    const plan = this.plan();
    const d = this.d();
    if (!plan || !d) return;
    this.stages.set(this.api.stagesFor(plan));
    this.genIndex.set(0);
    this.genError.set('');
    this.go('generating');
    this.abort = new AbortController();
    try {
      const res = await this.api.generate(plan, d.brief, this.review()?.review.nextSteps ?? [], i => {
        this.genIndex.set(i);
        const st = this.stages()[i];
        if (st) this.live.set(`${st.label}…`);
      }, this.abort.signal);
      this.result.set(res);
      this.drafts.clear(d.startupId);
      this.store.addScore('Project generated', 2);
      this.live.set('Your project is ready.');
      this.update(x => ({ ...x, step: 'result' }), false);
      this.focusHeading();
    } catch (e) {
      if (e instanceof CancelledError) {
        this.store.toast('Generation cancelled — nothing was created', '✋');
        this.go('plan');
      } else {
        this.genError.set(e instanceof Error ? e.message : 'Generation failed.');
        this.live.set('Generation failed.');
      }
    } finally {
      this.abort = null;
    }
  }

  cancelGeneration(): void { this.abort?.abort(); }

  genState(i: number): 'done' | 'current' | 'todo' | 'failed' {
    const at = this.genIndex();
    if (this.genError() && i === at) return 'failed';
    return i < at ? 'done' : i === at ? 'current' : 'todo';
  }

  openDemoLink(what: string): void { this.store.toast(`Demo link — no ${what} was actually created`, '🔗'); }
  downloadZip(): void { this.store.toast('Demo — the ZIP download is simulated, no file was created', '📦'); }

  toggleFail(kind: 'connect' | 'generate', on: boolean): void {
    if (on) this.demo.failNext(kind); else this.demo.consumeFailure(kind);
  }

  private focusHeading(): void { setTimeout(() => this.stepHeading()?.nativeElement.focus()); }

  ngOnDestroy(): void { this.abort?.abort(); }
}
