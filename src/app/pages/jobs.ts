import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Job, JobKind } from '../core/models';
import { Store } from '../core/store';
import { UI } from '../ui/ui';

const KIND_META: Record<JobKind, { label: string; tag: string }> = {
  'full-time': { label: 'Full-time', tag: 'tag--brand' },
  'part-time': { label: 'Part-time', tag: 'tag--seed' },
  'contract': { label: 'Contract', tag: 'tag--amber' },
  'co-founder': { label: 'Co-founder', tag: 'tag--rose' },
  'volunteer': { label: 'Volunteer', tag: 'tag--outline' },
};

/* ============================================================
   JOBS BOARD
   ============================================================ */
@Component({
  selector: 'app-jobs-page',
  standalone: true,
  imports: [RouterLink, UI],
  template: `
    <div class="page page--narrow">
      <div class="page-head">
        <div class="col g-6">
          <span class="kicker"><app-icon name="briefcase" [size]="13" /> Talent</span>
          <h1 class="display-lg">Join a startup</h1>
          <span class="muted sm">Roles from founders building in public. You can see their journey before you apply.</span>
        </div>
        <a class="btn btn--primary" routerLink="/jobs/new"><app-icon name="plus" [size]="15" /> Post a role</a>
      </div>

      <div class="row g-6 scroll-x mb-16">
        @for (f of filters; track f.key) {
          <button class="chip chip--sm" [class.chip--on]="filter() === f.key" (click)="filter.set(f.key)">{{ f.label }}</button>
        }
      </div>

      <div class="col g-12">
        @for (j of list(); track j.id) {
          <a class="card card--hover row-t g-12 pad" [routerLink]="['/jobs', j.id]" style="text-decoration:none">
            <app-av [name]="startup(j.startupId)?.name ?? ''" [emoji]="startup(j.startupId)?.emoji ?? ''"
              [gradient]="startup(j.startupId)?.gradient ?? ''" [size]="46" [square]="true" />
            <div class="grow">
              <div class="row between wrap g-8">
                <span class="b">{{ j.title }}</span>
                <span class="tag" [class]="km(j.kind).tag">{{ km(j.kind).label }}</span>
              </div>
              <div class="tiny faint">{{ startup(j.startupId)?.name }} · {{ j.location }}{{ j.remote ? ' · Remote' : '' }}</div>
              <div class="row g-6 wrap mt-4">
                @for (s of j.skills; track s) { <span class="tag tag--outline">{{ s }}</span> }
              </div>
              <div class="row g-10 tiny faint mt-4">
                @if (j.pay) { <span><app-icon name="wallet" [size]="11" style="display:inline" /> {{ j.pay }}</span> }
                @if (j.equity) { <span>📊 {{ j.equity }}</span> }
                <span class="dot-sep"></span>
                <span>{{ j.applicants }} applicants</span>
                <span class="dot-sep"></span>
                <span>{{ j.postedAt }}</span>
                @if (store.hasApplied(j.id)) { <span class="tag tag--seed">Applied ✓</span> }
              </div>
            </div>
            <app-icon name="chevR" [size]="16" class="faint" style="align-self:center" />
          </a>
        }
      </div>

      @if (!list().length) {
        <app-empty icon="briefcase" title="No roles in this filter"
          text="Try another type, or post the first role yourself.">
          <a class="btn btn--primary btn--sm" routerLink="/jobs/new">Post a role</a>
        </app-empty>
      }

      <span class="mock-note mt-16"><app-icon name="lock" [size]="11" /> Applications are simulated — they stay in this browser</span>
    </div>
  `,
})
export class JobsPage {
  readonly store = inject(Store);
  readonly filter = signal('all');
  readonly filters = [
    { key: 'all', label: 'All roles' },
    { key: 'full-time', label: 'Full-time' },
    { key: 'part-time', label: 'Part-time' },
    { key: 'contract', label: 'Contract' },
    { key: 'co-founder', label: 'Co-founder' },
  ];

  readonly list = computed(() => {
    const f = this.filter();
    const all = this.store.openJobs();
    return f === 'all' ? all : all.filter(j => j.kind === f);
  });

  km = (k: JobKind) => KIND_META[k];
  startup = (id: string) => this.store.startup(id);
}

/* ============================================================
   JOB DETAIL + APPLY
   ============================================================ */
@Component({
  selector: 'app-job-page',
  standalone: true,
  imports: [RouterLink, FormsModule, UI],
  template: `
    <div class="page page--narrow">
      @if (job(); as j) {
        <a class="link tiny row g-4 mb-16" routerLink="/jobs"><app-icon name="arrowL" [size]="13" /> All roles</a>
        <div class="wsgrid">
          <div class="col g-16">
            <div class="card col g-14 pad-lg">
              <div class="row g-12">
                <app-av [name]="startup()?.name ?? ''" [emoji]="startup()?.emoji ?? ''" [gradient]="startup()?.gradient ?? ''" [size]="52" [square]="true" />
                <div class="grow">
                  <h2>{{ j.title }}</h2>
                  <div class="tiny faint">
                    <a class="hoverline" [routerLink]="['/s', startup()?.slug]">{{ startup()?.name }}</a>
                    · {{ j.location }}{{ j.remote ? ' · Remote' : '' }}
                  </div>
                </div>
                <span class="tag" [class]="km(j.kind).tag">{{ km(j.kind).label }}</span>
              </div>
              <div class="row g-6 wrap">
                @for (s of j.skills; track s) { <span class="tag tag--brand">{{ s }}</span> }
              </div>
              @if (j.pay || j.equity) {
                <div class="row g-16">
                  @if (j.pay) { <div class="stat"><span class="stat__v">{{ j.pay }}</span><span class="stat__l">compensation</span></div> }
                  @if (j.equity) { <div class="stat"><span class="stat__v">{{ j.equity }}</span><span class="stat__l">equity</span></div> }
                </div>
              }
              <div class="divider"></div>
              <span class="up faint">About the role</span>
              <p class="sm" style="line-height:1.6">{{ j.description }}</p>
            </div>
          </div>

          <div class="col g-16">
            <div class="card col g-12 pad" style="position:sticky;top:16px">
              @if (!store.hasApplied(j.id) && !applied()) {
                <span class="up faint">Apply</span>
                <textarea class="textarea" rows="4" [(ngModel)]="note" placeholder="A short note — why you, and what you'd do in the first two weeks."></textarea>
                <button class="btn btn--primary btn--block" [disabled]="!note.trim()" (click)="apply(j.id)">
                  <app-icon name="send" [size]="15" /> Submit application
                </button>
              } @else {
                <div class="panel panel--seed col g-4">
                  <div class="row g-8"><app-icon name="check" [size]="16" class="seed-text" /><span class="sm b">Application sent</span></div>
                  <span class="tiny muted">The founder will follow up in Messages (simulated).</span>
                </div>
                <a class="btn btn--sm btn--block" routerLink="/messages">Open Messages</a>
              }
              <div class="divider"></div>
              <div class="row between tiny"><span class="muted">Applicants</span><span class="b">{{ j.applicants }}</span></div>
              <div class="row between tiny"><span class="muted">Posted</span><span class="b">{{ j.postedAt }}</span></div>
              <span class="mock-note"><app-icon name="lock" [size]="11" /> Simulated application</span>
            </div>
          </div>
        </div>
      } @else {
        <app-empty icon="briefcase" title="Role not found" text="It may have been filled or removed.">
          <a class="btn btn--primary btn--sm" routerLink="/jobs">Back to jobs</a>
        </app-empty>
      }
    </div>
  `,
  styles: [`
    .wsgrid { display: grid; grid-template-columns: minmax(0,1fr) 300px; gap: 16px; align-items: start; }
    @media (max-width: 1020px) { .wsgrid { grid-template-columns: 1fr; } }
  `],
})
export class JobPage {
  readonly store = inject(Store);
  private route = inject(ActivatedRoute);
  private id = toSignal(this.route.paramMap);

  readonly job = computed(() => this.store.job(this.id()?.get('id') ?? undefined));
  readonly startup = computed(() => { const j = this.job(); return j ? this.store.startup(j.startupId) : undefined; });
  readonly applied = signal(false);
  note = '';

  km = (k: JobKind) => KIND_META[k];

  apply(id: string): void {
    this.store.applyToJob(id, this.note.trim());
    this.applied.set(true);
  }
}

/* ============================================================
   POST A ROLE
   ============================================================ */
@Component({
  selector: 'app-post-job-page',
  standalone: true,
  imports: [RouterLink, FormsModule, UI],
  template: `
    <div class="page page--narrow">
      <a class="link tiny row g-4 mb-16" routerLink="/jobs"><app-icon name="arrowL" [size]="13" /> Back to jobs</a>
      <div class="card card--lg">
        <div class="pad-lg col g-18">
          <div class="col g-6">
            <span class="kicker">Talent</span>
            <h1>Post a role</h1>
            <p class="muted">Hire for {{ store.activeStartup().name }}. It reaches people already following your build.</p>
          </div>
          <div class="grid grid-2">
            <div class="field"><label>Title</label><input class="input" [(ngModel)]="title" placeholder="e.g. Flutter Developer" /></div>
            <div class="field">
              <label>Type</label>
              <select class="select" [(ngModel)]="kind">
                @for (k of kinds; track k) { <option [value]="k">{{ km(k).label }}</option> }
              </select>
            </div>
            <div class="field"><label>Location</label><input class="input" [(ngModel)]="location" placeholder="e.g. Tunis" /></div>
            <div class="field">
              <label class="row g-8" style="cursor:pointer"><input type="checkbox" [(ngModel)]="remote" /> Remote friendly</label>
            </div>
          </div>
          <div class="field"><label>Skills (comma separated)</label><input class="input" [(ngModel)]="skillsRaw" placeholder="Flutter, Offline sync, Maps" /></div>
          <div class="grid grid-2">
            <div class="field"><label>Compensation (optional)</label><input class="input" [(ngModel)]="pay" placeholder="e.g. 3,000 TND for the engagement" /></div>
            <div class="field"><label>Equity (optional)</label><input class="input" [(ngModel)]="equity" placeholder="e.g. 0.5–1%" /></div>
          </div>
          <div class="field"><label>Description</label><textarea class="textarea" rows="5" [(ngModel)]="description"></textarea></div>
          <div class="row between">
            <a class="btn btn--ghost" routerLink="/jobs">Cancel</a>
            <button class="btn btn--primary btn--lg" [disabled]="!title.trim()" (click)="post()">
              <app-icon name="plus" [size]="16" /> Post role
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class PostJobPage {
  readonly store = inject(Store);
  private router = inject(Router);

  readonly kinds: JobKind[] = ['full-time', 'part-time', 'contract', 'co-founder', 'volunteer'];
  title = '';
  kind: JobKind = 'contract';
  location = '';
  remote = true;
  skillsRaw = '';
  pay = '';
  equity = '';
  description = '';

  km = (k: JobKind) => KIND_META[k];

  post(): void {
    const j = this.store.postJob({
      title: this.title.trim(),
      kind: this.kind,
      location: this.location.trim() || 'Remote',
      remote: this.remote,
      skills: this.skillsRaw.split(',').map(s => s.trim()).filter(Boolean),
      description: this.description.trim() || this.title.trim(),
      pay: this.pay.trim() || undefined,
      equity: this.equity.trim() || undefined,
    });
    this.router.navigate(['/jobs', j.id]);
  }
}
