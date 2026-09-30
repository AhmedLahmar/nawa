import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AdminAuth } from '../core/admin';
import { Store } from '../core/store';
import { fmt, UI } from '../ui/ui';

type Tab = 'overview' | 'founders' | 'startups' | 'campaigns' | 'moderation';

interface Stat {
  label: string;
  value: string;
  sub: string;
  icon: string;
  tone: 'brand' | 'seed' | 'amber';
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [RouterLink, UI],
  template: `
    <div class="adm">
      <!-- ---------- top bar ---------- -->
      <header class="adm__top">
        <a class="row g-10" routerLink="/">
          <span class="mark">🌱</span>
          <div>
            <div class="row g-6">
              <span class="bb" style="font-family:var(--display);font-size:16px;letter-spacing:-.03em">Nawa</span>
              <span class="tag tag--brand">Admin</span>
            </div>
            <div class="tiny faint" style="line-height:1">Platform console</div>
          </div>
        </a>
        <div class="grow"></div>
        <a class="btn btn--ghost btn--sm" routerLink="/home"><app-icon name="eye" [size]="15" /> View app</a>
        <span class="row g-8 desktop-only" style="margin:0 4px">
          <app-av [name]="auth.session()?.email ?? 'Admin'" [size]="28" />
          <span class="sm b">{{ auth.session()?.email }}</span>
        </span>
        <button class="btn btn--sm" (click)="logout()"><app-icon name="logout" [size]="15" /> Sign out</button>
      </header>

      <div class="adm__wrap">
        <!-- ---------- title ---------- -->
        <div class="col g-6" style="margin-bottom:18px">
          <h1 class="display-lg">Platform overview</h1>
          <p class="muted">A live snapshot of everything happening on Nawa. Figures are computed from the current demo dataset.</p>
        </div>

        <!-- ---------- stat cards ---------- -->
        <div class="adm__stats">
          @for (s of stats(); track s.label) {
            <div class="card stat">
              <span class="stat__ic" [class]="'stat__ic--' + s.tone"><app-icon [name]="s.icon" [size]="18" /></span>
              <div class="bb" style="font-family:var(--display);font-size:26px;letter-spacing:-.02em;color:var(--ink)">{{ s.value }}</div>
              <div class="sm b">{{ s.label }}</div>
              <div class="tiny muted">{{ s.sub }}</div>
            </div>
          }
        </div>

        <!-- ---------- tabs ---------- -->
        <div class="adm__tabs">
          @for (t of tabs; track t.key) {
            <button class="adm__tab" [class.on]="tab() === t.key" (click)="tab.set(t.key)">
              <app-icon [name]="t.icon" [size]="15" /> {{ t.label }}
            </button>
          }
        </div>

        <!-- ============ OVERVIEW ============ -->
        @if (tab() === 'overview') {
          <div class="grid grid-2" style="gap:16px;align-items:start">
            <div class="card card--lg col g-14 pad">
              <h3>Founders by city</h3>
              @for (row of foundersByCity(); track row.label) {
                <div class="col g-4">
                  <div class="row between sm"><span>{{ row.label }}</span><span class="b mono">{{ row.count }}</span></div>
                  <app-bar [pct]="row.pct" tone="brand" [thin]="true" />
                </div>
              }
            </div>
            <div class="card card--lg col g-14 pad">
              <h3>People by role</h3>
              @for (row of peopleByRole(); track row.label) {
                <div class="col g-4">
                  <div class="row between sm"><span>{{ row.label }}</span><span class="b mono">{{ row.count }}</span></div>
                  <app-bar [pct]="row.pct" [tone]="row.tone" [thin]="true" />
                </div>
              }
            </div>
          </div>
        }

        <!-- ============ FOUNDERS ============ -->
        @if (tab() === 'founders') {
          <div class="card card--lg pad">
            <div class="row between wrap g-10" style="margin-bottom:12px">
              <h3>Founders <span class="faint">· {{ founders().length }}</span></h3>
            </div>
            <div class="tbl-scroll">
              <table class="tbl">
                <thead>
                  <tr><th>Founder</th><th>City</th><th class="num">Score</th><th class="num">Followers</th><th>Status</th></tr>
                </thead>
                <tbody>
                  @for (p of founders(); track p.id) {
                    <tr>
                      <td>
                        <a class="row g-9" [routerLink]="['/u', p.handle]" style="text-decoration:none">
                          <app-av [name]="p.name" [size]="30" [verified]="p.verified" />
                          <div>
                            <div class="sm b" style="color:var(--ink)">{{ p.name }}</div>
                            <div class="tiny faint">{{ p.title }}</div>
                          </div>
                        </a>
                      </td>
                      <td class="sm muted">{{ p.city }}, {{ p.country }}</td>
                      <td class="num b mono">{{ p.founderScore }}</td>
                      <td class="num mono">{{ fmt.k(p.followers) }}</td>
                      <td>
                        @if (p.verified) { <span class="tag tag--seed">Verified</span> }
                        @else { <span class="tag">Unverified</span> }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

        <!-- ============ STARTUPS ============ -->
        @if (tab() === 'startups') {
          <div class="card card--lg pad">
            <div class="row between wrap g-10" style="margin-bottom:12px">
              <h3>Startups <span class="faint">· {{ store.startups().length }}</span></h3>
            </div>
            <div class="tbl-scroll">
              <table class="tbl">
                <thead>
                  <tr><th>Startup</th><th>Industry</th><th>City</th><th class="num">Day</th><th class="num">Followers</th><th>Health</th></tr>
                </thead>
                <tbody>
                  @for (s of store.startups(); track s.id) {
                    <tr>
                      <td>
                        <a class="row g-9" [routerLink]="['/s', s.slug]" style="text-decoration:none">
                          <app-av [name]="s.name" [emoji]="s.emoji" [gradient]="s.gradient" [size]="30" [square]="true" />
                          <span class="sm b" style="color:var(--ink)">{{ s.name }}</span>
                        </a>
                      </td>
                      <td class="sm muted">{{ s.industry }}</td>
                      <td class="sm muted">{{ s.city }}</td>
                      <td class="num mono">{{ s.day }}</td>
                      <td class="num mono">{{ fmt.k(s.followers) }}</td>
                      <td><span class="tag" [class]="healthClass(s.health)">{{ s.health }}</span></td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

        <!-- ============ CAMPAIGNS ============ -->
        @if (tab() === 'campaigns') {
          <div class="card card--lg pad">
            <div class="row between wrap g-10" style="margin-bottom:12px">
              <h3>Community rounds <span class="faint">· {{ store.campaigns().length }}</span></h3>
              <span class="tag tag--seed">{{ fmt.money(totalRaised()) }} raised total</span>
            </div>
            <div class="tbl-scroll">
              <table class="tbl">
                <thead>
                  <tr><th>Campaign</th><th class="num">Raised</th><th class="num">Goal</th><th style="width:150px">Progress</th><th class="num">Backers</th><th>Status</th></tr>
                </thead>
                <tbody>
                  @for (c of store.campaigns(); track c.id) {
                    <tr>
                      <td>
                        <a [routerLink]="['/fund', c.id]" style="text-decoration:none">
                          <span class="sm b" style="color:var(--ink)">{{ startupName(c.startupId) }}</span>
                          <div class="tiny faint" style="max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ c.headline }}</div>
                        </a>
                      </td>
                      <td class="num b mono">{{ fmt.k(c.raised) }}</td>
                      <td class="num mono faint">{{ fmt.k(c.goal) }}</td>
                      <td>
                        <div class="col g-4">
                          <app-bar [pct]="pct(c.raised, c.goal)" tone="seed" [thin]="true" />
                          <span class="tiny mono faint">{{ pct(c.raised, c.goal) }}%</span>
                        </div>
                      </td>
                      <td class="num mono">{{ c.backers }}</td>
                      <td><span class="tag" [class.tag--seed]="c.status === 'live'">{{ c.status }}</span></td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

        <!-- ============ MODERATION / MAINTENANCE ============ -->
        @if (tab() === 'moderation') {
          <div class="grid grid-2" style="gap:16px;align-items:start">
            <div class="card card--lg col g-14 pad">
              <h3>Content volume</h3>
              @for (row of contentVolume(); track row.label) {
                <div class="row between sm" style="padding:8px 0;border-bottom:1px solid var(--line-2)">
                  <span class="row g-8"><app-icon [name]="row.icon" [size]="15" class="faint" /> {{ row.label }}</span>
                  <span class="b mono">{{ row.value }}</span>
                </div>
              }
            </div>
            <div class="card card--lg col g-14 pad">
              <h3>Maintenance</h3>
              <p class="sm muted">These controls operate on the local demo dataset only. Nothing here touches a real server or real users.</p>
              <div class="panel panel--amber row-t g-10">
                <app-icon name="alert" [size]="16" class="amber-text" />
                <span class="sm">Resetting restores every founder, startup, campaign and post to the original seed data and signs demo users back to their starting state.</span>
              </div>
              <button class="btn btn--block" (click)="confirmReset()">
                <app-icon name="refresh" [size]="15" /> Reset demo data
              </button>
              @if (resetAsked()) {
                <div class="panel panel--rose col g-10">
                  <span class="sm b">Reset all demo data?</span>
                  <div class="row g-8">
                    <button class="btn btn--sm adm-danger" (click)="doReset()">Yes, reset everything</button>
                    <button class="btn btn--sm btn--ghost" (click)="resetAsked.set(false)">Cancel</button>
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <div class="tiny faint center" style="margin:26px 0 10px">
          <app-icon name="lock" [size]="11" /> Concept demo · admin authentication and all figures are simulated in the browser
        </div>
      </div>
    </div>
  `,
  styles: [`
    .adm { min-height: 100vh; background: var(--canvas); }
    .adm__top { position: sticky; top: 0; z-index: 20; height: 60px; display: flex; align-items: center;
      gap: 10px; padding: 0 clamp(14px, 3vw, 28px); background: var(--surface);
      border-bottom: 1px solid var(--line); }
    .adm__wrap { max-width: 1120px; margin: 0 auto; padding: clamp(18px, 3vw, 30px) clamp(14px, 3vw, 28px) 40px; }
    .mark { width: 30px; height: 30px; border-radius: 9px; display: grid; place-items: center;
      background: linear-gradient(140deg, #14b87a, #5a46f0 120%); font-size: 15px; flex: none; }

    .adm__stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
    .stat { padding: 16px; display: flex; flex-direction: column; gap: 4px; }
    .stat__ic { width: 34px; height: 34px; border-radius: 10px; display: grid; place-items: center;
      margin-bottom: 6px; }
    .stat__ic--brand { background: var(--brand-50); color: var(--brand-600); }
    .stat__ic--seed { background: var(--seed-100); color: var(--seed-600); }
    .stat__ic--amber { background: var(--amber-100); color: var(--amber-600); }

    .adm__tabs { display: flex; gap: 6px; flex-wrap: wrap; margin: 22px 0 16px; }
    .adm__tab { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 999px;
      border: 1px solid var(--line-2); background: var(--surface); color: var(--muted);
      font: inherit; font-size: 13.5px; font-weight: 560; cursor: pointer; }
    .adm__tab:hover { color: var(--ink); }
    .adm__tab.on { background: var(--ink); color: var(--surface); border-color: var(--ink); }

    .tbl-scroll { overflow-x: auto; }
    .tbl { width: 100%; border-collapse: collapse; font-size: 13.5px; }
    .tbl th { text-align: left; padding: 8px 12px; font-size: 11px; text-transform: uppercase;
      letter-spacing: .04em; color: var(--faint); font-weight: 600; border-bottom: 1px solid var(--line-2); }
    .tbl td { padding: 10px 12px; border-bottom: 1px solid var(--line-2); vertical-align: middle; }
    .tbl tbody tr:last-child td, .tbl tbody tr:last-child td { border-bottom: 0; }
    .tbl .num { text-align: right; }
    .tbl th.num { text-align: right; }

    .adm-danger { background: var(--rose-600); border-color: var(--rose-600); color: #fff; }
    .adm-danger:hover { filter: brightness(0.94); }

    @media (max-width: 900px) {
      .adm__stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
  `],
})
export class AdminDashboard {
  readonly store = inject(Store);
  readonly auth = inject(AdminAuth);
  private router = inject(Router);
  readonly fmt = fmt;

  readonly tab = signal<Tab>('overview');
  readonly resetAsked = signal(false);

  readonly tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'overview', label: 'Overview', icon: 'chart' },
    { key: 'founders', label: 'Founders', icon: 'users' },
    { key: 'startups', label: 'Startups', icon: 'rocket' },
    { key: 'campaigns', label: 'Campaigns', icon: 'dollar' },
    { key: 'moderation', label: 'Maintenance', icon: 'shield' },
  ];

  readonly founders = computed(() =>
    this.store.people().filter(p => p.role === 'founder')
      .slice().sort((a, b) => b.founderScore - a.founderScore));

  readonly totalRaised = computed(() =>
    this.store.campaigns().reduce((n, c) => n + c.raised, 0));

  readonly stats = computed<Stat[]>(() => {
    const people = this.store.people();
    return [
      { label: 'Founders', value: fmt.n(this.founders().length), sub: `${people.length} total members`, icon: 'users', tone: 'brand' },
      { label: 'Startups', value: fmt.n(this.store.startups().length), sub: 'building in public', icon: 'rocket', tone: 'seed' },
      { label: 'Raised', value: fmt.k(this.totalRaised()) + ' TND', sub: `${this.store.campaigns().length} community rounds`, icon: 'dollar', tone: 'amber' },
      { label: 'Experts', value: fmt.n(this.store.experts().length), sub: `${this.store.incubators().length} incubators`, icon: 'cap', tone: 'brand' },
      { label: 'Posts', value: fmt.n(this.store.posts().length), sub: 'build-in-public updates', icon: 'chart', tone: 'seed' },
      { label: 'Open roles', value: fmt.n(this.store.openJobs().length), sub: `${this.store.jobs().length} posted`, icon: 'briefcase', tone: 'amber' },
      { label: 'Live now', value: fmt.n(this.store.liveNow().length), sub: `${this.store.livestreams().length} streams`, icon: 'video', tone: 'brand' },
      { label: 'Products', value: fmt.n(this.store.products().length), sub: 'in marketplace', icon: 'wallet', tone: 'seed' },
    ];
  });

  readonly foundersByCity = computed(() => {
    const counts = new Map<string, number>();
    for (const p of this.founders()) counts.set(p.city, (counts.get(p.city) ?? 0) + 1);
    const rows = [...counts.entries()].map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);
    const max = Math.max(1, ...rows.map(r => r.count));
    return rows.map(r => ({ ...r, pct: Math.round((r.count / max) * 100) }));
  });

  readonly peopleByRole = computed(() => {
    const order: { key: string; label: string; tone: 'brand' | 'seed' | 'amber' }[] = [
      { key: 'founder', label: 'Founders', tone: 'brand' },
      { key: 'supporter', label: 'Supporters', tone: 'seed' },
      { key: 'expert', label: 'Experts', tone: 'amber' },
      { key: 'incubator', label: 'Incubators', tone: 'brand' },
    ];
    const people = this.store.people();
    const max = Math.max(1, ...order.map(o => people.filter(p => p.role === o.key).length));
    return order.map(o => {
      const count = people.filter(p => p.role === o.key).length;
      return { label: o.label, count, tone: o.tone, pct: Math.round((count / max) * 100) };
    });
  });

  readonly contentVolume = computed(() => [
    { label: 'Posts', value: fmt.n(this.store.posts().length), icon: 'chart' },
    { label: 'Message threads', value: fmt.n(this.store.threads().length), icon: 'message' },
    { label: 'Chat rooms', value: fmt.n(this.store.rooms().length), icon: 'users' },
    { label: 'Challenges', value: fmt.n(this.store.challenges().length), icon: 'flag' },
    { label: 'Events', value: fmt.n(this.store.events().length), icon: 'calendar' },
    { label: 'Marketplace orders', value: fmt.n(this.store.orders().length), icon: 'wallet' },
    { label: 'Donations', value: fmt.n(this.store.donations().length), icon: 'gift' },
  ]);

  pct = (a: number, b: number) => fmt.pct(a, b);
  startupName = (id: string) => this.store.startup(id)?.name ?? 'Unknown startup';
  healthClass = (h?: string) => h === 'ok' ? 'tag--seed' : h === 'warn' ? 'tag--amber' : h === 'risk' ? 'tag--rose' : '';

  confirmReset(): void { this.resetAsked.set(true); }

  doReset(): void {
    this.store.resetDemo();
    this.resetAsked.set(false);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/admin/login']);
  }
}
